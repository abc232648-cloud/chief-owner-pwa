import React, { useState } from 'react';
import { AlertOctagon, AlertTriangle, Bird, Clock, Egg, FileText, FlaskConical, Plus, Sprout, WifiOff, Wrench, X } from 'lucide-react';
import { AgentState } from '../types/chief';
import { FarmOperatingMode } from '../types/farmAgent';
import { useWorkerReports } from '../context/WorkerReportContext';
import { useOfflineQueue } from '../context/OfflineQueueContext';
import { useAuth } from '../context/AuthContext';
import { useChief } from '../context/ChiefContext';
import { WorkerReportModal } from './worker/WorkerReportModal';
import {
  INITIAL_DAILY_REPORTS,
  INITIAL_FARM_ALERTS,
  INITIAL_FARM_EQUIPMENT,
  INITIAL_FARM_SENSORS,
  INITIAL_FARM_TASKS,
  INITIAL_POULTRY_FLOCKS,
  INITIAL_PRODUCTION_STATE,
  INITIAL_WORKER_SUBMISSIONS
} from '../data/farmAgentData';

interface FarmAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentState;
  onNavigateToApprovals: () => void;
}

type FarmTab = 'overview' | 'reports' | 'tasks' | 'production' | 'flock' | 'workers' | 'equipment' | 'alerts' | 'sensors';

export const FarmAgentModal: React.FC<FarmAgentModalProps> = ({ isOpen, onClose, agent, onNavigateToApprovals }) => {
  const { isDevMode } = useAuth();
  const { state } = useChief();
  const { reports: workerReports, queuedCount } = useWorkerReports();
  const { isDataStale } = useOfflineQueue();
  const [activeTab, setActiveTab] = useState<FarmTab>('overview');
  const [isWorkerReportOpen, setIsWorkerReportOpen] = useState(false);
  const [devModeOverride, setDevModeOverride] = useState<FarmOperatingMode | null>(null);

  if (!isOpen) return null;

  const provenance = state.resourceProvenance?.agents || state.compositeProvenance || 'unavailable';
  const rawMode = agent.operationalMode as FarmOperatingMode | undefined;
  const backendMode: FarmOperatingMode = provenance === 'live'
    ? (rawMode || 'UNAVAILABLE')
    : provenance === 'cached'
      ? 'CACHED'
      : isDevMode
        ? (rawMode || 'SIMULATION')
        : 'UNAVAILABLE';
  const displayMode = isDevMode && devModeOverride ? devModeOverride : backendMode;

  const modeDescription = isDevMode
    ? `DEV presentation mode: ${displayMode}. This does not create live Chief or farm-hardware state.`
    : provenance === 'live'
      ? `Chief API reported Farm Agent mode: ${displayMode}. Policy/interlock enforcement is not independently attested by this client.`
      : provenance === 'cached'
        ? 'Cached Farm Agent record. Live farm state and policy authority are not currently reverified.'
        : 'Farm Agent backend telemetry is unavailable.';

  const tabs: Array<{ id: FarmTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'reports', label: `Reports (${workerReports.length + (isDevMode ? INITIAL_DAILY_REPORTS.length : 0)})` },
    { id: 'tasks', label: `Tasks (${isDevMode ? INITIAL_FARM_TASKS.length : 0})` },
    { id: 'production', label: 'Production' },
    { id: 'flock', label: `Flock (${isDevMode ? INITIAL_POULTRY_FLOCKS.length : 0})` },
    { id: 'workers', label: `Workers (${isDevMode ? INITIAL_WORKER_SUBMISSIONS.length : 0})` },
    { id: 'equipment', label: `Equipment (${isDevMode ? INITIAL_FARM_EQUIPMENT.length : 0})` },
    { id: 'alerts', label: `Alerts (${isDevMode ? INITIAL_FARM_ALERTS.length : 0})` },
    { id: 'sensors', label: `Sensors (${isDevMode ? INITIAL_FARM_SENSORS.length : 0})` }
  ];

  const modeTone = displayMode === 'LIVE' && provenance === 'live'
    ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
    : displayMode === 'UNAVAILABLE' || displayMode === 'OFFLINE'
      ? 'bg-zinc-900 border-zinc-700 text-zinc-300'
      : 'bg-amber-950 border-amber-700 text-amber-300';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#021209]/85 backdrop-blur-sm" role="presentation">
        <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-emerald-900/50 bg-[#062416] shadow-2xl overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="farm-agent-title">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-emerald-950/80 bg-[#04190e]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#0a2f1c] border border-emerald-800/60 text-emerald-300 flex items-center justify-center shrink-0">
                <Sprout className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="farm-agent-title" className="text-base font-semibold text-white tracking-tight">Farm Agent domain</h2>
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${modeTone}`}>{displayMode}</span>
                </div>
                <p className="text-xs text-emerald-300/60 mt-0.5 font-mono">{modeDescription}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              {isDevMode && (
                <select
                  aria-label="Development Farm Agent presentation mode"
                  value={displayMode}
                  onChange={event => setDevModeOverride(event.target.value as FarmOperatingMode)}
                  className="bg-amber-950/40 border border-amber-800 text-amber-200 rounded-lg px-2 py-1 text-[10px] font-mono"
                >
                  {(['LIVE', 'SIMULATION', 'OFFLINE', 'NOT CONFIGURED', 'STALE'] as FarmOperatingMode[]).map(mode => <option key={mode} value={mode}>{mode}</option>)}
                </select>
              )}
              <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-emerald-300/60 hover:text-white hover:bg-[#0a2e1b]" aria-label="Close Farm Agent dialog">
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </header>

          {isDevMode && (
            <div className="px-6 py-2 bg-amber-950/40 border-b border-amber-800/60 text-amber-200 text-xs font-mono flex items-center gap-2">
              <FlaskConical className="w-4 h-4 shrink-0" aria-hidden="true" />
              DEVELOPMENT FIXTURES — flock counts, sensors, workers, equipment, tasks and alerts below are synthetic unless they are local worker reports.
            </div>
          )}

          <nav className="px-6 py-2 border-b border-emerald-950/80 bg-[#03140c] flex gap-1 overflow-x-auto" aria-label="Farm Agent sections">
            {tabs.map(tab => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} aria-pressed={activeTab === tab.id} className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap ${activeTab === tab.id ? 'bg-emerald-600 text-white' : 'text-emerald-300/70 hover:text-white hover:bg-[#082a19]'}`}>
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="p-6 overflow-y-auto max-h-[66vh] space-y-5">
            {activeTab === 'overview' && (
              <section className="space-y-4">
                {!isDevMode ? (
                  <div className="rounded-xl border border-emerald-950/80 bg-[#03140c] p-6 text-center space-y-3">
                    <Sprout className="w-9 h-9 mx-auto text-emerald-400" aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-white">Farm telemetry not provisioned in this client</h3>
                    <p className="text-xs text-emerald-300/60 max-w-xl mx-auto">
                      Production does not substitute bundled sensor, flock, equipment or task fixtures for real farm data. Local authenticated worker reports remain available below and can synchronize only through the Chief API.
                    </p>
                    <button type="button" onClick={() => setIsWorkerReportOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
                      <Plus className="w-4 h-4" aria-hidden="true" /> Submit worker report
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      ['Flock fixtures', INITIAL_POULTRY_FLOCKS.length],
                      ['Task fixtures', INITIAL_FARM_TASKS.length],
                      ['Sensor fixtures', INITIAL_FARM_SENSORS.length],
                      ['Local reports', workerReports.length]
                    ].map(([label, value]) => (
                      <div key={String(label)} className="rounded-xl border border-amber-900/40 bg-[#100d04] p-3">
                        <span className="text-[10px] font-mono text-amber-300/60 block">{label}</span>
                        <span className="text-xl font-bold text-white font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="rounded-xl border border-emerald-950/80 bg-[#03140c] p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="text-white font-semibold">Local worker report queue</p>
                    <p className="text-emerald-300/60">{queuedCount} report{queuedCount === 1 ? '' : 's'} queued locally{isDataStale ? ' • cached data is stale' : ''}.</p>
                  </div>
                  <button type="button" onClick={() => setIsWorkerReportOpen(true)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold">New report</button>
                </div>
              </section>
            )}

            {activeTab === 'reports' && (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div><h3 className="text-sm font-semibold text-white">Worker reports</h3><p className="text-[11px] text-emerald-300/60">Local IDs are client identifiers; only a backend confirmation hash proves Chief acceptance.</p></div>
                  <button type="button" onClick={() => setIsWorkerReportOpen(true)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold">+ Report</button>
                </div>
                {workerReports.length === 0 && !isDevMode ? (
                  <p className="rounded-xl border border-emerald-950/80 bg-[#03140c] p-4 text-xs text-emerald-300/60">No local worker reports for this authenticated user.</p>
                ) : (
                  <div className="space-y-2">
                    {workerReports.map(report => (
                      <article key={report.id} className="rounded-xl border border-emerald-950/80 bg-[#03140c] p-3">
                        <div className="flex flex-wrap justify-between gap-2"><span className="text-sm text-white font-semibold">{report.categoryLabel}</span><span className="text-[10px] font-mono text-emerald-300">{report.status.replaceAll('_', ' ')}</span></div>
                        <p className="text-xs text-emerald-200/80 mt-1">{report.summary}</p>
                        <p className="text-[10px] font-mono text-emerald-400/50 mt-1">Local ID: {report.reportNumber}{report.backendConfirmationHash ? ` • Chief verification: ${report.backendConfirmationHash}` : ' • No Chief acceptance receipt recorded'}</p>
                      </article>
                    ))}
                    {isDevMode && INITIAL_DAILY_REPORTS.map(report => (
                      <article key={report.id} className="rounded-xl border border-amber-900/40 bg-amber-950/10 p-3"><p className="text-[10px] font-mono text-amber-300">DEV DAILY REPORT FIXTURE</p><p className="text-xs text-white mt-1">{report.summary}</p></article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'tasks' && (
              <section className="space-y-3">
                {!isDevMode ? <Unavailable label="Farm tasks" /> : INITIAL_FARM_TASKS.map(task => (
                  <article key={task.id} className="rounded-xl border border-amber-900/40 bg-amber-950/10 p-3"><div className="flex justify-between gap-2"><span className="text-sm text-white font-semibold">{task.title}</span><span className="text-[10px] text-amber-300 font-mono">DEV • {task.status}</span></div><p className="text-xs text-amber-200/70 mt-1">Assigned fixture: {task.assignedTo} • Due {task.dueTime}</p></article>
                ))}
              </section>
            )}

            {activeTab === 'production' && (
              <section>
                {!isDevMode ? <Unavailable label="Production telemetry" /> : (
                  <div className="rounded-xl border border-amber-900/40 bg-amber-950/10 p-4 space-y-2"><div className="flex items-center gap-2 text-amber-300"><Egg className="w-4 h-4" aria-hidden="true" /><strong className="text-xs">DEV PRODUCTION FIXTURE</strong></div><p className="text-xs text-amber-200/80">{INITIAL_PRODUCTION_STATE.configurationNotice}</p><pre className="text-[10px] text-amber-100/70 whitespace-pre-wrap">{JSON.stringify(INITIAL_PRODUCTION_STATE, null, 2)}</pre></div>
                )}
              </section>
            )}

            {activeTab === 'flock' && (
              <section className="space-y-3">
                {!isDevMode ? <Unavailable label="Flock telemetry" /> : INITIAL_POULTRY_FLOCKS.map(flock => (
                  <article key={flock.id} className="rounded-xl border border-amber-900/40 bg-amber-950/10 p-3"><div className="flex items-center gap-2"><Bird className="w-4 h-4 text-amber-300" aria-hidden="true" /><span className="text-sm text-white font-semibold">{flock.name}</span></div><p className="text-xs text-amber-200/70 mt-1">DEV fixture • {flock.houseNumber} • {flock.birdCount} birds • status {flock.status}</p></article>
                ))}
              </section>
            )}

            {activeTab === 'workers' && (
              <section className="space-y-3">
                {!isDevMode ? <Unavailable label="Worker roster" /> : INITIAL_WORKER_SUBMISSIONS.map(worker => (
                  <article key={worker.id} className="rounded-xl border border-amber-900/40 bg-amber-950/10 p-3"><div className="flex justify-between gap-2"><span className="text-sm text-white font-semibold">{worker.workerName}</span><span className="text-[10px] text-amber-300 font-mono">DEV • {worker.status}</span></div><p className="text-xs text-amber-200/70 mt-1">{worker.role} • {worker.assignedZone}</p></article>
                ))}
              </section>
            )}

            {activeTab === 'equipment' && (
              <section className="space-y-3">
                {!isDevMode ? <Unavailable label="Equipment telemetry" /> : INITIAL_FARM_EQUIPMENT.map(equipment => (
                  <article key={equipment.id} className="rounded-xl border border-amber-900/40 bg-amber-950/10 p-3"><div className="flex items-center gap-2"><Wrench className="w-4 h-4 text-amber-300" aria-hidden="true" /><span className="text-sm text-white font-semibold">{equipment.name}</span></div><p className="text-xs text-amber-200/70 mt-1">DEV fixture • {equipment.zone} • {equipment.operatingStatus}</p></article>
                ))}
              </section>
            )}

            {activeTab === 'alerts' && (
              <section className="space-y-3">
                {!isDevMode ? <Unavailable label="Farm alerts" /> : INITIAL_FARM_ALERTS.map(alert => (
                  <article key={alert.id} className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-3"><div className="flex items-start gap-2"><AlertOctagon className="w-4 h-4 text-rose-400 mt-0.5" aria-hidden="true" /><div><p className="text-[10px] font-mono text-rose-300">DEV ALERT FIXTURE • {alert.severity}</p><h3 className="text-sm text-white font-semibold mt-1">{alert.title}</h3><p className="text-xs text-rose-200/70 mt-1">{alert.location} • trigger {alert.triggerValue} • fixture threshold {alert.thresholdValue}</p></div></div></article>
                ))}
                {isDevMode && INITIAL_FARM_ALERTS.length > 0 && <button type="button" onClick={() => { onClose(); onNavigateToApprovals(); }} className="px-3 py-1.5 rounded-lg bg-rose-950 border border-rose-700 text-rose-200 text-xs">Open Attention Inbox</button>}
              </section>
            )}

            {activeTab === 'sensors' && (
              <section className="space-y-3">
                {!isDevMode ? <Unavailable label="Sensor telemetry" /> : INITIAL_FARM_SENSORS.map(sensor => (
                  <article key={sensor.id} className="rounded-xl border border-amber-900/40 bg-amber-950/10 p-3"><div className="flex justify-between gap-2"><span className="text-sm text-white font-semibold">{sensor.sensorName}</span><span className="text-[10px] font-mono text-amber-300">DEV • {sensor.status}</span></div><p className="text-xs text-amber-200/70 mt-1">{sensor.zone} • reading {sensor.currentReading} • heartbeat field {sensor.lastHeartbeat}</p></article>
                ))}
              </section>
            )}
          </div>

          <footer className="px-6 py-3 border-t border-emerald-950/80 bg-[#04190e] text-[10px] font-mono text-emerald-400/50 flex flex-wrap justify-between gap-2">
            <span>Local report persistence ≠ Chief acceptance • STOP remains non-bypassable</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" aria-hidden="true" /> Provenance: {provenance.replace('_', ' ')}</span>
          </footer>
        </div>
      </div>

      <WorkerReportModal isOpen={isWorkerReportOpen} onClose={() => setIsWorkerReportOpen(false)} />
    </>
  );
};

const Unavailable: React.FC<{ label: string }> = ({ label }) => (
  <div className="rounded-xl border border-emerald-950/80 bg-[#03140c] p-5 text-center">
    <WifiOff className="w-6 h-6 text-zinc-500 mx-auto" aria-hidden="true" />
    <p className="text-sm text-white font-semibold mt-2">{label} unavailable</p>
    <p className="text-xs text-emerald-300/60 mt-1">No authoritative backend data is connected for this production surface. Synthetic fixtures are not substituted.</p>
  </div>
);
