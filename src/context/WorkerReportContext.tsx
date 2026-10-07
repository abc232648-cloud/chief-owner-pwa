import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  WorkerReportAttachment,
  WorkerReportCategory,
  WorkerReportItem
} from '../types/workerReport';
import { INITIAL_SAMPLE_WORKER_REPORTS, WORKER_REPORT_CATEGORIES } from '../data/workerReportCategories';
import { useAuth } from './AuthContext';
import { useChief } from './ChiefContext';
import { chiefApi, ChiefApiError } from '../api';
import { isChiefDevMode } from '../config/devMode';
import { reportStorage } from '../storage';

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
  deleteReport: (id: string) => Promise<void>;
  clearResolvedReports: () => Promise<void>;
}

const WorkerReportContext = createContext<WorkerReportContextType | undefined>(undefined);

function isExplicitChiefRejection(err: unknown): err is ChiefApiError {
  if (!(err instanceof ChiefApiError) || err.origin !== 'chief') return false;
  if (
    err.isNetworkError ||
    err.isTimeout ||
    err.isAborted ||
    !err.statusCode ||
    err.statusCode >= 500 ||
    err.statusCode === 401 ||
    err.statusCode === 403 ||
    err.statusCode === 404
  ) return false;

  return (
    err.statusCode === 422 ||
    err.code === 'POLICY_REJECTION' ||
    err.code === 'THRESHOLD_BREACH' ||
    err.code === 'MISSING_MANDATORY_FIELD' ||
    err.code === 'VALIDATION_ERROR'
  );
}

function getClientValidationError(
  category: WorkerReportCategory,
  data: Record<string, any>,
  isDev: boolean
): string | null {
  switch (category) {
    case 'mortality':
      if (!data.houseNumber) return 'Flock housing unit must be selected.';
      if (data.mortalityCount === undefined || data.mortalityCount === null || data.mortalityCount < 0) return 'Mortality count cannot be empty or negative.';
      if (!data.suspectedCause) return 'Suspected cause of mortality must be selected.';
      if (!data.disposalMethod) return 'Biosecure disposal method must be selected.';
      return null;
    case 'feed':
      if (!data.siloId && !data.houseNumber) return 'Feed silo and barn must be selected.';
      if (data.binLevelPct === undefined || data.binLevelPct === null) return 'Silo level estimate must be selected.';
      if (!data.feedCondition) return 'Physical condition of feed must be selected.';
      if (data.feederLinesOperational === undefined || data.feederLinesOperational === null) return 'Feeder lines operational status must be selected.';
      return null;
    case 'water':
      if (!data.houseNumber) return 'Barn location must be selected.';
      if (data.meterReadingLiters === undefined || data.meterReadingLiters === null || data.meterReadingLiters < 0) return 'Header meter reading (liters) cannot be empty.';
      if (data.pressureGaugeReadingPsi === undefined || data.pressureGaugeReadingPsi === null || data.pressureGaugeReadingPsi < 0) return 'Line pressure (PSI) cannot be empty.';
      if (!data.drinkerStatus) return 'Drinker line status must be selected.';
      return null;
    case 'egg_production':
      if (!data.houseNumber) return 'Housing unit must be selected.';
      if (!data.shift) return 'Collection shift must be selected.';
      if (data.traysCollected === undefined || data.traysCollected === null || data.traysCollected < 0) return 'Trays collected count cannot be empty.';
      return null;
    case 'flock_observation':
      if (!data.houseNumber) return 'Housing unit must be selected.';
      if (!data.activityLevel) return 'Bird activity must be selected.';
      if (!data.droppingsCondition) return 'Droppings condition must be selected.';
      if (!data.litterMoistureCondition) return 'Litter condition must be selected.';
      return null;
    case 'equipment_fault':
      if (!data.urgency) return 'Urgency level must be selected.';
      if (!data.faultType) return 'Fault type must be selected.';
      if (!data.description || String(data.description).trim().length < 3) return 'Fault description cannot be empty.';
      return null;
    case 'task_completion':
      if (!isDev) return 'No authoritative Farm tasks available.';
      if (!data.taskId) return 'Assigned field task must be selected.';
      if (!data.completionMinutes || data.completionMinutes <= 0) return 'Time spent must be greater than zero.';
      return null;
    case 'environmental_issue':
      if (!data.houseNumber) return 'Housing unit must be selected.';
      if (data.temperatureC === undefined || data.temperatureC === null) return 'Temperature cannot be empty.';
      if (data.relativeHumidityPct === undefined || data.relativeHumidityPct === null) return 'Relative humidity cannot be empty.';
      if (!data.ammoniaRating) return 'Ammonia rating must be selected.';
      return null;
    case 'emergency':
      if (!data.emergencyType) return 'Emergency category must be selected.';
      if (!data.immediateActionTaken || String(data.immediateActionTaken).trim().length < 5) return 'Document the immediate action taken.';
      return null;
    case 'photo_evidence':
      if (!isDev) return 'Photo upload capability is not provisioned in production.';
      return null;
  }
}

/**
 * Removes fields the current UI infers rather than receives from an authoritative source
 * or explicit operator input. This is a final client-side truth boundary before persistence
 * and before any Chief API call.
 */
function sanitizeReportData(
  category: WorkerReportCategory,
  input: Record<string, any>,
  authenticatedName: string,
  isDev: boolean
): Record<string, any> {
  const data = { ...input };

  if (category === 'mortality') {
    delete data.flockId;
    delete data.immediateInterlockNeeded;
  }

  if (category === 'equipment_fault' && data.equipmentId === 'eq-field') {
    delete data.equipmentId;
  }

  if (category === 'emergency') {
    delete data.physicalInterlockTripped;
    delete data.requiresSupervisorDispatch;
  }

  if (category === 'task_completion') {
    if (!isDev) {
      delete data.taskTitle;
    }
    data.workerSignOff = authenticatedName;
  }

  return data;
}

async function persistOrThrow(report: WorkerReportItem, userId: string, message: string): Promise<void> {
  const result = await reportStorage.save(report, userId);
  if (!result.success) {
    throw new Error(`${message} No Chief decision occurred.`);
  }
}

export const WorkerReportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { state: chiefState } = useChief();
  const isDev = isChiefDevMode();

  const [reports, setReports] = useState<WorkerReportItem[]>(() => isDev ? INITIAL_SAMPLE_WORKER_REPORTS : []);
  const [isReportsLoaded, setIsReportsLoaded] = useState(false);
  const [isSyncingQueue, setIsSyncingQueue] = useState(false);
  const [lastSubmittedReport, setLastSubmittedReport] = useState<WorkerReportItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsReportsLoaded(false);

    void reportStorage.getAll(user?.userId ?? null).then(stored => {
      if (cancelled) return;
      if (stored.length > 0) setReports(stored);
      else setReports(isDev ? INITIAL_SAMPLE_WORKER_REPORTS : []);
      setIsReportsLoaded(true);
    }).catch(error => {
      console.warn('[WorkerReportContext] Failed to load reports:', error);
      if (!cancelled) {
        setReports(isDev ? INITIAL_SAMPLE_WORKER_REPORTS : []);
        setIsReportsLoaded(true);
      }
    });

    return () => { cancelled = true; };
  }, [user?.userId, isDev]);

  // Storage layer independently rejects namespace/ownership mismatches. This effect is
  // only state synchronization; operation-level success always awaits its own durable write.
  useEffect(() => {
    if (!isReportsLoaded) return;
    void reportStorage.saveAll(reports, user?.userId ?? null);
  }, [reports, isReportsLoaded, user?.userId]);

  const queuedCount = reports.filter(report => report.status === 'queued').length;

  const submitReport = useCallback(async (
    category: WorkerReportCategory,
    rawData: Record<string, any>,
    evidenceAttachments: WorkerReportAttachment[],
    summary: string
  ): Promise<{ success: boolean; report: WorkerReportItem }> => {
    if (!user?.userId || !user.name) throw new Error('Authenticated worker identity required.');

    const data = sanitizeReportData(category, rawData, user.name, isDev);
    const validationError = getClientValidationError(category, data, isDev);
    const now = new Date();
    const nonce = Math.floor(1000 + Math.random() * 9000);
    const reportId = `local-report-${Date.now()}-${nonce}`;
    const reportNumber = `LOCAL-${now.toISOString().slice(0, 10)}-${nonce}`;
    const categoryLabel = WORKER_REPORT_CATEGORIES.find(item => item.id === category)?.title || category;
    const workerRole = user.role === 'worker' ? 'Worker'
      : user.role === 'manager' ? 'Manager'
      : user.role === 'owner' ? 'Owner'
      : user.role === 'viewer' ? 'Viewer'
      : 'Unknown';

    const baseReport: WorkerReportItem = {
      id: reportId,
      reportNumber,
      category,
      status: 'saved_locally',
      createdAt: now.toISOString(),
      timestampFormatted: now.toLocaleString(),
      workerId: user.userId,
      workerName: user.name,
      workerRole,
      categoryLabel,
      summary,
      data,
      evidenceAttachments,
      syncAttempts: 0
    };

    if (validationError) {
      const invalidReport: WorkerReportItem = {
        ...baseReport,
        status: 'rejected_needs_correction',
        errorOrigin: 'client',
        rejectionReason: `Input needs correction — validated locally. No Chief decision has been made: ${validationError}`
      };
      setLastSubmittedReport(invalidReport);
      return { success: false, report: invalidReport };
    }

    await persistOrThrow(baseReport, user.userId, 'Report could not be stored on this device.');
    setReports(previous => [baseReport, ...previous]);
    setLastSubmittedReport(baseReport);

    const offline = !navigator.onLine || chiefState.connectivity === 'offline';
    if (offline) {
      const queuedReport: WorkerReportItem = { ...baseReport, status: 'queued', isQueuedOffline: true };
      await persistOrThrow(queuedReport, user.userId, 'Report could not be queued on this device.');
      setReports(previous => previous.map(report => report.id === reportId ? queuedReport : report));
      setLastSubmittedReport(queuedReport);
      return { success: true, report: queuedReport };
    }

    const syncingReport: WorkerReportItem = { ...baseReport, status: 'syncing', syncAttempts: 1 };
    await persistOrThrow(syncingReport, user.userId, 'Report synchronization state could not be stored.');
    setReports(previous => previous.map(report => report.id === reportId ? syncingReport : report));
    setLastSubmittedReport(syncingReport);

    try {
      const response = await chiefApi.farm.submitWorkerReport(syncingReport);
      if (!response?.data || response.data.status !== 'accepted' || !response.data.verificationHash) {
        throw new ChiefApiError({ message: 'Backend response missing positive acceptance proof', code: 'UNCONFIRMED_REPORT' });
      }

      const acceptedReport: WorkerReportItem = {
        ...syncingReport,
        status: 'accepted_by_chief',
        backendConfirmationHash: response.data.verificationHash,
        correlationId: response.correlationId,
        backendConfirmedAt: new Date().toISOString(),
        isQueuedOffline: false
      };
      await persistOrThrow(acceptedReport, user.userId, 'Chief accepted the report, but the confirmation could not be stored locally.');
      setReports(previous => previous.map(report => report.id === reportId ? acceptedReport : report));
      setLastSubmittedReport(acceptedReport);
      return { success: true, report: acceptedReport };
    } catch (err: unknown) {
      if (err instanceof ChiefApiError && (err.origin === 'client' || err.code === 'CLIENT_VALIDATION_ERROR')) {
        const invalidReport: WorkerReportItem = {
          ...syncingReport,
          status: 'rejected_needs_correction',
          errorOrigin: 'client',
          rejectionReason: `Input needs correction — validated locally. No Chief decision has been made: ${err.message}`
        };
        await persistOrThrow(invalidReport, user.userId, 'Client validation state could not be stored.');
        setReports(previous => previous.map(report => report.id === reportId ? invalidReport : report));
        setLastSubmittedReport(invalidReport);
        return { success: false, report: invalidReport };
      }

      if (isExplicitChiefRejection(err)) {
        const rejectedReport: WorkerReportItem = {
          ...syncingReport,
          status: 'rejected_needs_correction',
          errorOrigin: 'chief',
          rejectionReason: `Rejected by Chief: ${err.message}`
        };
        await persistOrThrow(rejectedReport, user.userId, 'Chief rejection state could not be stored locally.');
        setReports(previous => previous.map(report => report.id === reportId ? rejectedReport : report));
        setLastSubmittedReport(rejectedReport);
        return { success: false, report: rejectedReport };
      }

      const queuedReport: WorkerReportItem = {
        ...syncingReport,
        status: 'queued',
        isQueuedOffline: true,
        rejectionReason: undefined,
        errorOrigin: undefined
      };
      await persistOrThrow(queuedReport, user.userId, 'Report could not be queued on this device.');
      setReports(previous => previous.map(report => report.id === reportId ? queuedReport : report));
      setLastSubmittedReport(queuedReport);
      return { success: true, report: queuedReport };
    }
  }, [user, chiefState.connectivity, isDev]);

  const retryReport = useCallback(async (id: string): Promise<boolean> => {
    if (!user?.userId || !navigator.onLine || chiefState.connectivity === 'offline') return false;
    const target = reports.find(report => report.id === id);
    if (!target) return false;

    const syncing = { ...target, status: 'syncing' as const, syncAttempts: (target.syncAttempts || 0) + 1, rejectionReason: undefined };
    try {
      await persistOrThrow(syncing, user.userId, 'Retry state could not be stored.');
      setReports(previous => previous.map(report => report.id === id ? syncing : report));
      const response = await chiefApi.farm.submitWorkerReport(syncing);
      if (!response?.data || response.data.status !== 'accepted' || !response.data.verificationHash) {
        throw new ChiefApiError({ message: 'Backend response missing positive acceptance proof', code: 'UNCONFIRMED_REPORT' });
      }
      const accepted: WorkerReportItem = {
        ...syncing,
        status: 'accepted_by_chief',
        backendConfirmationHash: response.data.verificationHash,
        correlationId: response.correlationId,
        backendConfirmedAt: new Date().toISOString(),
        isQueuedOffline: false
      };
      await persistOrThrow(accepted, user.userId, 'Accepted retry confirmation could not be stored.');
      setReports(previous => previous.map(report => report.id === id ? accepted : report));
      return true;
    } catch (err: unknown) {
      let next: WorkerReportItem;
      if (err instanceof ChiefApiError && (err.origin === 'client' || err.code === 'CLIENT_VALIDATION_ERROR')) {
        next = { ...target, status: 'rejected_needs_correction', errorOrigin: 'client', rejectionReason: `Input needs correction — validated locally. No Chief decision has been made: ${err.message}` };
      } else if (isExplicitChiefRejection(err)) {
        next = { ...target, status: 'rejected_needs_correction', errorOrigin: 'chief', rejectionReason: `Rejected by Chief: ${err.message}` };
      } else {
        next = { ...target, status: 'queued', isQueuedOffline: true, syncAttempts: (target.syncAttempts || 0) + 1, rejectionReason: undefined, errorOrigin: undefined };
      }
      const persisted = await reportStorage.save(next, user.userId);
      if (persisted.success) setReports(previous => previous.map(report => report.id === id ? next : report));
      return false;
    }
  }, [reports, chiefState.connectivity, user?.userId]);

  const syncQueuedReports = useCallback(async (): Promise<{ syncedCount: number; failedCount: number }> => {
    if (!user?.userId) return { syncedCount: 0, failedCount: queuedCount };
    const queued = reports.filter(report => report.status === 'queued');
    if (!navigator.onLine || chiefState.connectivity === 'offline') return { syncedCount: 0, failedCount: queued.length };

    setIsSyncingQueue(true);
    let syncedCount = 0;
    let failedCount = 0;
    try {
      for (const report of queued) {
        const ok = await retryReport(report.id);
        if (ok) syncedCount += 1;
        else failedCount += 1;
      }
    } finally {
      setIsSyncingQueue(false);
    }
    return { syncedCount, failedCount };
  }, [reports, queuedCount, chiefState.connectivity, retryReport, user?.userId]);

  useEffect(() => {
    if (navigator.onLine && chiefState.connectivity === 'online' && queuedCount > 0 && !isSyncingQueue) {
      void syncQueuedReports();
    }
  }, [chiefState.connectivity, queuedCount, isSyncingQueue, syncQueuedReports]);

  const deleteReport = useCallback(async (id: string): Promise<void> => {
    if (!user?.userId) return;
    const deleted = await reportStorage.delete(id, user.userId);
    if (deleted) setReports(previous => previous.filter(report => report.id !== id));
  }, [user?.userId]);

  const clearResolvedReports = useCallback(async (): Promise<void> => {
    if (!user?.userId) return;
    const acceptedIds = reports.filter(report => report.status === 'accepted_by_chief').map(report => report.id);
    for (const id of acceptedIds) await reportStorage.delete(id, user.userId);
    setReports(previous => previous.filter(report => report.status !== 'accepted_by_chief'));
  }, [reports, user?.userId]);

  return (
    <WorkerReportContext.Provider value={{
      reports,
      queuedCount,
      isSyncingQueue,
      lastSubmittedReport,
      submitReport,
      syncQueuedReports,
      retryReport,
      deleteReport,
      clearResolvedReports
    }}>
      {children}
    </WorkerReportContext.Provider>
  );
};

export const useWorkerReports = (): WorkerReportContextType => {
  const context = useContext(WorkerReportContext);
  if (!context) throw new Error('useWorkerReports must be used within a WorkerReportProvider');
  return context;
};
