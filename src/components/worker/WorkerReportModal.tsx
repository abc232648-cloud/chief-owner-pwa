import React, { useState } from 'react';
import { 
  X, 
  Wifi, 
  WifiOff, 
  HardHat, 
  Clock, 
  CheckCircle2, 
  AlertOctagon, 
  Droplets, 
  Wheat, 
  Egg, 
  Eye, 
  Wrench, 
  CheckSquare, 
  Wind, 
  AlertTriangle, 
  Camera, 
  Plus, 
  Minus, 
  Send, 
  RotateCw, 
  Layers, 
  ChevronRight, 
  ArrowLeft, 
  ShieldCheck, 
  Image as ImageIcon, 
  Trash2,
  Flame
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChief } from '../../context/ChiefContext';
import { useWorkerReports } from '../../context/WorkerReportContext';
import { useOfflineQueue } from '../../context/OfflineQueueContext';
import { 
  WorkerReportCategory, 
  WorkerReportStatus, 
  WorkerReportAttachment,
  WorkerReportItem 
} from '../../types/workerReport';
import { WORKER_REPORT_CATEGORIES } from '../../data/workerReportCategories';
import { INITIAL_FARM_TASKS } from '../../data/farmAgentData';

interface WorkerReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: WorkerReportCategory;
}

export const WorkerReportModal: React.FC<WorkerReportModalProps> = ({
  isOpen,
  onClose,
  initialCategory
}) => {
  const { user } = useAuth();
  const { state: chiefState, toggleConnectivity } = useChief();
  const { 
    reports, 
    queuedCount, 
    isSyncingQueue, 
    submitReport, 
    syncQueuedReports, 
    retryReport, 
    deleteReport 
  } = useWorkerReports();
  const { enqueueAction } = useOfflineQueue();

  // Active view: 'select_category' | 'form' | 'confirmation' | 'queue_history'
  const [activeView, setActiveView] = useState<'select_category' | 'form' | 'confirmation' | 'queue_history'>('select_category');
  const [selectedCategory, setSelectedCategory] = useState<WorkerReportCategory>(initialCategory || 'mortality');
  const [submittedReport, setSubmittedReport] = useState<WorkerReportItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State: Mortality
  const [mortalityHouse, setMortalityHouse] = useState('House 1 (Commercial Layer Barn)');
  const [mortalityCount, setMortalityCount] = useState<number>(1);
  const [mortalityCause, setMortalityCause] = useState<'Sudden Death Syndrome' | 'Dehydration / Gout' | 'Smothering / Piling' | 'Cull / Welfare' | 'Unexplained'>('Sudden Death Syndrome');
  const [disposalMethod, setDisposalMethod] = useState<'Certified Incinerator' | 'Deep Pit Composting' | 'Biosecure Cold Storage'>('Certified Incinerator');

  // Form State: Feed
  const [feedHouse, setFeedHouse] = useState('House 1 (Commercial Layer Barn)');
  const [feedSilo, setFeedSilo] = useState('Silo 1 (Layer Mash)');
  const [feedBinLevel, setFeedBinLevel] = useState<number>(75);
  const [feedCondition, setFeedCondition] = useState<'Normal / Dry' | 'Caked / Bridging' | 'High Dust' | 'Off-odor / Mold Suspicion'>('Normal / Dry');
  const [feederLinesOperational, setFeederLinesOperational] = useState(true);

  // Form State: Water
  const [waterHouse, setWaterHouse] = useState('House 1 (Commercial Layer Barn)');
  const [waterMeterLiters, setWaterMeterLiters] = useState<number>(2780);
  const [waterPressurePsi, setWaterPressurePsi] = useState<number>(25);
  const [waterDrinkerStatus, setWaterDrinkerStatus] = useState<'All Clear' | 'Drip / Leak in Bay 3' | 'Low Flow Alert' | 'Air Lock in Line'>('All Clear');
  const [waterSanitizerPpm, setWaterSanitizerPpm] = useState<number>(1.5);

  // Form State: Egg/Production
  const [eggHouse, setEggHouse] = useState('House 1 (Commercial Layer Barn)');
  const [eggShift, setEggShift] = useState<'Morning (07:00)' | 'Afternoon (13:00)' | 'Late Collection (17:00)'>('Morning (07:00)');
  const [eggTraysCollected, setEggTraysCollected] = useState<number>(390); // ~11,700 eggs
  const [eggLooseCollected, setEggLooseCollected] = useState<number>(14);
  const [eggCrackedCount, setEggCrackedCount] = useState<number>(8);
  const [eggDirtyFloorCount, setEggDirtyFloorCount] = useState<number>(3);

  // Form State: Flock Observation
  const [obsHouse, setObsHouse] = useState('House 1 (Commercial Layer Barn)');
  const [obsActivity, setObsActivity] = useState<'Active & Dispersed' | 'Slightly Lethargic' | 'Agitated / Flighty' | 'Huddling under heat lamps'>('Active & Dispersed');
  const [obsDroppings, setObsDroppings] = useState<'Firm / Normal' | 'Watery / Wet Litter' | 'Mucoid / Enteritis' | 'Blood-tinged (Urgent)'>('Firm / Normal');
  const [obsVocalization, setObsVocalization] = useState<'Normal Barn Clucking' | 'Abnormally Quiet' | 'Respiratory Snicking / Coughing'>('Normal Barn Clucking');
  const [obsLitter, setObsLitter] = useState<'Dry & Friable (Optimal)' | 'Damp in Drinking Zone' | 'Caked / High Risk'>('Dry & Friable (Optimal)');

  // Form State: Equipment Fault
  const [eqId, setEqId] = useState('eq-02');
  const [eqUrgency, setEqUrgency] = useState<'Immediate STOP Required' | 'Service Within 4h' | 'Routine Non-Critical'>('Service Within 4h');
  const [eqFaultType, setEqFaultType] = useState<'Belt / Drive Failure' | 'Motor Overheating' | 'Leak / Pressure Loss' | 'Electrical / Tripped Breaker' | 'Controller Error Code'>('Belt / Drive Failure');
  const [eqDescription, setEqDescription] = useState('Fan 7 bearing squeal observed during exhaust run.');

  // Form State: Task Completion
  const [taskSelectedId, setTaskSelectedId] = useState('tsk-02');
  const [taskMinutes, setTaskMinutes] = useState<number>(35);
  const [taskChecklistConfirmed, setTaskChecklistConfirmed] = useState(true);
  const [taskNotes, setTaskNotes] = useState('Checked drinkers and racked litter under waterline in bays 1-4.');

  // Form State: Environmental
  const [envHouse, setEnvHouse] = useState('House 1 (Commercial Layer Barn)');
  const [envTempC, setEnvTempC] = useState<number>(21.4);
  const [envHumidityPct, setEnvHumidityPct] = useState<number>(62);
  const [envAmmoniaRating, setEnvAmmoniaRating] = useState<'None (<5 ppm)' | 'Mild (5-15 ppm)' | 'Irritating (15-25 ppm)' | 'Dangerous (>25 ppm)'>('Mild (5-15 ppm)');
  const [envFansActive, setEnvFansActive] = useState<number>(6);

  // Form State: Emergency
  const [emergencyType, setEmergencyType] = useState<'Ventilation Failure' | 'Main Water Cutoff' | 'Barn Fire / Smoke' | 'Backup Generator Failure' | 'Extreme Heat Surge' | 'Predator / Biosecurity Breach'>('Ventilation Failure');
  const [emergencyActionTaken, setEmergencyActionTaken] = useState('Opened manual emergency side-curtain drops and activated backup generator circuit.');

  // Photo & Evidence Attachments
  const [attachments, setAttachments] = useState<WorkerReportAttachment[]>([]);

  if (!isOpen) return null;

  const isNetworkOffline = !navigator.onLine || chiefState.connectivity === 'offline';

  // Category Icon Resolver
  const getCategoryIcon = (category: WorkerReportCategory) => {
    switch (category) {
      case 'mortality': return <AlertOctagon className="w-5 h-5 text-rose-400" />;
      case 'feed': return <Wheat className="w-5 h-5 text-amber-400" />;
      case 'water': return <Droplets className="w-5 h-5 text-sky-400" />;
      case 'egg_production': return <Egg className="w-5 h-5 text-emerald-400" />;
      case 'flock_observation': return <Eye className="w-5 h-5 text-teal-400" />;
      case 'equipment_fault': return <Wrench className="w-5 h-5 text-amber-400" />;
      case 'task_completion': return <CheckSquare className="w-5 h-5 text-emerald-400" />;
      case 'environmental_issue': return <Wind className="w-5 h-5 text-cyan-400" />;
      case 'emergency': return <Flame className="w-5 h-5 text-rose-500 animate-pulse" />;
      case 'photo_evidence': return <Camera className="w-5 h-5 text-indigo-400" />;
    }
  };

  const handleAddEvidencePhoto = () => {
    const photoId = `att-${Date.now()}`;
    const newAtt: WorkerReportAttachment = {
      id: photoId,
      name: `inspection_snap_${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.jpg`,
      type: 'image/jpeg',
      sizeBytes: 312000 + Math.floor(Math.random() * 50000),
      capturedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      watermarkText: `${mortalityHouse.slice(0, 7)} — ${user?.name || 'T. Rivera'} — ${new Date().toLocaleTimeString()} — FIELD-VERIFIED`
    };
    setAttachments(prev => [...prev, newAtt]);
  };

  const handleSubmitForm = async () => {
    setIsSubmitting(true);
    let payloadData: Record<string, any> = {};
    let summary = '';

    switch (selectedCategory) {
      case 'mortality':
        payloadData = {
          houseNumber: mortalityHouse,
          flockId: mortalityHouse.includes('House 1') ? 'flock-h1' : 'flock-h2',
          mortalityCount,
          suspectedCause: mortalityCause,
          disposalMethod,
          immediateInterlockNeeded: mortalityCount >= 10
        };
        summary = `${mortalityHouse}: ${mortalityCount} bird mortality — Cause: ${mortalityCause} — ${disposalMethod}`;
        break;
      case 'feed':
        payloadData = {
          houseNumber: feedHouse,
          siloId: feedSilo,
          feedCondition,
          binLevelPct: feedBinLevel,
          feederLinesOperational
        };
        summary = `${feedSilo}: ${feedBinLevel}% bin capacity — Condition: ${feedCondition} — Lines ${feederLinesOperational ? 'Running' : 'Fault'}`;
        break;
      case 'water':
        payloadData = {
          houseNumber: waterHouse,
          meterReadingLiters: waterMeterLiters,
          pressureGaugeReadingPsi: waterPressurePsi,
          drinkerStatus: waterDrinkerStatus,
          sanitizerCheckPpm: waterSanitizerPpm
        };
        summary = `${waterHouse}: Meter ${waterMeterLiters.toLocaleString()} L — Pressure ${waterPressurePsi} PSI — Drinkers: ${waterDrinkerStatus}`;
        break;
      case 'egg_production':
        const totalEggs = (eggTraysCollected * 30) + eggLooseCollected;
        payloadData = {
          houseNumber: eggHouse,
          shift: eggShift,
          traysCollected: eggTraysCollected,
          looseEggsCollected: eggLooseCollected,
          crackedDefectiveCount: eggCrackedCount,
          dirtyFloorEggsCount: eggDirtyFloorCount,
          totalEggsEstimated: totalEggs
        };
        summary = `${eggHouse}: ${totalEggs.toLocaleString()} eggs collected (${eggTraysCollected} trays) — ${eggShift} — Cracked: ${eggCrackedCount}`;
        break;
      case 'flock_observation':
        payloadData = {
          houseNumber: obsHouse,
          activityLevel: obsActivity,
          droppingsCondition: obsDroppings,
          vocalizationState: obsVocalization,
          litterMoistureCondition: obsLitter
        };
        summary = `${obsHouse}: Birds ${obsActivity} — Droppings: ${obsDroppings} — Litter: ${obsLitter}`;
        break;
      case 'equipment_fault':
        payloadData = {
          equipmentId: eqId,
          urgency: eqUrgency,
          faultType: eqFaultType,
          description: eqDescription
        };
        summary = `Fault [${eqUrgency}]: ${eqFaultType} — ${eqDescription.slice(0, 45)}...`;
        break;
      case 'task_completion':
        const taskObj = INITIAL_FARM_TASKS.find(t => t.id === taskSelectedId);
        payloadData = {
          taskId: taskSelectedId,
          taskTitle: taskObj?.title || 'Farm Field Task',
          completionMinutes: taskMinutes,
          checklistConfirmed: taskChecklistConfirmed,
          workerSignOff: user?.name || 'Tomas Rivera',
          outcomeNotes: taskNotes
        };
        summary = `Task Done: ${taskObj?.title || taskSelectedId} — ${taskMinutes} min — Signed by ${user?.name || 'Worker'}`;
        break;
      case 'environmental_issue':
        payloadData = {
          houseNumber: envHouse,
          temperatureC: envTempC,
          relativeHumidityPct: envHumidityPct,
          ammoniaRating: envAmmoniaRating,
          ventilationFanCountActive: envFansActive
        };
        summary = `${envHouse}: ${envTempC}°C — ${envHumidityPct}% RH — Ammonia: ${envAmmoniaRating} — Fans: ${envFansActive}`;
        break;
      case 'emergency':
        payloadData = {
          emergencyType,
          immediateActionTaken: emergencyActionTaken,
          requiresSupervisorDispatch: true,
          physicalInterlockTripped: true
        };
        summary = `EMERGENCY ALERT: ${emergencyType} — Action: ${emergencyActionTaken.slice(0, 50)}...`;
        break;
      case 'photo_evidence':
        payloadData = {
          evidenceCount: attachments.length,
          caption: 'Field physical inspection photo logs'
        };
        summary = `Photo Evidence: ${attachments.length} attachment(s) logged by ${user?.name || 'Worker'}`;
        break;
    }

    try {
      const res = await submitReport(selectedCategory, payloadData, attachments, summary);
      if (res.report.status === 'queued') {
        enqueueAction({
          actionType: 'SUBMIT_WORKER_REPORT',
          title: `${WORKER_REPORT_CATEGORIES.find(c => c.id === selectedCategory)?.shortLabel}: ${summary.slice(0, 45)}`,
          domain: 'Farm Agent',
          payload: payloadData,
          isPolicyPermitted: true
        });
      }
      setSubmittedReport(res.report);
      setActiveView('confirmation');
      setAttachments([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusBadge = (status: WorkerReportStatus, isQueuedOffline?: boolean) => {
    switch (status) {
      case 'accepted_by_chief':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-600 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>ACCEPTED BY CHIEF</span>
          </span>
        );
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-950 text-amber-200 border border-amber-600 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>QUEUED (OFFLINE)</span>
          </span>
        );
      case 'syncing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-sky-950 text-sky-200 border border-sky-600 shadow-sm">
            <RotateCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />
            <span>SYNCING TO CHIEF</span>
          </span>
        );
      case 'saved_locally':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-800">
            <Layers className="w-3.5 h-3.5" />
            <span>SAVED LOCALLY</span>
          </span>
        );
      case 'rejected_needs_correction':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-950 text-rose-200 border border-rose-600 shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>REJECTED / NEEDS CORRECTION</span>
          </span>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="worker-reporting-title"
    >
      <div className="relative w-full max-w-2xl bg-[#041a10] border border-emerald-900/80 rounded-2xl shadow-2xl shadow-black/80 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* 1. Header Bar: Worker Attribution & Network Connectivity Contract */}
        <div className="p-4 sm:p-5 border-b border-emerald-950/90 bg-[#03140c] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0a2e1b] border border-emerald-800 flex items-center justify-center text-emerald-400 shadow-inner">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="worker-reporting-title" className="text-base font-bold text-white tracking-tight font-mono">
                  FIELD WORKER REPORTING
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  MOBILE LINK
                </span>
              </div>
              <p className="text-xs text-emerald-400/80 font-mono mt-0.5 flex items-center gap-1.5">
                <span>Worker: <strong>{user?.name || 'Tomas Rivera'}</strong></span>
                <span className="text-emerald-500/40">|</span>
                <span>Role: {user?.role === 'worker' ? 'Field Specialist' : user?.role || 'Field Staff'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setActiveView(activeView === 'queue_history' ? 'select_category' : 'queue_history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-1.5 border ${
                activeView === 'queue_history'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-[#062617] text-emerald-300 border-emerald-900/80 hover:bg-[#0a331f]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Queue &amp; Logs ({reports.length})</span>
              {queuedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-bold">
                  {queuedCount}
                </span>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-300/60 hover:text-white hover:bg-[#0a2e1b] transition-colors"
              aria-label="Close worker reporting"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Incomplete Network State & Offline Queue Warning Bar */}
        <div className={`px-4 sm:px-6 py-2.5 border-b text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
          isNetworkOffline 
            ? 'bg-amber-950/60 border-amber-900/70 text-amber-200' 
            : 'bg-[#03180e] border-emerald-950/80 text-emerald-300'
        }`}>
          <div className="flex items-center gap-2">
            {isNetworkOffline ? (
              <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            ) : (
              <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <div>
              <span className="font-bold">
                {isNetworkOffline ? 'NETWORK OFFLINE / LOW SIGNAL:' : 'UPLINK ACTIVE:'}
              </span>
              {' '}
              <span>
                {isNetworkOffline 
                  ? 'Submissions will be saved locally & queued until link is restored.'
                  : 'Connected directly to Chief Central Policy Engine.'
                }
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleConnectivity}
              className="px-2 py-0.5 rounded text-[10px] font-bold border transition-colors bg-[#021209] hover:bg-[#062617] border-emerald-800 text-emerald-300"
              title="Toggle network simulation to test offline queueing"
            >
              {isNetworkOffline ? 'Switch Online' : 'Simulate Offline'}
            </button>
            {queuedCount > 0 && (
              <button
                onClick={syncQueuedReports}
                disabled={isSyncingQueue || isNetworkOffline}
                className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-black flex items-center gap-1 transition-colors"
              >
                <RotateCw className={`w-3 h-3 ${isSyncingQueue ? 'animate-spin' : ''}`} />
                <span>{isSyncingQueue ? 'Syncing...' : `Sync Queue (${queuedCount})`}</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Main Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[68vh] space-y-5">
          {/* VIEW 1: CATEGORY SELECTION */}
          {activeView === 'select_category' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold uppercase tracking-wider">
                  Select Report Category (10 Structured Subsystems)
                </span>
                <span className="text-emerald-400/60 text-[11px]">Touch to start entry</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {WORKER_REPORT_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setActiveView('form');
                    }}
                    className="p-3.5 rounded-xl border border-emerald-950/80 bg-[#03140c] hover:bg-[#072416] hover:border-emerald-700/80 transition-all text-left flex items-start gap-3 group shadow-sm"
                  >
                    <div className="p-2.5 rounded-lg bg-[#041a10] border border-emerald-900/60 group-hover:scale-105 transition-transform shrink-0">
                      {getCategoryIcon(cat.id)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4 className="text-sm font-bold text-white group-hover:text-emerald-200 transition-colors font-mono truncate">
                          {cat.shortLabel}
                        </h4>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          READY
                        </span>
                      </div>
                      <p className="text-xs text-emerald-300/60 line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-500/40 group-hover:text-emerald-300 transition-colors shrink-0 self-center" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 2: STRUCTURED REPORT ENTRY FORM */}
          {activeView === 'form' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              <div className="flex items-center justify-between border-b border-emerald-950/80 pb-3">
                <button
                  onClick={() => setActiveView('select_category')}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Choose Another Category</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-emerald-400/70">Category:</span>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
                    {getCategoryIcon(selectedCategory)}
                    <span>{WORKER_REPORT_CATEGORIES.find(c => c.id === selectedCategory)?.shortLabel}</span>
                  </span>
                </div>
              </div>

              {/* MORTALITY */}
              {selectedCategory === 'mortality' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-mono text-emerald-400 block mb-1.5 font-bold">
                      Flock &amp; Housing Unit:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {['House 1 (Commercial Layer Barn)', 'House 2 (Environmental Tunnel Barn)'].map(house => (
                        <button
                          key={house}
                          type="button"
                          onClick={() => setMortalityHouse(house)}
                          className={`p-2.5 rounded-lg border text-xs font-mono text-left transition-colors ${
                            mortalityHouse === house 
                              ? 'bg-emerald-600 text-white font-bold border-emerald-400 shadow-sm' 
                              : 'bg-[#03140c] text-emerald-300/80 border-emerald-950 hover:bg-[#072416]'
                          }`}
                        >
                          {house}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#03140c] border border-emerald-950 text-center space-y-2">
                    <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider block font-bold">
                      Mortality Count (Birds Tally)
                    </span>
                    <div className="flex items-center justify-center gap-4 py-2">
                      <button
                        type="button"
                        onClick={() => setMortalityCount(Math.max(0, mortalityCount - 1))}
                        className="w-12 h-12 rounded-xl bg-[#0a2e1b] hover:bg-[#0f3d24] text-white flex items-center justify-center font-bold text-xl border border-emerald-800 active:scale-95 transition-transform"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <div className="px-6 py-2 rounded-xl bg-[#021209] border border-emerald-700/80 min-w-[120px]">
                        <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
                          {mortalityCount}
                        </span>
                        <span className="block text-[10px] text-emerald-400/60 font-mono">Birds Total</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMortalityCount(mortalityCount + 1)}
                        className="w-12 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center font-bold text-xl border border-emerald-400 active:scale-95 transition-transform shadow-md"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-1 font-mono text-xs">
                      {[1, 5, 10].map(add => (
                        <button
                          key={add}
                          type="button"
                          onClick={() => setMortalityCount(prev => prev + add)}
                          className="px-2.5 py-1 rounded-lg bg-[#062617] hover:bg-[#0a3821] text-emerald-300 border border-emerald-900"
                        >
                          +{add}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setMortalityCount(0)}
                        className="px-2.5 py-1 rounded-lg bg-[#160609] hover:bg-[#20080d] text-rose-300 border border-rose-900"
                      >
                        Clear (0)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-emerald-400 block mb-1.5 font-bold">
                      Suspected Cause of Mortality:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                      {(['Sudden Death Syndrome', 'Dehydration / Gout', 'Smothering / Piling', 'Cull / Welfare', 'Unexplained'] as const).map(cause => (
                        <button
                          key={cause}
                          type="button"
                          onClick={() => setMortalityCause(cause)}
                          className={`p-2 rounded-lg border text-left transition-colors ${
                            mortalityCause === cause
                              ? 'bg-emerald-600 text-white font-bold border-emerald-400'
                              : 'bg-[#03140c] text-emerald-300/80 border-emerald-950 hover:bg-[#072416]'
                          }`}
                        >
                          {cause}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-emerald-400 block mb-1.5 font-bold">
                      Biosecure Disposal Method:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
                      {(['Certified Incinerator', 'Deep Pit Composting', 'Biosecure Cold Storage'] as const).map(disp => (
                        <button
                          key={disp}
                          type="button"
                          onClick={() => setDisposalMethod(disp)}
                          className={`p-2 rounded-lg border text-left transition-colors ${
                            disposalMethod === disp
                              ? 'bg-emerald-600 text-white font-bold border-emerald-400'
                              : 'bg-[#03140c] text-emerald-300/80 border-emerald-950 hover:bg-[#072416]'
                          }`}
                        >
                          {disp}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* FEED */}
              {selectedCategory === 'feed' && (
                <div className="space-y-4 font-mono text-xs">
                  <div>
                    <label className="text-emerald-400 block mb-1.5 font-bold">Feed Silo &amp; Barn:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Silo 1 (Layer Mash)', 'Silo 2 (Broiler Crumbles)'].map(silo => (
                        <button
                          key={silo}
                          type="button"
                          onClick={() => setFeedSilo(silo)}
                          className={`p-2.5 rounded-lg border text-left ${feedSilo === silo ? 'bg-emerald-600 text-white font-bold' : 'bg-[#03140c] text-emerald-300 border-emerald-950'}`}
                        >
                          {silo}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#03140c] border border-emerald-950 space-y-2 text-center">
                    <span className="text-emerald-400 block font-bold">Silo Level Estimate ({feedBinLevel}%)</span>
                    <div className="flex items-center justify-center gap-2">
                      {[25, 50, 75, 100].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setFeedBinLevel(pct)}
                          className={`px-3 py-1.5 rounded-lg border ${feedBinLevel === pct ? 'bg-emerald-600 text-white font-bold' : 'bg-[#062617] text-emerald-300 border-emerald-900'}`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-emerald-400 block mb-1.5 font-bold">Physical Condition:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Normal / Dry', 'Caked / Bridging', 'High Dust', 'Off-odor / Mold Suspicion'] as const).map(cond => (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => setFeedCondition(cond)}
                          className={`p-2 rounded-lg border text-left ${feedCondition === cond ? 'bg-emerald-600 text-white font-bold' : 'bg-[#03140c] text-emerald-300 border-emerald-950'}`}
                        >
                          {cond}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#03140c] border border-emerald-950">
                    <span>Auger Lines Operational:</span>
                    <button
                      type="button"
                      onClick={() => setFeederLinesOperational(!feederLinesOperational)}
                      className={`px-3 py-1 rounded-lg font-bold border ${feederLinesOperational ? 'bg-emerald-600 text-white' : 'bg-rose-900 text-white border-rose-700'}`}
                    >
                      {feederLinesOperational ? 'Nominal Run' : 'Jammed / Fault'}
                    </button>
                  </div>
                </div>
              )}

              {/* WATER */}
              {selectedCategory === 'water' && (
                <div className="space-y-4 font-mono text-xs">
                  <div>
                    <label className="text-emerald-400 block mb-1.5 font-bold">Barn Location:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['House 1 (Commercial Layer Barn)', 'House 2 (Environmental Tunnel Barn)'].map(house => (
                        <button
                          key={house}
                          type="button"
                          onClick={() => setWaterHouse(house)}
                          className={`p-2.5 rounded-lg border text-left ${waterHouse === house ? 'bg-emerald-600 text-white font-bold' : 'bg-[#03140c] text-emerald-300 border-emerald-950'}`}
                        >
                          {house}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#03140c] border border-emerald-950 space-y-1.5">
                      <label className="text-emerald-400/80 block font-bold">Header Meter (Liters):</label>
                      <input
                        type="number"
                        value={waterMeterLiters}
                        onChange={(e) => setWaterMeterLiters(Number(e.target.value))}
                        className="w-full bg-[#021209] border border-emerald-700 rounded-lg p-2 text-white font-bold text-base tabular-nums focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#03140c] border border-emerald-950 space-y-1.5">
                      <label className="text-emerald-400/80 block font-bold">Line Column Pressure (PSI):</label>
                      <input
                        type="number"
                        value={waterPressurePsi}
                        onChange={(e) => setWaterPressurePsi(Number(e.target.value))}
                        className="w-full bg-[#021209] border border-emerald-700 rounded-lg p-2 text-white font-bold text-base tabular-nums focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-emerald-400 block mb-1.5 font-bold">Nipple Drinker Line Inspection:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['All Clear', 'Drip / Leak in Bay 3', 'Low Flow Alert', 'Air Lock in Line'] as const).map(status => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setWaterDrinkerStatus(status)}
                          className={`p-2 rounded-lg border text-left ${waterDrinkerStatus === status ? 'bg-emerald-600 text-white font-bold' : 'bg-[#03140c] text-emerald-300 border-emerald-950'}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* EGG PRODUCTION */}
              {selectedCategory === 'egg_production' && (
                <div className="space-y-4 font-mono text-xs">
                  <div>
                    <label className="text-emerald-400 block mb-1.5 font-bold">Collection Shift:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Morning (07:00)', 'Afternoon (13:00)', 'Late Collection (17:00)'] as const).map(shift => (
                        <button
                          key={shift}
                          type="button"
                          onClick={() => setEggShift(shift)}
                          className={`p-2 rounded-lg border text-center ${eggShift === shift ? 'bg-emerald-600 text-white font-bold' : 'bg-[#03140c] text-emerald-300 border-emerald-950'}`}
                        >
                          {shift}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#03140c] border border-emerald-950 text-center space-y-2">
                    <span className="text-emerald-400 block font-bold">Trays Collected (30 eggs/tray)</span>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => setEggTraysCollected(Math.max(0, eggTraysCollected - 5))}
                        className="w-10 h-10 rounded-xl bg-[#0a2e1b] text-white flex items-center justify-center font-bold text-lg border border-emerald-800"
                      >
                        -5
                      </button>
                      <div className="px-5 py-1.5 rounded-xl bg-[#021209] border border-emerald-700 min-w-[140px]">
                        <span className="text-2xl font-bold text-white tabular-nums">{eggTraysCollected} trays</span>
                        <span className="block text-[10px] text-emerald-400">~{(eggTraysCollected * 30).toLocaleString()} eggs</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEggTraysCollected(eggTraysCollected + 5)}
                        className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg border border-emerald-400"
                      >
                        +5
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-[#03140c] border border-emerald-950 space-y-1">
                      <span className="text-emerald-400 block font-bold">Cracked / Soft Shells:</span>
                      <div className="flex items-center justify-between">
                        <button onClick={() => setEggCrackedCount(Math.max(0, eggCrackedCount - 1))} className="px-2 py-0.5 rounded bg-zinc-800 text-white font-bold">-1</button>
                        <span className="text-lg font-bold text-white">{eggCrackedCount}</span>
                        <button onClick={() => setEggCrackedCount(eggCrackedCount + 1)} className="px-2 py-0.5 rounded bg-emerald-800 text-white font-bold">+1</button>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#03140c] border border-emerald-950 space-y-1">
                      <span className="text-emerald-400 block font-bold">Dirty Floor Eggs:</span>
                      <div className="flex items-center justify-between">
                        <button onClick={() => setEggDirtyFloorCount(Math.max(0, eggDirtyFloorCount - 1))} className="px-2 py-0.5 rounded bg-zinc-800 text-white font-bold">-1</button>
                        <span className="text-lg font-bold text-white">{eggDirtyFloorCount}</span>
                        <button onClick={() => setEggDirtyFloorCount(eggDirtyFloorCount + 1)} className="px-2 py-0.5 rounded bg-emerald-800 text-white font-bold">+1</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* FLOCK OBSERVATION */}
              {selectedCategory === 'flock_observation' && (
                <div className="space-y-4 font-mono text-xs">
                  <div>
                    <label className="text-emerald-400 block mb-1.5 font-bold">Bird Activity &amp; Spacing:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Active & Dispersed', 'Slightly Lethargic', 'Agitated / Flighty', 'Huddling under heat lamps'] as const).map(act => (
                        <button
                          key={act}
                          type="button"
                          onClick={() => setObsActivity(act)}
                          className={`p-2 rounded-lg border text-left ${obsActivity === act ? 'bg-emerald-600 text-white font-bold' : 'bg-[#03140c] text-emerald-300 border-emerald-950'}`}
                        >
                          {act}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-emerald-400 block mb-1.5 font-bold">Droppings / Fecal Appearance:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Firm / Normal', 'Watery / Wet Litter', 'Mucoid / Enteritis', 'Blood-tinged (Urgent)'] as const).map(drp => (
                        <button
                          key={drp}
                          type="button"
                          onClick={() => setObsDroppings(drp)}
                          className={`p-2 rounded-lg border text-left ${obsDroppings === drp ? 'bg-emerald-600 text-white font-bold' : 'bg-[#03140c] text-emerald-300 border-emerald-950'}`}
                        >
                          {drp}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-emerald-400 block mb-1.5 font-bold">Litter Moisture Condition:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Dry & Friable (Optimal)', 'Damp in Drinking Zone', 'Caked / High Risk'] as const).map(lit => (
                        <button
                          key={lit}
                          type="button"
                          onClick={() => setObsLitter(lit)}
                          className={`p-2 rounded-lg border text-center ${obsLitter === lit ? 'bg-emerald-600 text-white font-bold' : 'bg-[#03140c] text-emerald-300 border-emerald-950'}`}
                        >
                          {lit}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* EQUIPMENT FAULT */}
              {selectedCategory === 'equipment_fault' && (
                <div className="space-y-4 font-mono text-xs">
                  <div>
                    <label className="text-emerald-400 block mb-1.5 font-bold">Urgency / Severity Level:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Immediate STOP Required', 'Service Within 4h', 'Routine Non-Critical'] as const).map(urg => (
                        <button
                          key={urg}
                          type="button"
                          onClick={() => setEqUrgency(urg)}
                          className={`p-2 rounded-lg border text-center ${
                            eqUrgency === urg 
                              ? urg === 'Immediate STOP Required' ? 'bg-rose-700 text-white font-bold' : 'bg-emerald-600 text-white font-bold'
                              : 'bg-[#03140c] text-emerald-300 border-emerald-950'
                          }`}
                        >
                          {urg}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-emerald-400 block mb-1.5 font-bold">Fault Type:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Belt / Drive Failure', 'Motor Overheating', 'Leak / Pressure Loss', 'Electrical / Tripped Breaker', 'Controller Error Code'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setEqFaultType(type)}
                          className={`p-2 rounded-lg border text-left ${eqFaultType === type ? 'bg-emerald-600 text-white font-bold' : 'bg-[#03140c] text-emerald-300 border-emerald-950'}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-emerald-400 block mb-1.5 font-bold">Fault Description &amp; Details:</label>
                    <textarea
                      value={eqDescription}
                      onChange={(e) => setEqDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-[#021209] border border-emerald-700 rounded-lg p-2 text-white font-sans text-xs focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              )}

              {/* TASK COMPLETION */}
              {selectedCategory === 'task_completion' && (
                <div className="space-y-4 font-mono text-xs">
                  <div>
                    <label className="text-emerald-400 block mb-1.5 font-bold">Select Active Assigned Task:</label>
                    <div className="space-y-2">
                      {INITIAL_FARM_TASKS.map(task => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => setTaskSelectedId(task.id)}
                          className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between ${
                            taskSelectedId === task.id ? 'bg-emerald-600 text-white font-bold' : 'bg-[#03140c] text-emerald-300 border-emerald-950'
                          }`}
                        >
                          <span className="truncate">{task.title}</span>
                          <span className="text-[10px] uppercase font-bold opacity-80 shrink-0 ml-2">{task.priority}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#03140c] border border-emerald-950">
                    <span>Time Spent (Minutes):</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setTaskMinutes(Math.max(5, taskMinutes - 5))} className="px-2 py-0.5 rounded bg-zinc-800 text-white font-bold">-5</button>
                      <span className="text-base font-bold text-white tabular-nums">{taskMinutes} min</span>
                      <button onClick={() => setTaskMinutes(taskMinutes + 5)} className="px-2 py-0.5 rounded bg-emerald-800 text-white font-bold">+5</button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#03140c] border border-emerald-950">
                    <input
                      type="checkbox"
                      id="taskCheck"
                      checked={taskChecklistConfirmed}
                      onChange={(e) => setTaskChecklistConfirmed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-emerald-500 rounded"
                    />
                    <label htmlFor="taskCheck" className="text-emerald-200/90 text-xs">
                      I certify this task was executed in accordance with Chief Biosecurity Standards and animal welfare protocols.
                    </label>
                  </div>
                </div>
              )}

              {/* ENVIRONMENTAL */}
              {selectedCategory === 'environmental_issue' && (
                <div className="space-y-4 font-mono text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#03140c] border border-emerald-950 space-y-1.5">
                      <label className="text-emerald-400 block font-bold">House Temp (°C):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={envTempC}
                        onChange={(e) => setEnvTempC(Number(e.target.value))}
                        className="w-full bg-[#021209] border border-emerald-700 rounded-lg p-2 text-white font-bold text-base"
                      />
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#03140c] border border-emerald-950 space-y-1.5">
                      <label className="text-emerald-400 block font-bold">Relative Humidity (%):</label>
                      <input
                        type="number"
                        value={envHumidityPct}
                        onChange={(e) => setEnvHumidityPct(Number(e.target.value))}
                        className="w-full bg-[#021209] border border-emerald-700 rounded-lg p-2 text-white font-bold text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-emerald-400 block mb-1.5 font-bold">Ammonia (NH3) Odor Level:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['None (<5 ppm)', 'Mild (5-15 ppm)', 'Irritating (15-25 ppm)', 'Dangerous (>25 ppm)'] as const).map(amm => (
                        <button
                          key={amm}
                          type="button"
                          onClick={() => setEnvAmmoniaRating(amm)}
                          className={`p-2 rounded-lg border text-left ${envAmmoniaRating === amm ? 'bg-emerald-600 text-white font-bold' : 'bg-[#03140c] text-emerald-300 border-emerald-950'}`}
                        >
                          {amm}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* EMERGENCY */}
              {selectedCategory === 'emergency' && (
                <div className="p-4 rounded-xl border border-rose-800 bg-[#190508] space-y-4 font-mono text-xs">
                  <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider">
                    <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
                    <span>EMERGENCY DISPATCH TRIGGER</span>
                  </div>
                  <div>
                    <label className="text-rose-200 block mb-1.5 font-bold">Emergency Category:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Ventilation Failure', 'Main Water Cutoff', 'Barn Fire / Smoke', 'Backup Generator Failure', 'Extreme Heat Surge', 'Predator / Biosecurity Breach'] as const).map(em => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setEmergencyType(em)}
                          className={`p-2 rounded-lg border text-left font-bold ${emergencyType === em ? 'bg-rose-700 text-white border-rose-500' : 'bg-[#0f0406] text-rose-200 border-rose-950'}`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-rose-200 block mb-1.5 font-bold">Immediate Containment Action Taken (Mandatory):</label>
                    <textarea
                      value={emergencyActionTaken}
                      onChange={(e) => setEmergencyActionTaken(e.target.value)}
                      rows={2}
                      placeholder="e.g. Activated emergency curtain drop and signaled backup engineer"
                      className="w-full bg-[#0a0204] border border-rose-800 rounded-lg p-2 text-white font-sans text-xs focus:outline-none focus:border-rose-400"
                    />
                  </div>
                </div>
              )}

              {/* PHOTO & EVIDENCE ATTACHMENT WIDGET */}
              <div className="p-4 rounded-xl bg-[#03140c] border border-emerald-950 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-300">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>Evidence Attachments ({attachments.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEvidencePhoto}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#0a2e1b] hover:bg-[#0f3d24] text-emerald-200 border border-emerald-800 flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Camera Capture</span>
                  </button>
                </div>
                {attachments.length === 0 ? (
                  <p className="text-[11px] text-emerald-400/50 font-mono">
                    No photo attachments yet. Optional proof of inspection.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-xs">
                    {attachments.map(att => (
                      <div key={att.id} className="p-2.5 rounded-lg bg-[#021209] border border-emerald-900/80 flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div className="truncate">
                            <span className="text-white text-xs block truncate">{att.name}</span>
                            <span className="text-[10px] text-emerald-400/60 block">{att.watermarkText}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                          className="p-1 rounded text-rose-400 hover:text-white hover:bg-rose-950"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Action Row */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSubmitForm}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-mono font-bold text-sm tracking-wide shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>PROCESSING REPORT...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>SUBMIT {WORKER_REPORT_CATEGORIES.find(c => c.id === selectedCategory)?.shortLabel.toUpperCase()} REPORT</span>
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] font-mono text-emerald-400/60 mt-1.5">
                  Timestamped &amp; signed by {user?.name || 'Tomas Rivera'} • Authoritative Chief Pipeline
                </p>
              </div>

            </div>
          )}

          {/* VIEW 3: SUBMISSION CONFIRMATION & CLEAR STATE BREAKDOWN */}
          {activeView === 'confirmation' && submittedReport && (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              
              <div className="text-center space-y-2 py-2">
                <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center shadow-lg border">
                  {submittedReport.status === 'accepted_by_chief' && (
                    <div className="w-12 h-12 rounded-2xl bg-emerald-950 border-emerald-500 text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  )}
                  {submittedReport.status === 'queued' && (
                    <div className="w-12 h-12 rounded-2xl bg-amber-950 border-amber-500 text-amber-300 flex items-center justify-center">
                      <Clock className="w-6 h-6" />
                    </div>
                  )}
                  {submittedReport.status === 'rejected_needs_correction' && (
                    <div className="w-12 h-12 rounded-2xl bg-rose-950 border-rose-500 text-rose-300 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    {renderStatusBadge(submittedReport.status, submittedReport.isQueuedOffline)}
                  </div>
                  <h3 className="text-base font-bold text-white font-mono">
                    {submittedReport.status === 'accepted_by_chief' && 'Report Confirmed by Chief Engine'}
                    {submittedReport.status === 'queued' && 'Saved to Offline Queue'}
                    {submittedReport.status === 'rejected_needs_correction' && 'Correction Required'}
                  </h3>
                  <p className="text-xs text-emerald-300/80 font-mono">
                    Report ID: <strong>{submittedReport.reportNumber}</strong>
                  </p>
                </div>
              </div>

              {/* Status Explanation Card */}
              <div className={`p-4 rounded-xl border text-xs font-mono space-y-2.5 ${
                submittedReport.status === 'accepted_by_chief'
                  ? 'bg-[#03180e] border-emerald-900/80 text-emerald-200'
                  : submittedReport.status === 'queued'
                  ? 'bg-[#191204] border-amber-900/80 text-amber-200'
                  : 'bg-[#160609] border-rose-900/80 text-rose-200'
              }`}>
                {submittedReport.status === 'accepted_by_chief' && (
                  <>
                    <p className="leading-relaxed">
                      Chief Central Policy Engine accepted and sealed this report. Cryptographic verification proof has been appended to the authoritative audit history.
                    </p>
                    <div className="p-2.5 rounded-lg bg-[#021209] border border-emerald-950 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between text-emerald-400">
                        <span>Verification Hash:</span>
                        <span className="font-bold">{submittedReport.backendConfirmationHash?.slice(0, 24)}...</span>
                      </div>
                      <div className="flex items-center justify-between text-emerald-400/70">
                        <span>Backend Timestamp:</span>
                        <span>{submittedReport.backendConfirmedAt}</span>
                      </div>
                      <div className="flex items-center justify-between text-emerald-400/70">
                        <span>Attributed Worker:</span>
                        <span>{submittedReport.workerName} ({submittedReport.workerRole})</span>
                      </div>
                    </div>
                  </>
                )}

                {submittedReport.status === 'queued' && (
                  <>
                    <p className="leading-relaxed">
                      <strong>Stored Safely on Device:</strong> Network connectivity is unavailable or Chief backend could not be reached. This report is placed in the local persistent queue. It will automatically transmit to Chief as soon as link is restored.
                    </p>
                    <div className="p-2.5 rounded-lg bg-[#0a0701] border border-amber-950 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-amber-400">
                        <span>Local Device Timestamp:</span>
                        <span>{submittedReport.timestampFormatted}</span>
                      </div>
                      <div className="flex items-center justify-between text-amber-400/70">
                        <span>Sync Queue Position:</span>
                        <span>Item #{queuedCount}</span>
                      </div>
                    </div>
                  </>
                )}

                {submittedReport.status === 'rejected_needs_correction' && (
                  <>
                    <p className="leading-relaxed">
                      <strong>Policy Validation Error:</strong> {submittedReport.rejectionReason}
                    </p>
                    <p className="text-[11px] text-rose-300/80">
                      Please adjust the field inputs to satisfy backend invariant rules.
                    </p>
                  </>
                )}
              </div>

              {/* Report Summary Details */}
              <div className="p-3.5 rounded-xl bg-[#03140c] border border-emerald-950 text-xs font-mono space-y-2">
                <span className="text-emerald-400/70 text-[10px] uppercase font-bold block">Summary Payload</span>
                <p className="text-white font-sans text-xs">{submittedReport.summary}</p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs">
                {submittedReport.status === 'rejected_needs_correction' ? (
                  <button
                    onClick={() => setActiveView('form')}
                    className="col-span-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-bold text-center"
                  >
                    Edit &amp; Correct Report
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setActiveView('select_category')}
                      className="py-3 rounded-xl bg-[#0a2e1b] hover:bg-[#0f3d24] text-emerald-200 border border-emerald-800 font-bold text-center"
                    >
                      + New Report
                    </button>
                    <button
                      onClick={() => setActiveView('queue_history')}
                      className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-center"
                    >
                      View All Reports
                    </button>
                  </>
                )}
              </div>

            </div>
          )}

          {/* VIEW 4: QUEUE & SUBMISSION LOGS */}
          {activeView === 'queue_history' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">
                    Device Report Queue &amp; History
                  </h3>
                  <p className="text-[11px] text-emerald-400/60">
                    {reports.length} total local entries • {queuedCount} waiting for uplink
                  </p>
                </div>
                {queuedCount > 0 && (
                  <button
                    onClick={syncQueuedReports}
                    disabled={isSyncingQueue || isNetworkOffline}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isSyncingQueue ? 'animate-spin' : ''}`} />
                    <span>Sync All ({queuedCount})</span>
                  </button>
                )}
              </div>

              {reports.length === 0 ? (
                <div className="p-8 text-center bg-[#03140c] rounded-xl border border-emerald-950 text-emerald-400/60 space-y-2">
                  <Layers className="w-8 h-8 mx-auto text-emerald-600/40" />
                  <p>No worker reports logged yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map(rep => (
                    <div 
                      key={rep.id} 
                      className={`p-3.5 rounded-xl border space-y-2 ${
                        rep.status === 'accepted_by_chief'
                          ? 'bg-[#03140c] border-emerald-950'
                          : rep.status === 'queued'
                          ? 'bg-[#120d03] border-amber-900/60'
                          : 'bg-[#140608] border-rose-900/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{rep.reportNumber}</span>
                            <span className="text-emerald-400/60 text-[10px]">{rep.categoryLabel}</span>
                          </div>
                          <span className="text-[10px] text-emerald-400/50 block">
                            Logged by {rep.workerName} • {rep.timestampFormatted}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderStatusBadge(rep.status, rep.isQueuedOffline)}
                        </div>
                      </div>

                      <p className="text-white/90 font-sans text-xs">{rep.summary}</p>

                      {rep.backendConfirmationHash && (
                        <div className="text-[10px] text-emerald-400/70 font-mono bg-[#021209] p-1.5 rounded flex items-center justify-between">
                          <span>Hash: {rep.backendConfirmationHash.slice(0, 28)}...</span>
                          <span>Confirmed: {rep.backendConfirmedAt}</span>
                        </div>
                      )}

                      {rep.rejectionReason && (
                        <div className="text-[11px] text-rose-300 font-mono bg-[#1b0508] p-1.5 rounded">
                          Error: {rep.rejectionReason}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-emerald-950/60 text-[11px]">
                        <span className="text-emerald-400/60">
                          {rep.evidenceAttachments?.length > 0 
                            ? `${rep.evidenceAttachments.length} evidence attachment(s)` 
                            : 'No attachments'
                          }
                        </span>
                        <div className="flex items-center gap-2">
                          {rep.status === 'queued' && (
                            <button
                              onClick={() => retryReport(rep.id)}
                              disabled={isNetworkOffline}
                              className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 text-black font-bold text-[10px]"
                            >
                              Sync Now
                            </button>
                          )}
                          <button
                            onClick={() => deleteReport(rep.id)}
                            className="p-1 rounded text-rose-400/70 hover:text-rose-300 hover:bg-rose-950"
                            title="Remove local draft"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => setActiveView('select_category')}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-center font-mono"
                >
                  + Create New Report
                </button>
              </div>

            </div>
          )}
        </div>

        {/* 4. Footer Help */}
        <div className="p-3 sm:p-4 border-t border-emerald-950/90 bg-[#021007] text-[11px] font-mono text-emerald-400/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Chief Mobile Worker Protocol • Session Verified</span>
          </div>
          <div className="text-right">
            <span>Offline Queue Ready</span>
          </div>
        </div>

      </div>
    </div>
  );
};
