import React, { useState } from 'react';
import { 
  X, 
  Sprout, 
  AlertTriangle, 
  AlertOctagon, 
  Droplets, 
  Thermometer, 
  Wind, 
  Radio, 
  FlaskConical, 
  WifiOff, 
  Wrench, 
  FileText, 
  Clock, 
  Egg, 
  Bird, 
  HardHat, 
  Plus 
} from 'lucide-react';
import { AgentState } from '../types/chief';
import { FarmOperatingMode } from '../types/farmAgent';
import { useWorkerReports } from '../context/WorkerReportContext';
import { useOfflineQueue } from '../context/OfflineQueueContext';
import { WorkerReportModal } from './worker/WorkerReportModal';
import { 
  INITIAL_POULTRY_FLOCKS, 
  INITIAL_DAILY_REPORTS, 
  INITIAL_FARM_TASKS, 
  INITIAL_WORKER_SUBMISSIONS, 
  INITIAL_FARM_EQUIPMENT, 
  INITIAL_FARM_ALERTS, 
  INITIAL_FARM_SENSORS, 
  INITIAL_PRODUCTION_STATE 
} from '../data/farmAgentData';

interface FarmAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentState;
  onNavigateToApprovals: () => void;
}

type FarmTab = 
  | 'overview' 
  | 'reports' 
  | 'tasks' 
  | 'production' 
  | 'flock' 
  | 'workers' 
  | 'equipment' 
  | 'alerts' 
  | 'sensors' 
  | 'history';

export const FarmAgentModal: React.FC<FarmAgentModalProps> = ({
  isOpen,
  onClose,
  onNavigateToApprovals
}) => {
  const [operatingMode, setOperatingMode] = useState<FarmOperatingMode>('SIMULATION');
  const [activeTab, setActiveTab] = useState<FarmTab>('overview');
  const [isWorkerReportOpen, setIsWorkerReportOpen] = useState(false);
  const { reports: workerReports, queuedCount } = useWorkerReports();
  const { isDataStale } = useOfflineQueue();

  if (!isOpen) return null;

  const renderOperatingModeBadge = () => {
    switch (operatingMode) {
      case 'LIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-mono text-[11px] font-bold bg-emerald-950/80 border border-emerald-500 text-emerald-300 shadow-sm">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>LIVE TELEMETRY</span>
          </span>
        );
      case 'SIMULATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-mono text-[11px] font-bold bg-amber-950/80 border border-amber-500 text-amber-200 shadow-sm">
            <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
            <span>SIMULATION MODE</span>
          </span>
        );
      case 'OFFLINE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-mono text-[11px] font-bold bg-zinc-900 border border-zinc-600 text-zinc-300">
            <WifiOff className="w-3.5 h-3.5 text-zinc-400" />
            <span>OFFLINE</span>
          </span>
        );
      case 'NOT CONFIGURED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-mono text-[11px] font-bold bg-purple-950/80 border border-purple-600 text-purple-200">
            <Wrench className="w-3.5 h-3.5 text-purple-400" />
            <span>NOT CONFIGURED</span>
          </span>
        );
      case 'STALE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-mono text-[11px] font-bold bg-amber-950/60 border border-amber-800 text-amber-400">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>STALE CACHED DATA</span>
          </span>
        );
    }
  };

  const navTabs: { id: FarmTab; label: string; hasAlert?: boolean }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'reports', label: `Daily Reports (${INITIAL_DAILY_REPORTS.length})` },
    { id: 'tasks', label: `Tasks (${INITIAL_FARM_TASKS.length})`, hasAlert: true },
    { id: 'production', label: 'Production' },
    { id: 'flock', label: `Flock (${INITIAL_POULTRY_FLOCKS.length})` },
    { id: 'workers', label: `Workers (${INITIAL_WORKER_SUBMISSIONS.length})` },
    { id: 'equipment', label: `Equipment (${INITIAL_FARM_EQUIPMENT.length})` },
    { id: 'alerts', label: `Alerts (${INITIAL_FARM_ALERTS.length})`, hasAlert: true },
    { id: 'sensors', label: `Sensors (${INITIAL_FARM_SENSORS.length})` },
    { id: 'history', label: 'History' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#021209]/85 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-emerald-900/50 bg-[#062416] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="farm-agent-title"
      >
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-emerald-950/80 bg-[#04190e]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0a2f1c] border border-emerald-800/60 text-emerald-300 flex items-center justify-center">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="farm-agent-title" className="text-base font-semibold text-white tracking-tight">
                  Farm Agent Operations &amp; Flock Telemetry
                </h2>
                {renderOperatingModeBadge()}
              </div>
              <p className="text-xs text-emerald-300/60 mt-0.5 font-mono">
                Poultry-First Farm Subsystem • Central Policy Enforced
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="flex items-center gap-1.5 bg-[#03140c] p-1 rounded-lg border border-emerald-950 text-xs font-mono">
              <span className="text-emerald-400/60 text-[10px] uppercase px-1">Mode:</span>
              {(['LIVE', 'SIMULATION', 'OFFLINE', 'NOT CONFIGURED', 'STALE'] as FarmOperatingMode[]).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setOperatingMode(mode)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    operatingMode === mode 
                      ? mode === 'LIVE' 
                        ? 'bg-emerald-600 text-white' 
                        : mode === 'SIMULATION' 
                        ? 'bg-amber-600 text-white' 
                        : mode === 'NOT CONFIGURED' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-zinc-700 text-white' 
                      : 'text-emerald-400/60 hover:text-white'
                  }`}
                >
                  {mode.slice(0, 4)}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-300/60 hover:text-white hover:bg-[#0a2e1b] transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Provenance Warning Banner */}
        {operatingMode === 'SIMULATION' && (
          <div className="px-6 py-2.5 bg-amber-950/40 border-b border-amber-900/60 flex items-center justify-between gap-3 text-xs text-amber-200 font-mono">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>SIMULATION MODE ACTIVE:</strong> Telemetry is generated by mathematical sensor simulators. No live hardware actuation will occur without verified physical link.
              </span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 py-2 border-b border-emerald-950/80 bg-[#03140c] flex items-center gap-1 text-xs overflow-x-auto no-scrollbar font-mono">
          {navTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === tab.id 
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm' 
                  : 'text-emerald-300/70 hover:text-white hover:bg-[#082a19]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.hasAlert && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[66vh] space-y-5">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              
              {/* 1. Urgent Alerts Priority Row */}
              <div className="p-4 rounded-xl border border-rose-900/70 bg-[#160609] space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs font-mono font-bold text-rose-300 uppercase tracking-wider">
                      Urgent Safety Interlock &amp; Alert
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800">
                    STOP ACTIVE
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <h4 className="font-bold text-white text-xs">
                      Hydraulic Line Pressure Interlock: Zone B Pump Halted
                    </h4>
                    <p className="text-rose-200/80 text-[11px] mt-0.5">
                      Transducer PT-201 recorded 142.4 PSI (threshold 120.0 PSI). Solenoid cutoff open.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToApprovals();
                    }}
                    className="self-start sm:self-center px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-rose-900 hover:bg-rose-800 text-white transition-colors shrink-0"
                  >
                    View in Attention Inbox →
                  </button>
                </div>
              </div>

              {/* 2. Flock Status Summary */}
              <div className="p-4 rounded-xl border border-emerald-950/80 bg-[#041a10] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bird className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      Flock Operational Status (30,650 Total Birds)
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    Mortality: 0.02% (Nominal)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-[#03140c] border border-emerald-950">
                    <span className="text-emerald-400/60 text-[10px] block">House 1 (Layers)</span>
                    <span className="text-base font-bold text-white">12,450 Birds</span>
                    <span className="text-[10px] text-emerald-400 block mt-0.5">Lay Rate: 95.1%</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#03140c] border border-emerald-950">
                    <span className="text-emerald-400/60 text-[10px] block">House 2 (Broilers)</span>
                    <span className="text-base font-bold text-white">18,200 Birds</span>
                    <span className="text-[10px] text-emerald-400 block mt-0.5">Week 4 • 23.8°C</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#03140c] border border-emerald-950">
                    <span className="text-emerald-400/60 text-[10px] block">Feed Consumed Today</span>
                    <span className="text-base font-bold text-white">4,270 kg</span>
                    <span className="text-[10px] text-emerald-400/70 block mt-0.5">Silos at 68% cap</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#03140c] border border-emerald-950">
                    <span className="text-emerald-400/60 text-[10px] block">Water Intake Ratio</span>
                    <span className="text-base font-bold text-emerald-300">1.92 : 1</span>
                    <span className="text-[10px] text-emerald-400/70 block mt-0.5">8,200 L total</span>
                  </div>
                </div>
              </div>

              {/* 3. Operational Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-emerald-950/80 bg-[#041a10] space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Latest Worker Submissions</span>
                    </span>
                    <button 
                      onClick={() => setActiveTab('reports')}
                      className="text-[10px] font-mono text-emerald-400 hover:underline"
                    >
                      All Reports →
                    </button>
                  </div>
                  <div className="space-y-2">
                    {INITIAL_WORKER_SUBMISSIONS.map(wrk => (
                      <div key={wrk.id} className="p-2.5 rounded-lg bg-[#03140c] border border-emerald-950 font-mono text-[11px] space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold">{wrk.workerName} ({wrk.role})</span>
                          <span className="text-emerald-400/60">{wrk.checkInTime}</span>
                        </div>
                        <p className="text-emerald-300/80 font-sans text-xs">{wrk.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-emerald-950/80 bg-[#041a10] space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Open Tasks &amp; Equipment Issues</span>
                    </span>
                    <button 
                      onClick={() => setActiveTab('tasks')}
                      className="text-[10px] font-mono text-emerald-400 hover:underline"
                    >
                      All 4 Tasks →
                    </button>
                  </div>
                  <div className="space-y-2">
                    {INITIAL_FARM_TASKS.slice(0, 2).map(task => (
                      <div key={task.id} className="p-2.5 rounded-lg bg-[#03140c] border border-emerald-950 font-mono text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold truncate max-w-[200px]">{task.title}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            task.priority === 'Critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-emerald-400/60 text-[10px]">
                          <span>Assigned: {task.assignedTo}</span>
                          <span>Due: {task.dueTime}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Production Anomalies & Sensor Health */}
              <div className="p-4 rounded-xl border border-emerald-950/80 bg-[#041a10] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-3">
                  <Egg className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-white font-bold block">Production Telemetry: 11,840 Eggs Collected Today</span>
                    <span className="text-[11px] text-emerald-400/60">Grade A Yield: 98.4% • Zero egg shell microfracture anomalies</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                    NOMINAL
                  </span>
                  <button 
                    onClick={() => setActiveTab('production')}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    Inspect →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DAILY REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                <div>
                  <span className="text-emerald-400 uppercase tracking-wider font-semibold block">
                    Field Specialist &amp; Automated Environmental Daily Logs
                  </span>
                  <span className="text-emerald-400/60 text-[11px]">
                    {INITIAL_DAILY_REPORTS.length + workerReports.length} total sealed reports • {queuedCount} queued offline
                  </span>
                </div>
                <button
                  onClick={() => setIsWorkerReportOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ New Worker Report</span>
                </button>
              </div>

              {/* Real-time Worker Reports from local/synced queue */}
              {workerReports.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                    Recent Mobile Worker Submissions ({workerReports.length})
                  </span>
                  {workerReports.map(rep => (
                    <div key={rep.id} className="p-3.5 rounded-xl border border-emerald-900/60 bg-[#03180d] space-y-2 text-xs font-mono">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{rep.reportNumber}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                              {rep.categoryLabel}
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-400/60 block">
                            Logged by {rep.workerName} ({rep.workerRole}) • {rep.timestampFormatted}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          rep.status === 'accepted_by_chief'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                            : rep.status === 'queued'
                            ? 'bg-amber-950 text-amber-300 border-amber-600'
                            : 'bg-rose-950 text-rose-300 border-rose-600'
                        }`}>
                          {rep.status === 'accepted_by_chief' ? 'ACCEPTED BY CHIEF' : rep.status === 'queued' ? 'QUEUED (OFFLINE)' : 'NEEDS CORRECTION'}
                        </span>
                      </div>
                      <p className="text-emerald-100 font-sans text-xs">{rep.summary}</p>
                      {rep.backendConfirmationHash && (
                        <div className="text-[10px] text-emerald-400/60 flex items-center justify-between pt-1 border-t border-emerald-950">
                          <span>Hash: {rep.backendConfirmationHash.slice(0, 24)}...</span>
                          <span>Confirmed: {rep.backendConfirmedAt}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400/80 font-bold block pt-1">
                  Authoritative Baseline Logs
                </span>
                {INITIAL_DAILY_REPORTS.map(rep => (
                  <div key={rep.id} className="p-4 rounded-xl border border-emerald-950/80 bg-[#041a10] space-y-2.5 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 font-mono">
                      <div>
                        <span className="font-bold text-white text-xs block">{rep.author} ({rep.authorRole})</span>
                        <span className="text-emerald-400/60 text-[11px]">{rep.flockHouse} • Shift: {rep.shift}</span>
                      </div>
                      <span className="text-emerald-400 font-bold tabular-nums text-[11px]">{rep.timestamp}</span>
                    </div>
                    <p className="text-emerald-200/90 leading-relaxed font-sans">{rep.summary}</p>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block">
                        Key Observations:
                      </span>
                      <ul className="list-disc pl-4 text-emerald-300/70 font-mono text-[11px] space-y-0.5">
                        {rep.keyObservations.map((obs, idx) => (
                          <li key={idx}>{obs}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-2 border-t border-emerald-950 text-[10px] font-mono text-emerald-400/50 flex flex-wrap items-center justify-between gap-1">
                      <span>Submitted via: {rep.submittedVia}</span>
                      <span>Hash: {rep.verificationHash}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 uppercase tracking-wider font-semibold">
                  Authoritative Operational Tasks ({INITIAL_FARM_TASKS.length})
                </span>
                <span className="text-emerald-400/60 text-[11px]">Enforced under safety invariants</span>
              </div>
              <div className="space-y-3">
                {INITIAL_FARM_TASKS.map(task => (
                  <div 
                    key={task.id}
                    className={`p-4 rounded-xl border space-y-2 text-xs font-mono ${
                      task.isInterlockTriggered 
                        ? 'border-rose-900/60 bg-[#160609]' 
                        : 'border-emerald-950/80 bg-[#041a10]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{task.title}</span>
                          {task.isInterlockTriggered && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                              STOP Interlock
                            </span>
                          )}
                        </div>
                        <span className="text-emerald-400/60 text-[11px]">
                          Category: {task.category} • Assigned to: <strong className="text-emerald-200">{task.assignedTo}</strong>
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          task.priority === 'Critical' 
                            ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                            : 'bg-amber-950 text-amber-300'
                        }`}>
                          {task.priority} Priority
                        </span>
                        <span className="block text-[10px] text-emerald-400/60 mt-0.5">Due: {task.dueTime}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-emerald-950 text-[11px]">
                      <span>Status: <strong className="text-white">{task.status}</strong></span>
                      {task.policyRule && <span>Policy Bound: {task.policyRule}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PRODUCTION */}
          {activeTab === 'production' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 uppercase tracking-wider font-semibold">
                  Commercial Poultry Production &amp; Grade Verification
                </span>
                <span className="text-emerald-400/60 text-[11px]">House 1 Commercial Layers</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl border border-emerald-950/80 bg-[#03140c] space-y-1">
                  <span className="text-[11px] text-emerald-400/60 block">Eggs Collected Today</span>
                  <span className="text-xl font-bold text-white tabular-nums">{INITIAL_PRODUCTION_STATE.eggCountToday?.toLocaleString()}</span>
                  <span className="text-[10px] text-emerald-400 block">95.1% Lay Rate (Expected: 94.8%)</span>
                </div>
                <div className="p-3.5 rounded-xl border border-emerald-950/80 bg-[#03140c] space-y-1">
                  <span className="text-[11px] text-emerald-400/60 block">Grade A Quality</span>
                  <span className="text-xl font-bold text-emerald-300 tabular-nums">{INITIAL_PRODUCTION_STATE.gradeAPct}%</span>
                  <span className="text-[10px] text-emerald-400/70 block">Optical laser inspected</span>
                </div>
                <div className="p-3.5 rounded-xl border border-emerald-950/80 bg-[#03140c] space-y-1">
                  <span className="text-[11px] text-emerald-400/60 block">Average Egg Weight</span>
                  <span className="text-xl font-bold text-white tabular-nums">{INITIAL_PRODUCTION_STATE.averageWeightGrams} g</span>
                  <span className="text-[10px] text-emerald-400/70 block">Large commercial class</span>
                </div>
                <div className="p-3.5 rounded-xl border border-emerald-950/80 bg-[#03140c] space-y-1">
                  <span className="text-[11px] text-emerald-400/60 block">Production Anomaly Flag</span>
                  <span className="text-xl font-bold text-emerald-400">Zero</span>
                  <span className="text-[10px] text-emerald-400/70 block">No shell anomalies</span>
                </div>
              </div>

              {/* Unavailable Module */}
              <div className="p-5 rounded-xl border border-purple-950/80 bg-[#100619] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-purple-400" />
                    <h4 className="text-xs font-mono font-bold text-purple-200 uppercase tracking-wider">
                      Automated Poultry Weigh-Back &amp; Packing Line Sorter
                    </h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                    Not configured
                  </span>
                </div>
                <p className="text-xs text-purple-200/80 font-mono leading-relaxed">
                  Hardware telemetry module not configured on this installation. Chief will not synthesize fake packing conveyor metrics. Install RS-485 Optical Sorter bridge to enable live data.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: FLOCK */}
          {activeTab === 'flock' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 uppercase tracking-wider font-semibold">
                  Poultry Flock Roster &amp; Environmental Invariants
                </span>
                <span className="text-emerald-400/60 text-[11px]">2 Active Housing Units</span>
              </div>
              {isDataStale && (
                <div className="p-3.5 rounded-xl border border-amber-800/80 bg-amber-950/40 flex items-center justify-between gap-3 text-xs font-mono text-amber-200 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white block">STALE FLOCK TELEMETRY (CACHED):</span>
                      <span className="text-amber-300/80">
                        Environmental readings are cached from the last synchronization snapshot. Live sensor link is disconnected.
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900 text-amber-300 border border-amber-700 shrink-0">
                    CACHED READ
                  </span>
                </div>
              )}
              <div className="space-y-4">
                {INITIAL_POULTRY_FLOCKS.map(flock => (
                  <div key={flock.id} className="p-5 rounded-xl border border-emerald-950/80 bg-[#041a10] space-y-4 text-xs font-mono">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Bird className="w-4 h-4 text-emerald-400" />
                          <h4 className="text-sm font-bold text-white">{flock.name}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            {flock.flockType.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-emerald-400/60 text-[11px] mt-0.5">
                          {flock.houseNumber} • Breed: {flock.breed} • Age: {flock.ageWeeks} weeks
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-bold text-white">{flock.birdCount.toLocaleString()} Birds</span>
                        <span className="block text-[10px] text-emerald-400/60">Mortality today: {flock.dailyMortalityCount} ({flock.mortalityRatePct}%)</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div className="p-2.5 rounded-lg bg-[#03140c] border border-emerald-950">
                        <span className="text-[10px] text-emerald-400/60 block">House Temp</span>
                        <span className="text-sm font-bold text-white">{flock.environment.tempC}°C</span>
                        <span className="text-[10px] text-emerald-400/70 block">Target: {flock.environment.targetTempC}°C</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#03140c] border border-emerald-950">
                        <span className="text-[10px] text-emerald-400/60 block">Ventilation Output</span>
                        <span className="text-sm font-bold text-white">{flock.environment.ventilationCfm.toLocaleString()} CFM</span>
                        <span className="text-[10px] text-emerald-400/70 block">Humidity: {flock.environment.humidityPct}%</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#03140c] border border-emerald-950">
                        <span className="text-[10px] text-emerald-400/60 block">Ammonia (NH3) Level</span>
                        <span className={`text-sm font-bold ${flock.environment.ammoniaPpm > 15 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {flock.environment.ammoniaPpm} ppm
                        </span>
                        <span className="text-[10px] text-emerald-400/70 block">Max Limit: {flock.environment.ammoniaThresholdPpm} ppm</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#03140c] border border-emerald-950">
                        <span className="text-[10px] text-emerald-400/60 block">Water / Feed Ratio</span>
                        <span className="text-sm font-bold text-emerald-300">{flock.waterToFeedRatio} : 1</span>
                        <span className="text-[10px] text-emerald-400/70 block">Feed: {flock.feedIntakeKg}kg / Water: {flock.waterIntakeLiters}L</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-400/50 pt-1 border-t border-emerald-950">
                      {flock.lastInspectionTime}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: WORKERS */}
          {activeTab === 'workers' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                <div>
                  <span className="text-emerald-400 uppercase tracking-wider font-semibold block">
                    Field Personnel Active On-Site
                  </span>
                  <span className="text-emerald-400/60 text-[11px]">Worker Link Check-ins &amp; Mobile Dispatch</span>
                </div>
                <button
                  onClick={() => setIsWorkerReportOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Log Field Submission</span>
                </button>
              </div>
              <div className="space-y-3">
                {INITIAL_WORKER_SUBMISSIONS.map(wrk => (
                  <div key={wrk.id} className="p-4 rounded-xl border border-emerald-950/80 bg-[#041a10] space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HardHat className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-white">{wrk.workerName}</span>
                        <span className="text-emerald-400/60">({wrk.role})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {wrk.status}
                      </span>
                    </div>
                    <p className="text-emerald-200/90 font-sans text-xs">{wrk.notes}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-emerald-950 text-[11px] text-emerald-400/60">
                      <span>Assigned Zone: {wrk.assignedZone}</span>
                      <span>Check-in: {wrk.checkInTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: EQUIPMENT */}
          {activeTab === 'equipment' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 uppercase tracking-wider font-semibold">
                  Farm Hardware &amp; Actuators
                </span>
                <span className="text-emerald-400/60 text-[11px]">Interlocks &amp; Telemetry</span>
              </div>
              <div className="space-y-3">
                {INITIAL_FARM_EQUIPMENT.map(eq => (
                  <div 
                    key={eq.id}
                    className={`p-4 rounded-xl border space-y-2.5 text-xs font-mono ${
                      eq.operatingStatus === 'Tripped Interlock'
                        ? 'border-rose-900/60 bg-[#160609]'
                        : eq.operatingStatus === 'Not Configured'
                        ? 'border-purple-950/80 bg-[#100619]'
                        : 'border-emerald-950/80 bg-[#041a10]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{eq.name}</span>
                        </div>
                        <span className="text-emerald-400/60 text-[11px]">
                          {eq.equipmentType} • Zone: {eq.zone}
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold self-start ${
                        eq.operatingStatus === 'Tripped Interlock'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : eq.operatingStatus === 'Not Configured'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {eq.operatingStatus}
                      </span>
                    </div>
                    {eq.isConfigured && eq.telemetry && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {Object.entries(eq.telemetry).map(([k, v]) => (
                          <div key={k} className="p-2 rounded bg-[#03140c] border border-emerald-950">
                            <span className="text-[10px] text-emerald-400/60 block">{k}</span>
                            <span className="text-white font-bold">{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {!eq.isConfigured && (
                      <div className="p-2.5 rounded bg-purple-950/40 text-purple-200 text-xs">
                        Hardware sensor telemetry kit not installed on this silo. Status honestly reported as <strong>Not configured</strong>.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: ALERTS */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 uppercase tracking-wider font-semibold">
                  Farm Safety Alarms &amp; Interlocks
                </span>
                <span className="text-emerald-400/60 text-[11px]">{INITIAL_FARM_ALERTS.length} active notifications</span>
              </div>
              <div className="space-y-3">
                {INITIAL_FARM_ALERTS.map(alt => (
                  <div 
                    key={alt.id}
                    className={`p-4 rounded-xl border space-y-2 text-xs font-mono ${
                      alt.isHardwareInterlock 
                        ? 'border-rose-900/60 bg-[#160609]' 
                        : 'border-amber-900/50 bg-[#140e06]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {alt.isHardwareInterlock ? (
                          <AlertOctagon className="w-4 h-4 text-rose-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        )}
                        <span className="font-bold text-white text-xs">{alt.title}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alt.isHardwareInterlock ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300'
                      }`}>
                        {alt.severity}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 text-[11px] text-emerald-300/80">
                      <span>Location: {alt.location}</span>
                      <span>Recorded: <strong className="text-white">{alt.triggerValue}</strong></span>
                      <span>Threshold: {alt.thresholdValue}</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#03140c] border border-emerald-950 text-xs">
                      <span className="text-emerald-400/60 text-[10px] block uppercase font-bold">Required Remediation:</span>
                      <p className="text-emerald-100 font-sans mt-0.5">{alt.remediation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: SENSORS */}
          {activeTab === 'sensors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 uppercase tracking-wider font-semibold">
                  Farm Sensor Array Telemetry
                </span>
                <span className="text-emerald-400/60 text-[11px]">{INITIAL_FARM_SENSORS.length} sensors provisioned</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                {INITIAL_FARM_SENSORS.map(sns => (
                  <div 
                    key={sns.id}
                    className={`p-3.5 rounded-xl border space-y-1.5 ${
                      sns.status === 'Not Configured'
                        ? 'border-purple-950/80 bg-[#100619]'
                        : sns.status === 'Drift Warning'
                        ? 'border-amber-950 bg-[#120e06]'
                        : 'border-emerald-950/80 bg-[#041a10]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white truncate max-w-[200px]">{sns.sensorName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sns.status === 'Online'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                          : sns.status === 'Not Configured'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {sns.status}
                      </span>
                    </div>
                    <div className="text-emerald-300/80 text-[11px]">
                      Reading: <strong className="text-white">{sns.currentReading}</strong>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-emerald-400/50 pt-1 border-t border-emerald-950">
                      <span>Zone: {sns.zone}</span>
                      <span>Heartbeat: {sns.lastHeartbeat}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 10: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  Farm Agent Chronology &amp; Sensor Event Log
                </h3>
                <p className="text-xs text-emerald-300/60 mt-0.5 font-mono">
                  All environmental and hardware events sealed with cryptographic hashes
                </p>
              </div>
              <div className="space-y-2.5 font-mono text-xs">
                {[
                  { time: "07:18 AM", event: "Tomas Rivera submitted morning flock welfare report via Worker Link PWA", code: "REP_FLOCK_WALK" },
                  { time: "07:05 AM", event: "Cross-sensor drift alert logged on Bay 4 probe (+14.3% delta vs redundant check)", code: "WARN_SENSOR_DRIFT" },
                  { time: "06:58 AM", event: "CRITICAL STOP INTERLOCK: Zone B pump line pressure cut off at 142.4 PSI", code: "STOP_PRESSURE_RELAY" },
                  { time: "06:30 AM", event: "Automated negative static pressure overnight tunnel fan audit completed", code: "AUDIT_ENV_FAN" },
                  { time: "06:15 AM", event: "Tomas Rivera clocked in on site for morning shift", code: "WORKER_CHECK_IN" }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-emerald-950/80 bg-[#03140c] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-bold">{item.time}</span>
                      <span className="text-emerald-100">{item.event}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400/50 px-1.5 py-0.5 rounded bg-[#062416] border border-emerald-950 shrink-0">
                      {item.code}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-emerald-950/80 bg-[#04190e] flex items-center justify-between text-xs font-mono">
          <span className="text-emerald-400/60">
            Authoritative Farm Agent Domain • Poultry-First Subsystem
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-emerald-800/60 bg-[#0a2f1c] hover:bg-[#0e3b23] text-emerald-100 transition-colors"
          >
            Close Farm Domain
          </button>
        </div>
      </div>

      <WorkerReportModal
        isOpen={isWorkerReportOpen}
        onClose={() => setIsWorkerReportOpen(false)}
      />
    </div>
  );
};
