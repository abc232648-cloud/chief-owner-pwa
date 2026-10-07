import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  WorkerReportItem, 
  WorkerReportCategory, 
  WorkerReportStatus, 
  WorkerReportAttachment 
} from '../types/workerReport';
import { 
  INITIAL_SAMPLE_WORKER_REPORTS, 
  WORKER_REPORT_CATEGORIES 
} from '../data/workerReportCategories';
import { useAuth } from './AuthContext';
import { useChief } from './ChiefContext';
import { chiefApi, ChiefApiError } from '../api';

import { isChiefDevMode } from '../config/devMode';

const STORAGE_KEY = 'chief_worker_reports_v1';

/**
 * Validates whether an error represents an explicit, authoritative Chief validation/policy rejection.
 * Client validation errors, generic JS errors, HTTP 5xx, 401, 403, 404, network drops, or malformed payloads
 * must NEVER be converted to an authoritative Chief rejection.
 */
function isExplicitChiefRejection(err: unknown): err is ChiefApiError {
  if (!(err instanceof ChiefApiError)) {
    return false;
  }
  // Local/client validation errors are NEVER an authoritative Chief decision
  if (err.origin === 'client' || err.code === 'CLIENT_VALIDATION_ERROR') {
    return false;
  }
  if (
    err.isNetworkError ||
    err.isTimeout ||
    err.isAborted ||
    !err.statusCode ||
    err.statusCode >= 500 ||
    err.statusCode === 401 ||
    err.statusCode === 403 ||
    err.statusCode === 404
  ) {
    return false;
  }
  return (
    err.statusCode === 422 ||
    err.code === 'POLICY_REJECTION' ||
    err.code === 'THRESHOLD_BREACH' ||
    err.code === 'MISSING_MANDATORY_FIELD'
  );
}

interface WorkerReportContextType {
  reports: WorkerReportItem[];
  queuedCount: number;
  isSyncingQueue: boolean;
  lastSubmittedReport: WorkerReportItem | null;
  submitReport: (
    category: WorkerReportCategory,
    data: Record<string, any>,
    evidenceAttachments: WorkerReportAttachment[],
    summary: string
  ) => Promise<{ success: boolean; report: WorkerReportItem }>;
  syncQueuedReports: () => Promise<{ syncedCount: number; failedCount: number }>;
  retryReport: (id: string) => Promise<boolean>;
  deleteReport: (id: string) => void;
  clearResolvedReports: () => void;
}

const WorkerReportContext = createContext<WorkerReportContextType | undefined>(undefined);

export const WorkerReportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { state: chiefState } = useChief();
  const isDev = isChiefDevMode();

  // Load from local storage or empty array in production
  // BATCH 13B.3: Fresh production worker report store MUST be empty
  const [reports, setReports] = useState<WorkerReportItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore JSON parse or storage errors
    }
    // Production fresh install MUST start empty
    if (!isDev) {
      return [];
    }
    return INITIAL_SAMPLE_WORKER_REPORTS;
  });

  const [isSyncingQueue, setIsSyncingQueue] = useState(false);
  const [lastSubmittedReport, setLastSubmittedReport] = useState<WorkerReportItem | null>(null);

  // Sync state to local storage whenever reports update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch {
      // Storage quota or private mode protection
    }
  }, [reports]);

  // Count items queued offline
  const queuedCount = reports.filter(r => r.status === 'queued').length;

  // Single report submission handler
  const submitReport = useCallback(async (
    category: WorkerReportCategory,
    data: Record<string, any>,
    evidenceAttachments: WorkerReportAttachment[],
    summary: string
  ): Promise<{ success: boolean; report: WorkerReportItem }> => {
    // BATCH 13B.3: Worker identity must require genuine authenticated actor.
    // If no authenticated identity exists, block submission. NEVER invent worker identity.
    if (!user || !user.userId || !user.name) {
      throw new Error('Authenticated worker identity required.');
    }

    const categoryMeta = WORKER_REPORT_CATEGORIES.find(c => c.id === category);
    const categoryLabel = categoryMeta?.title || category;
    const now = new Date();
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const reportNumber = `RPT-2026-${randNum}`;
    const reportId = `rep-${Date.now()}-${randNum}`;

    // Genuine authenticated worker attribution (no fabricated default fallback)
    const workerId = user.userId;
    const workerName = user.name;
    const workerRole = user.role === 'worker' 
      ? 'Field Poultry Specialist' 
      : user.role === 'manager' 
      ? 'Operations Manager' 
      : user.role === 'owner'
      ? 'Farm Owner'
      : 'Field Specialist';

    // Step 1: Initialize in 'saved_locally' state
    const initialReport: WorkerReportItem = {
      id: reportId,
      reportNumber,
      category,
      status: 'saved_locally',
      createdAt: now.toISOString(),
      timestampFormatted: `Today at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      workerId,
      workerName,
      workerRole,
      categoryLabel,
      summary,
      data,
      evidenceAttachments,
      syncAttempts: 0
    };

    // Save locally immediately
    setReports(prev => [initialReport, ...prev]);
    setLastSubmittedReport(initialReport);

    // Client-side validation: must NOT be called a Chief rejection
    if (category === 'mortality' && (data.mortalityCount < 0 || data.mortalityCount === undefined)) {
      const rejectedReport: WorkerReportItem = {
        ...initialReport,
        status: 'rejected_needs_correction',
        errorOrigin: 'client',
        rejectionReason: 'Input needs correction — Validated locally. No Chief decision has been made: Mortality count cannot be empty or negative.'
      };
      setReports(prev => prev.map(r => r.id === reportId ? rejectedReport : r));
      setLastSubmittedReport(rejectedReport);
      return { success: false, report: rejectedReport };
    }

    if (category === 'emergency' && (!data.immediateActionTaken || String(data.immediateActionTaken).trim().length < 5)) {
      const rejectedReport: WorkerReportItem = {
        ...initialReport,
        status: 'rejected_needs_correction',
        errorOrigin: 'client',
        rejectionReason: 'Input needs correction — Validated locally. No Chief decision has been made: Emergency broadcast requires documented immediate containment action taken.'
      };
      setReports(prev => prev.map(r => r.id === reportId ? rejectedReport : r));
      setLastSubmittedReport(rejectedReport);
      return { success: false, report: rejectedReport };
    }

    // Step 2: Check connectivity. If offline, transition directly to 'queued'
    const isNetworkOffline = !navigator.onLine || chiefState.connectivity === 'offline';
    if (isNetworkOffline) {
      const queuedReport: WorkerReportItem = {
        ...initialReport,
        status: 'queued',
        isQueuedOffline: true
      };
      setReports(prev => prev.map(r => r.id === reportId ? queuedReport : r));
      setLastSubmittedReport(queuedReport);
      return { success: true, report: queuedReport };
    }

    // Step 3: Online submission — transition to 'syncing'
    const syncingReport: WorkerReportItem = {
      ...initialReport,
      status: 'syncing',
      syncAttempts: 1
    };
    setReports(prev => prev.map(r => r.id === reportId ? syncingReport : r));
    setLastSubmittedReport(syncingReport);

    try {
      // Backend authority call via Chief API adapter
      const res = await chiefApi.farm.submitWorkerReport(syncingReport);

      // Validate positive backend acceptance
      if (!res || !res.data || res.data.status !== 'accepted' || !res.data.verificationHash) {
        throw new ChiefApiError({
          message: 'Backend response missing valid acceptance proof',
          code: 'UNCONFIRMED_REPORT'
        });
      }

      // Backend confirmed: Seal accepted_by_chief ONLY on real response
      const acceptedReport: WorkerReportItem = {
        ...syncingReport,
        status: 'accepted_by_chief',
        backendConfirmationHash: res.data.verificationHash,
        correlationId: res.correlationId,
        backendConfirmedAt: `Today at ${new Date().toLocaleTimeString()}`,
        isQueuedOffline: false
      };
      setReports(prev => prev.map(r => r.id === reportId ? acceptedReport : r));
      setLastSubmittedReport(acceptedReport);
      return { success: true, report: acceptedReport };
    } catch (err: unknown) {
      // Check for client-side validation error
      if (err instanceof ChiefApiError && (err.origin === 'client' || err.code === 'CLIENT_VALIDATION_ERROR')) {
        const clientValReport: WorkerReportItem = {
          ...syncingReport,
          status: 'rejected_needs_correction',
          errorOrigin: 'client',
          rejectionReason: `Input needs correction — Validated locally. No Chief decision has been made: ${err.message}`
        };
        setReports(prev => prev.map(r => r.id === reportId ? clientValReport : r));
        setLastSubmittedReport(clientValReport);
        return { success: false, report: clientValReport };
      }

      if (isExplicitChiefRejection(err)) {
        // Only explicit Chief validation or policy rejection produces rejected_needs_correction with chief origin
        const errorMsg = err.message || 'Report rejected by Chief Policy Engine.';
        const rejectedReport: WorkerReportItem = {
          ...syncingReport,
          status: 'rejected_needs_correction',
          errorOrigin: 'chief',
          rejectionReason: `Rejected by Chief: ${errorMsg}`
        };
        setReports(prev => prev.map(r => r.id === reportId ? rejectedReport : r));
        setLastSubmittedReport(rejectedReport);
        return { success: false, report: rejectedReport };
      }

      // Unknown errors, generic JS errors, HTTP 5xx, 401, 403, 404, network drops, malformed responses
      // MUST NOT imply an authoritative Chief rejection: keep/revert report to queued
      const queuedReport: WorkerReportItem = {
        ...syncingReport,
        status: 'queued',
        isQueuedOffline: true,
        rejectionReason: undefined
      };
      setReports(prev => prev.map(r => r.id === reportId ? queuedReport : r));
      setLastSubmittedReport(queuedReport);
      return { success: true, report: queuedReport };
    }
  }, [user, chiefState.connectivity]);

  // Retry an individual report
  const retryReport = useCallback(async (id: string): Promise<boolean> => {
    const target = reports.find(r => r.id === id);
    if (!target) return false;

    // Check connectivity
    if (!navigator.onLine || chiefState.connectivity === 'offline') {
      return false;
    }

    // Set to syncing
    setReports(prev => prev.map(r => 
      r.id === id 
        ? { ...r, status: 'syncing', syncAttempts: (r.syncAttempts || 0) + 1, rejectionReason: undefined } 
        : r
    ));

    try {
      const res = await chiefApi.farm.submitWorkerReport(target);

      // Validate positive backend acceptance
      if (!res || !res.data || res.data.status !== 'accepted' || !res.data.verificationHash) {
        throw new ChiefApiError({
          message: 'Backend response missing valid acceptance proof',
          code: 'UNCONFIRMED_REPORT'
        });
      }

      setReports(prev => prev.map(r => 
        r.id === id 
          ? { 
              ...r, 
              status: 'accepted_by_chief', 
              backendConfirmationHash: res.data.verificationHash,
              correlationId: res.correlationId,
              backendConfirmedAt: `Today at ${new Date().toLocaleTimeString()}`,
              isQueuedOffline: false,
              rejectionReason: undefined
            } 
          : r
      ));
      return true;
    } catch (err: unknown) {
      if (err instanceof ChiefApiError && (err.origin === 'client' || err.code === 'CLIENT_VALIDATION_ERROR')) {
        setReports(prev => prev.map(r => 
          r.id === id 
            ? { 
                ...r, 
                status: 'rejected_needs_correction', 
                errorOrigin: 'client', 
                rejectionReason: `Input needs correction — Validated locally. No Chief decision has been made: ${err.message}` 
              } 
            : r
        ));
        return false;
      }

      if (isExplicitChiefRejection(err)) {
        const errorMsg = err.message || 'Report rejected by Chief Policy Engine.';
        setReports(prev => prev.map(r => 
          r.id === id 
            ? { ...r, status: 'rejected_needs_correction', errorOrigin: 'chief', rejectionReason: `Rejected by Chief: ${errorMsg}` } 
            : r
        ));
        return false;
      }

      // Non-rejection error: remain queued without false rejection
      setReports(prev => prev.map(r => 
        r.id === id 
          ? { ...r, status: 'queued', isQueuedOffline: true, rejectionReason: undefined } 
          : r
      ));
      return false;
    }
  }, [reports, chiefState.connectivity]);

  // Flush all queued reports
  const syncQueuedReports = useCallback(async (): Promise<{ syncedCount: number; failedCount: number }> => {
    const queuedItems = reports.filter(r => r.status === 'queued');
    if (queuedItems.length === 0) return { syncedCount: 0, failedCount: 0 };

    if (!navigator.onLine || chiefState.connectivity === 'offline') {
      return { syncedCount: 0, failedCount: queuedItems.length };
    }

    setIsSyncingQueue(true);
    let synced = 0;
    let failed = 0;

    for (const item of queuedItems) {
      try {
        setReports(prev => prev.map(r => r.id === item.id ? { ...r, status: 'syncing' } : r));
        const res = await chiefApi.farm.submitWorkerReport(item);

        // Validate positive backend acceptance
        if (!res || !res.data || res.data.status !== 'accepted' || !res.data.verificationHash) {
          throw new ChiefApiError({
            message: 'Backend response missing valid acceptance proof',
            code: 'UNCONFIRMED_REPORT'
          });
        }

        setReports(prev => prev.map(r => 
          r.id === item.id 
            ? { 
                ...r, 
                status: 'accepted_by_chief', 
                backendConfirmationHash: res.data.verificationHash,
                correlationId: res.correlationId,
                backendConfirmedAt: `Today at ${new Date().toLocaleTimeString()}`,
                isQueuedOffline: false 
              } 
            : r
        ));
        synced++;
      } catch (err: unknown) {
        failed++;
        if (err instanceof ChiefApiError && (err.origin === 'client' || err.code === 'CLIENT_VALIDATION_ERROR')) {
          setReports(prev => prev.map(r => 
            r.id === item.id 
              ? { 
                  ...r, 
                  status: 'rejected_needs_correction', 
                  errorOrigin: 'client', 
                  syncAttempts: (r.syncAttempts || 0) + 1, 
                  rejectionReason: `Input needs correction — Validated locally. No Chief decision has been made: ${err.message}` 
                } 
              : r
          ));
        } else if (isExplicitChiefRejection(err)) {
          // Explicit Chief rejection
          const errorMsg = err.message || 'Sync rejected by Chief';
          setReports(prev => prev.map(r => 
            r.id === item.id 
              ? { 
                  ...r, 
                  status: 'rejected_needs_correction', 
                  errorOrigin: 'chief', 
                  syncAttempts: (r.syncAttempts || 0) + 1, 
                  rejectionReason: `Rejected by Chief: ${errorMsg}` 
                } 
              : r
          ));
        } else {
          // Non-rejection (network, timeout, 5xx, auth, unknown) -> keep queued
          setReports(prev => prev.map(r => 
            r.id === item.id 
              ? { ...r, status: 'queued', syncAttempts: (r.syncAttempts || 0) + 1, isQueuedOffline: true, rejectionReason: undefined } 
              : r
          ));
        }
      }
    }

    setIsSyncingQueue(false);
    return { syncedCount: synced, failedCount: failed };
  }, [reports, chiefState.connectivity]);

  // Auto-sync when network or connectivity changes to online
  useEffect(() => {
    if (navigator.onLine && chiefState.connectivity === 'online' && queuedCount > 0 && !isSyncingQueue) {
      // Trigger background flush
      syncQueuedReports();
    }
  }, [chiefState.connectivity, queuedCount, isSyncingQueue, syncQueuedReports]);

  const deleteReport = (id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
  };

  const clearResolvedReports = () => {
    setReports(prev => prev.filter(r => r.status !== 'accepted_by_chief'));
  };

  return (
    <WorkerReportContext.Provider
      value={{
        reports,
        queuedCount,
        isSyncingQueue,
        lastSubmittedReport,
        submitReport,
        syncQueuedReports,
        retryReport,
        deleteReport,
        clearResolvedReports
      }}
    >
      {children}
    </WorkerReportContext.Provider>
  );
};

export const useWorkerReports = (): WorkerReportContextType => {
  const context = useContext(WorkerReportContext);
  if (!context) {
    throw new Error('useWorkerReports must be used within a WorkerReportProvider');
  }
  return context;
};
