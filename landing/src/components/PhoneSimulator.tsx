import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, Shield, Check, Plus, X, Lock, Unlock, Settings, 
  Calendar, Flame, Award, Sliders, Smartphone, Inbox, Mail,
  MessageSquareText, Layers, Notebook, Github, Palette, CheckSquare, 
  Video, Play, Info, AlertCircle, RefreshCw, Zap, VolumeX, Moon, Sun, 
  ChevronRight, Heart, Bell
} from 'lucide-react';
import { WorkApp, WorkSchedule, AppLog, SimulatorStats } from '../types';
import { INITIAL_WORK_APPS, SMART_SUGGESTIONS } from '../data/mockData';

interface PhoneSimulatorProps {
  onStatsChange: (stats: SimulatorStats) => void;
  onLogAdded: (log: AppLog) => void;
}

// Self-contained interactive demo (sandbox). It unlocks "Pro" locally to show
// the premium UX — it never records a real signup or willingness-to-pay signal.
export default function PhoneSimulator({
  onStatsChange,
  onLogAdded,
}: PhoneSimulatorProps) {
  // App States
  const [apps, setApps] = useState<WorkApp[]>(() => {
    const saved = localStorage.getItem('clockout_apps');
    return saved ? JSON.parse(saved) : INITIAL_WORK_APPS;
  });
  
  const [suggestions, setSuggestions] = useState<WorkApp[]>(SMART_SUGGESTIONS);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('clockout_onboarded') === 'true';
  });
  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  
  const [schedule, setSchedule] = useState<WorkSchedule>(() => {
    const saved = localStorage.getItem('clockout_schedule');
    return saved ? JSON.parse(saved) : {
      startHour: 9,
      startMinute: 0,
      endHour: 18,
      endMinute: 0,
      days: [1, 2, 3, 4, 5], // Mon-Fri
    };
  });

  const [isPro, setIsPro] = useState<boolean>(() => {
    return localStorage.getItem('clockout_is_pro') === 'true';
  });
  const [strictMode, setStrictMode] = useState<boolean>(() => {
    return localStorage.getItem('clockout_strict_mode') === 'true';
  });
  
  // Custom app creator state
  const [newAppName, setNewAppName] = useState('');
  const [newAppCategory, setNewAppCategory] = useState('Productivity');

  // Simulator Time Control (Simulated hours/minutes)
  const [simHour, setSimHour] = useState<number>(21); // Default to 9:00 PM (After hours)
  const [simMinute, setSimMinute] = useState<number>(45); // Default to 45 mins
  
  // Stats
  const [stats, setStats] = useState<SimulatorStats>(() => {
    const saved = localStorage.getItem('clockout_stats');
    return saved ? JSON.parse(saved) : {
      eveningsReclaimed: 5,
      opensAvoided: 12,
      streak: 6,
      totalNudges: 18,
    };
  });

  // Logs
  const [logs, setLogs] = useState<AppLog[]>([]);

  // Navigation inside the onboarded phone
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'settings'>('dashboard');

  // Nudge Overlay State
  const [activeNudgeApp, setActiveNudgeApp] = useState<WorkApp | null>(null);
  const [nudgeCountdown, setNudgeCountdown] = useState<number>(3);
  const [nudgeState, setNudgeState] = useState<'countdown' | 'choice' | 'reclaimed' | 'bypassed'>('countdown');
  const [breathPulse, setBreathPulse] = useState<boolean>(true);
  const [simulatedWorkScreen, setSimulatedWorkScreen] = useState<string | null>(null);

  // Trigger parent updates on init
  useEffect(() => {
    onStatsChange(stats);
  }, []);

  // Save changes & sync to parent
  useEffect(() => {
    localStorage.setItem('clockout_apps', JSON.stringify(apps));
  }, [apps]);

  useEffect(() => {
    localStorage.setItem('clockout_schedule', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem('clockout_is_pro', String(isPro));
  }, [isPro]);

  useEffect(() => {
    localStorage.setItem('clockout_strict_mode', String(strictMode));
  }, [strictMode]);

  useEffect(() => {
    localStorage.setItem('clockout_stats', JSON.stringify(stats));
    onStatsChange(stats);
  }, [stats]);

  // Breathing animation simulation inside nudge
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeNudgeApp && nudgeState === 'countdown') {
      interval = setInterval(() => {
        setBreathPulse(prev => !prev);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [activeNudgeApp, nudgeState]);

  // Countdown timer inside nudge
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeNudgeApp && nudgeState === 'countdown') {
      if (nudgeCountdown > 1) {
        timer = setTimeout(() => {
          setNudgeCountdown(prev => prev - 1);
        }, 1000);
      } else {
        timer = setTimeout(() => {
          setNudgeState('choice');
        }, 1000);
      }
    }
    return () => clearTimeout(timer);
  }, [activeNudgeApp, nudgeCountdown, nudgeState]);

  // Helper to determine if simulated time is "Work Hours"
  const isWorkHours = (): boolean => {
    // Current day representation (defaulting to a weekday if testing)
    // We can assume it is a working day, but we check if hour is between start and end
    const currentDecimalTime = simHour + simMinute / 60;
    const startDecimalTime = schedule.startHour + schedule.startMinute / 60;
    const endDecimalTime = schedule.endHour + schedule.endMinute / 60;

    return currentDecimalTime >= startDecimalTime && currentDecimalTime <= endDecimalTime;
  };

  const getStatusText = () => {
    if (isWorkHours()) {
      return { text: "Work Mode Active", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    }
    return { text: "Clocked Out 🎉", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
  };

  // Icon selector helper
  const renderAppIcon = (name: string, sizeClass = "w-6 h-6", colorClass = "text-white") => {
    switch (name) {
      case 'Slack':
        return <div className={`flex items-center justify-center rounded-lg bg-indigo-900 ${sizeClass}`}><span className="text-xs font-bold text-teal-400">#</span></div>;
      case 'MessageSquareText':
        return <div className={`flex items-center justify-center rounded-lg bg-blue-600 ${sizeClass}`}><MessageSquareText className={`w-1/2 h-1/2 ${colorClass}`} /></div>;
      case 'Mail':
        return <div className={`flex items-center justify-center rounded-lg bg-red-500 ${sizeClass}`}><Mail className={`w-1/2 h-1/2 ${colorClass}`} /></div>;
      case 'Inbox':
        return <div className={`flex items-center justify-center rounded-lg bg-blue-500 ${sizeClass}`}><Inbox className={`w-1/2 h-1/2 ${colorClass}`} /></div>;
      case 'Layers':
        return <div className={`flex items-center justify-center rounded-lg bg-pink-500 ${sizeClass}`}><Layers className={`w-1/2 h-1/2 ${colorClass}`} /></div>;
      case 'Notebook':
        return <div className={`flex items-center justify-center rounded-lg bg-neutral-800 ${sizeClass}`}><Notebook className={`w-1/2 h-1/2 ${colorClass}`} /></div>;
      case 'Github':
        return <div className={`flex items-center justify-center rounded-lg bg-neutral-900 ${sizeClass}`}><Github className={`w-1/2 h-1/2 ${colorClass}`} /></div>;
      case 'Palette':
        return <div className={`flex items-center justify-center rounded-lg bg-neutral-950 border border-neutral-800 ${sizeClass}`}><Palette className={`w-1/2 h-1/2 text-orange-500`} /></div>;
      case 'CheckSquare':
        return <div className={`flex items-center justify-center rounded-lg bg-emerald-600 ${sizeClass}`}><CheckSquare className={`w-1/2 h-1/2 ${colorClass}`} /></div>;
      case 'Video':
        return <div className={`flex items-center justify-center rounded-lg bg-sky-500 ${sizeClass}`}><Video className={`w-1/2 h-1/2 ${colorClass}`} /></div>;
      default:
        return <div className={`flex items-center justify-center rounded-lg bg-neutral-700 ${sizeClass}`}><CheckSquare className={`w-1/2 h-1/2 ${colorClass}`} /></div>;
    }
  };

  // Log adding helper
  const addLog = (appName: string, action: 'reclaimed' | 'opened') => {
    const timeStr = `${simHour.toString().padStart(2, '0')}:${simMinute.toString().padStart(2, '0')} ${simHour >= 12 ? 'PM' : 'AM'}`;
    const newLog: AppLog = {
      id: Math.random().toString(),
      appName,
      action,
      timestamp: new Date(),
      mockTime: timeStr
    };
    const updated = [newLog, ...logs];
    setLogs(updated);
    onLogAdded(newLog);
  };

  // Launch app action
  const handleAppLaunch = (app: WorkApp) => {
    if (!app.isSelected) {
      // Not designated as work app - open freely
      setSimulatedWorkScreen(app.name);
      return;
    }

    if (isWorkHours()) {
      // During work hours - open freely
      addLog(app.name, 'opened');
      setSimulatedWorkScreen(app.name);
    } else {
      // Trigger Nudge!
      setActiveNudgeApp(app);
      setNudgeCountdown(3);
      setNudgeState('countdown');
      setStats(prev => ({
        ...prev,
        totalNudges: prev.totalNudges + 1
      }));
    }
  };

  // Custom App Submission
  const handleAddCustomApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) return;
    const newApp: WorkApp = {
      id: newAppName.toLowerCase().replace(/\s+/g, '-'),
      name: newAppName,
      iconName: 'CheckSquare',
      category: newAppCategory,
      isSelected: true
    };
    setApps([...apps, newApp]);
    setNewAppName('');
  };

  // Accept Nudge (Reclaim Evening)
  const handleNudgeReclaim = () => {
    if (!activeNudgeApp) return;
    setNudgeState('reclaimed');
    setStats(prev => ({
      ...prev,
      eveningsReclaimed: prev.eveningsReclaimed + 1,
      opensAvoided: prev.opensAvoided + 1,
      streak: prev.streak + 1
    }));
    addLog(activeNudgeApp.name, 'reclaimed');
    setTimeout(() => {
      setActiveNudgeApp(null);
    }, 2000);
  };

  // Bypass Nudge (Open anyway)
  const handleNudgeBypass = () => {
    if (!activeNudgeApp || (strictMode && isPro)) return;
    setNudgeState('bypassed');
    addLog(activeNudgeApp.name, 'opened');
    setTimeout(() => {
      setSimulatedWorkScreen(activeNudgeApp.name);
      setActiveNudgeApp(null);
    }, 1500);
  };

  // Accept Smart Suggestion from auto-learning
  const handleAcceptSuggestion = (app: WorkApp) => {
    setApps(prev => prev.map(a => a.id === app.id ? { ...a, isSelected: true } : a));
    setSuggestions(prev => prev.filter(s => s.id !== app.id));
  };

  const handleFinishOnboarding = () => {
    setIsOnboarded(true);
    localStorage.setItem('clockout_onboarded', 'true');
  };

  const handleResetSimulator = () => {
    localStorage.clear();
    setIsOnboarded(false);
    setOnboardingStep(0);
    setApps(INITIAL_WORK_APPS);
    setSuggestions(SMART_SUGGESTIONS);
    setSchedule({
      startHour: 9,
      startMinute: 0,
      endHour: 18,
      endMinute: 0,
      days: [1, 2, 3, 4, 5]
    });
    setIsPro(false);
    setStrictMode(false);
    setStats({
      eveningsReclaimed: 5,
      opensAvoided: 12,
      streak: 6,
      totalNudges: 18,
    });
    setLogs([]);
    setActiveTab('dashboard');
    setActiveNudgeApp(null);
    setSimulatedWorkScreen(null);
  };

  // Helper to format mock hours nicely
  const formatTime = (h: number, m: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* TIME SYSTEM CONTROLLER (PHYSICAL DECK AT THE TOP) */}
      <div className="w-full max-w-sm mb-6 bg-neutral-900/50 border border-neutral-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1.5 uppercase tracking-widest font-bold">
            <Sliders className="w-3.5 h-3.5 text-[#F97316]" />
            VIRTUAL SYSTEM TIME CONTROL
          </span>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20 uppercase tracking-wider">
            Slide to Test App
          </span>
        </div>
        
        <div className="flex items-center justify-between mb-4 bg-neutral-950 p-3 rounded-2xl border border-neutral-800/80">
          <div>
            <div className="text-xl font-bold font-mono text-[#FAFAFA] tracking-wider flex items-center gap-2">
              {simHour >= 18 || simHour < 9 ? <Moon className="w-5 h-5 text-[#F97316]" /> : <Sun className="w-5 h-5 text-[#F97316]" />}
              {formatTime(simHour, simMinute)}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1 font-mono">
              Work schedule: {formatTime(schedule.startHour, schedule.startMinute)} - {formatTime(schedule.endHour, schedule.endMinute)}
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusText().bg} ${getStatusText().color} ${getStatusText().border}`}>
            {getStatusText().text}
          </div>
        </div>

        {/* Hour Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[9px] font-mono text-neutral-500 uppercase tracking-wider">
            <span>Midnight</span>
            <span className="text-amber-500/80 font-bold">9 AM (Work Start)</span>
            <span className="text-[#F97316] font-bold">6 PM (Work End)</span>
            <span>11 PM</span>
          </div>
          <input 
            id="time-slider"
            type="range" 
            min="0" 
            max="23" 
            value={simHour}
            onChange={(e) => setSimHour(parseInt(e.target.value))}
            className="w-full accent-[#F97316] h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button 
            id="preset-work-hours"
            onClick={() => { setSimHour(14); setSimMinute(0); }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${simHour === 14 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-neutral-950 text-neutral-400 border border-transparent hover:bg-neutral-800/50'}`}
          >
            <Sun className="w-3.5 h-3.5" />
            2:00 PM (In-Work)
          </button>
          <button 
            id="preset-after-hours"
            onClick={() => { setSimHour(21); setSimMinute(45); }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${simHour === 21 ? 'bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/30' : 'bg-neutral-950 text-neutral-400 border border-transparent hover:bg-neutral-800/50'}`}
          >
            <Moon className="w-3.5 h-3.5" />
            9:45 PM (Off-Hours)
          </button>
        </div>
      </div>

      {/* MOBILE DEVICE CONTAINER */}
      <div id="phone-shell" className="relative w-80 h-[640px] bg-neutral-950 rounded-[40px] border-[10px] border-neutral-900 shadow-2xl overflow-hidden flex flex-col ring-8 ring-neutral-950/20">
        
        {/* Notch / Speaker bar */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-50 flex items-center justify-center gap-2">
          <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
          <div className="w-2.5 h-2.5 bg-slate-950 border border-slate-800 rounded-full"></div>
        </div>

        {/* Status Bar */}
        <div className="bg-slate-950 h-7 pt-1 px-5 flex justify-between items-center z-40 text-[10px] font-mono text-slate-400 font-medium select-none">
          <span>{simHour.toString().padStart(2, '0')}:{simMinute.toString().padStart(2, '0')}</span>
          <div className="flex items-center gap-1">
            {isPro && <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />}
            <span className="text-[9px] bg-slate-900 px-1 py-0.5 rounded border border-slate-800 text-emerald-400">LTE</span>
            <div className="w-4 h-2.5 border border-slate-600 rounded-sm p-[1px] flex items-center">
              <div className="w-full h-full bg-emerald-500 rounded-2xs"></div>
            </div>
          </div>
        </div>

        {/* SCREEN INTERIOR */}
        <div className="flex-1 overflow-y-auto relative flex flex-col bg-slate-950">
          
          {/* A. ONBOARDING SEQUENCE */}
          {!isOnboarded ? (
            <div className="flex-1 flex flex-col justify-between p-5 text-slate-200">
              
              {/* Step 0: Welcome Screen */}
              {onboardingStep === 0 && (
                <div className="flex-1 flex flex-col justify-between py-4 animate-fadeIn">
                  <div className="flex flex-col items-center text-center mt-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#F97316] flex items-center justify-center shadow-lg shadow-[#F97316]/30 mb-4 border border-[#F97316]/20">
                      <Clock className="w-8 h-8 text-black stroke-[2.5] animate-spin-slow" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white font-display">Clockout</h1>
                    <p className="text-xs text-[#F97316] font-medium mt-1 uppercase tracking-widest">Reclaim your evenings</p>
                    
                    <div className="mt-6 bg-slate-900/80 rounded-2xl p-4 border border-slate-800 text-left max-w-xs text-xs space-y-3">
                      <p className="text-slate-300 leading-relaxed">
                        Remote workers check work apps outside working hours up to <strong className="text-[#F97316]">14 times</strong> an evening.
                      </p>
                      
                      {/* Notification Nudge Mock */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded bg-[#F97316]/20 flex items-center justify-center font-bold text-[#F97316] text-[10px]">#</div>
                        <div className="flex-1 text-[10px]">
                          <div className="flex justify-between font-bold text-slate-300">
                            <span>Slack • 9:42 PM</span>
                            <span className="text-slate-500 font-normal">Now</span>
                          </div>
                          <p className="text-slate-400 line-clamp-1 mt-0.5">PM: "Hey, can we look at this ticket before tomorrow?"</p>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-center gap-2 text-[10px]">
                        <Shield className="w-3.5 h-3.5 text-[#4ADE80] shrink-0" />
                        <span className="text-slate-300">
                          <strong>Clockout</strong> blocks the app, prompting a 3-second breathing space.
                        </span>
                      </div>
                    </div>
                  </div>

                  <button 
                    id="welcome-next-btn"
                    onClick={() => setOnboardingStep(1)}
                    className="w-full bg-[#F97316] hover:bg-[#F97316]/90 text-black font-extrabold py-3 px-4 rounded-xl transition text-sm flex items-center justify-center gap-1 shadow-lg shadow-[#F97316]/20 mt-4 uppercase tracking-wider"
                  >
                    Set Up My Boundaries
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Step 1: Work App Selection */}
              {onboardingStep === 1 && (
                <div className="flex-1 flex flex-col justify-between py-2 animate-fadeIn">
                  <div>
                    <h2 className="text-lg font-bold text-white mt-2">What are your work apps?</h2>
                    <p className="text-xs text-slate-400 mt-1">Select the tools you want Clockout to protect you from checking off-hours.</p>

                    {/* Pre-seeded Apps */}
                    <div className="space-y-2 mt-4 max-h-[220px] overflow-y-auto pr-1">
                      {apps.map(app => (
                        <div 
                          key={app.id}
                          onClick={() => {
                            setApps(apps.map(a => a.id === app.id ? { ...a, isSelected: !a.isSelected } : a));
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${app.isSelected ? 'bg-[#F97316]/10 border-[#F97316]/50 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                        >
                          <div className="flex items-center gap-2.5">
                            {renderAppIcon(app.iconName, "w-8 h-8")}
                            <div>
                              <div className="text-xs font-semibold">{app.name}</div>
                              <div className="text-[10px] text-slate-500">{app.category}</div>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${app.isSelected ? 'bg-[#F97316] border-[#F97316] text-black' : 'border-slate-700'}`}>
                            {app.isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Smart Suggestion banner inside onboarding */}
                    {suggestions.length > 0 && (
                      <div className="mt-4 bg-[#F97316]/5 border border-[#F97316]/20 rounded-xl p-2.5 text-xs">
                        <div className="flex items-center gap-1.5 text-[#F97316] font-bold text-[10px] uppercase tracking-wider mb-1">
                          <Zap className="w-3 h-3 animate-bounce" />
                          On-Device Smart Suggestion
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-300">
                          <span>Is <strong className="text-white">{suggestions[0].name}</strong> a work app? Frequent evening opens detected.</span>
                          <button 
                            id={`add-suggested-${suggestions[0].id}`}
                            onClick={() => handleAcceptSuggestion(suggestions[0])}
                            className="bg-[#F97316] hover:bg-[#F97316]/90 px-2 py-0.5 rounded text-[9px] font-bold text-black transition-all shrink-0 ml-2"
                          >
                            + Classify Work
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Custom app adder */}
                    <form onSubmit={handleAddCustomApp} className="mt-3 flex gap-2">
                      <input 
                        id="custom-app-input"
                        type="text" 
                        placeholder="Add other (e.g. WhatsApp, Discord)..."
                        value={newAppName}
                        onChange={(e) => setNewAppName(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#F97316]"
                      />
                      <button 
                        id="add-custom-app-btn"
                        type="submit" 
                        className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0"
                      >
                        Add
                      </button>
                    </form>
                  </div>

                  <button 
                    id="app-selection-next-btn"
                    onClick={() => setOnboardingStep(2)}
                    className="w-full bg-[#F97316] hover:bg-[#F97316]/90 text-black font-extrabold py-3 px-4 rounded-xl transition text-sm flex items-center justify-center gap-1 shadow-lg shadow-[#F97316]/20 mt-4 uppercase tracking-wider"
                  >
                    Set My Work Hours
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Step 2: Work Hours Schedule Setup */}
              {onboardingStep === 2 && (
                <div className="flex-1 flex flex-col justify-between py-2 animate-fadeIn">
                  <div>
                    <h2 className="text-lg font-bold text-white mt-2 font-display">When do you work?</h2>
                    <p className="text-xs text-slate-400 mt-1">Clockout intercepts work-app opens outside these hours to protect your personal downtime.</p>

                    <div className="space-y-4 mt-6">
                      {/* Work Start */}
                      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
                        <label className="text-xs font-semibold text-[#F97316] flex items-center gap-1.5 mb-2">
                          <Sun className="w-3.5 h-3.5 text-amber-500" />
                          WORKDAY STARTS
                        </label>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold font-mono text-white">
                            {schedule.startHour.toString().padStart(2, '0')}:00 AM
                          </span>
                          <input 
                            id="schedule-start-slider"
                            type="range" 
                            min="6" 
                            max="11" 
                            value={schedule.startHour}
                            onChange={(e) => setSchedule({ ...schedule, startHour: parseInt(e.target.value) })}
                            className="w-32 accent-[#F97316]"
                          />
                        </div>
                      </div>

                      {/* Work End */}
                      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
                        <label className="text-xs font-semibold text-[#F97316] flex items-center gap-1.5 mb-2">
                          <Moon className="w-3.5 h-3.5 text-[#F97316]" />
                          WORKDAY ENDS (BOUNDARIES ACTIVATE)
                        </label>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold font-mono text-white">
                            {(schedule.endHour - 12).toString().padStart(2, '0')}:00 PM
                          </span>
                          <input 
                            id="schedule-end-slider"
                            type="range" 
                            min="15" 
                            max="21" 
                            value={schedule.endHour}
                            onChange={(e) => setSchedule({ ...schedule, endHour: parseInt(e.target.value) })}
                            className="w-32 accent-[#F97316]"
                          />
                        </div>
                      </div>

                      {/* Days Active */}
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Active Workdays</span>
                        <div className="flex justify-between mt-2">
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                            const isSelected = schedule.days.includes(idx);
                            return (
                              <button
                                key={idx}
                                id={`day-pill-${idx}`}
                                onClick={() => {
                                  if (isSelected) {
                                    setSchedule({ ...schedule, days: schedule.days.filter(d => d !== idx) });
                                  } else {
                                    setSchedule({ ...schedule, days: [...schedule.days, idx].sort() });
                                  }
                                }}
                                className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${isSelected ? 'bg-[#F97316] text-black font-extrabold shadow-sm' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    id="hours-next-btn"
                    onClick={() => setOnboardingStep(3)}
                    className="w-full bg-[#F97316] hover:bg-[#F97316]/90 text-black font-extrabold py-3 px-4 rounded-xl transition text-sm flex items-center justify-center gap-1 shadow-lg shadow-[#F97316]/20 mt-4 uppercase tracking-wider"
                  >
                    Configure Protection
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Step 3: Clockout Pro Paywall */}
              {onboardingStep === 3 && (
                <div className="flex-1 flex flex-col justify-between py-1 animate-fadeIn">
                  <div className="max-h-[440px] overflow-y-auto pr-1">
                    <div className="flex flex-col items-center text-center mt-2">
                      <div className="px-3 py-1 rounded-full bg-[#F97316]/10 text-[#F97316] text-[10px] font-bold border border-[#F97316]/20 flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-[#F97316]" />
                        CLOCKOUT PRO
                      </div>
                      <h2 className="text-lg font-bold text-white mt-1.5 font-display">Unplug with Absolute Ease</h2>
                      <p className="text-xs text-slate-400">Lock work in its place. Build lasting, healthy habits.</p>
                    </div>

                    {/* Pro features list */}
                    <div className="space-y-2 mt-4 text-xs">
                      <div className="flex items-start gap-2.5 bg-slate-900/50 p-2 rounded-xl border border-slate-800/50">
                        <div className="bg-[#F97316]/20 p-1.5 rounded-lg text-[#F97316]">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-200">Strict Mode Boundaries</h4>
                          <p className="text-[10px] text-slate-400">Completely block bypassing. Locks the "Open Anyway" screen during weak moments.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 bg-slate-900/50 p-2 rounded-xl border border-slate-800/50">
                        <div className="bg-emerald-600/20 p-1.5 rounded-lg text-emerald-400">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-200">Custom Multi-Schedules</h4>
                          <p className="text-[10px] text-slate-400">Add lunch break locks, weekend boundaries, or custom deep-focus hours.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 bg-slate-900/50 p-2 rounded-xl border border-slate-800/50">
                        <div className="bg-amber-600/20 p-1.5 rounded-lg text-amber-400">
                          <Flame className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-200">Reclaim Analytics & streaks</h4>
                          <p className="text-[10px] text-slate-400">Receive smart, custom reports detailing evenings saved and digital wellness gains.</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 bg-slate-900/40 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2 text-[9px] text-slate-400">
                      <Info className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                      <span>Demo only — &ldquo;trying Pro&rdquo; just unlocks Pro features in this sandbox. No account, no charge, no signup. See pricing on the left.</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <button
                       id="start-trial-btn"
                      onClick={() => {
                        setIsPro(true);
                        setStrictMode(true);
                        handleFinishOnboarding();
                      }}
                      className="w-full bg-[#F97316] hover:bg-[#F97316]/90 text-black font-extrabold py-3 px-4 rounded-xl transition text-sm flex flex-col items-center justify-center shadow-lg shadow-[#F97316]/20 uppercase tracking-wider"
                    >
                      <span className="font-extrabold flex items-center gap-1">Try Pro in the demo <Zap className="w-4 h-4 fill-black" /></span>
                      <span className="text-[9px] text-black/70 font-semibold">Unlocks Strict Mode &amp; analytics in this sandbox</span>
                    </button>

                    <button
                      id="skip-trial-btn"
                      onClick={handleFinishOnboarding}
                      className="w-full text-center py-1 text-[10px] text-slate-500 hover:text-slate-400 transition"
                    >
                      Continue with Free basic version
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            
            /* B. FULLY ONBOARDED ACTIVE RUNNING DASHBOARD */
            <div className="flex-1 flex flex-col justify-between text-slate-200">
              
              {/* Active Tab Screen Body */}
              <div className="flex-1 p-4 overflow-y-auto max-h-[510px]">
                
                {/* 1. DASHBOARD TAB */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-4 animate-fadeIn">
                                   {/* Boundary Core State Display */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-center relative overflow-hidden">
                      {/* Gradient Backdrop Accent */}
                      <div className={`absolute inset-0 bg-gradient-to-b opacity-[0.03] pointer-events-none ${isWorkHours() ? 'from-amber-500 to-transparent' : 'from-emerald-500 to-transparent'}`}></div>
                      
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] text-[#F97316] font-bold uppercase tracking-wider font-display">Clockout Boundary</span>
                        {isPro && (
                          <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5 fill-amber-400" /> Pro active
                          </span>
                        )}
                      </div>

                      {/* Boundary Active Visual Ring */}
                      <div className="my-3 flex flex-col items-center justify-center">
                        <div className={`relative w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all duration-700 ${isWorkHours() ? 'border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]' : 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]'}`}>
                          
                          {/* Inside Ring UI */}
                          <div className="text-center flex flex-col items-center justify-center">
                            {isWorkHours() ? (
                              <>
                                <Sun className="w-7 h-7 text-amber-500 mb-1" />
                                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Active Work</span>
                              </>
                            ) : (
                              <>
                                <Moon className="w-7 h-7 text-emerald-400 mb-1 animate-pulse" />
                                <span className="text-[9px] font-semibold text-emerald-400 uppercase tracking-wider">Boundary On</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300">
                        {isWorkHours() ? (
                          <span>Monitoring paused. Boundaries activate automatically at <strong className="text-amber-500 font-bold">{formatTime(schedule.endHour, schedule.endMinute)}</strong>.</span>
                        ) : (
                          <span className="text-slate-200">
                            You are clocked out. Work apps are locked for another <strong className="text-emerald-400 font-bold">{12} hours</strong>.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* App Stats Widget (Streaks + Saved) */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-2.5 text-center">
                        <div className="text-lg font-extrabold text-[#F97316] font-mono">{stats.streak}d</div>
                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Streak</span>
                      </div>
                      <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-2.5 text-center">
                        <div className="text-lg font-extrabold text-emerald-400 font-mono">{stats.eveningsReclaimed}</div>
                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Saved</span>
                      </div>
                      <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-2.5 text-center">
                        <div className="text-lg font-extrabold text-amber-500 font-mono">{stats.opensAvoided}</div>
                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Nudges</span>
                      </div>
                    </div>

                    {/* APP LAUNCHER MATRIX */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">WORK APPS LAUNCHER</span>
                        <span className="text-[9px] text-slate-500">Tap to simulate launch</span>
                      </div>

                      <div className="grid grid-cols-4 gap-3 bg-slate-900/20 border border-slate-800/50 p-3 rounded-2xl">
                        {apps.map(app => (
                          <button
                            key={app.id}
                            id={`launch-app-${app.id}`}
                            onClick={() => handleAppLaunch(app)}
                            className="flex flex-col items-center gap-1 group focus:outline-none transition-all hover:scale-105 active:scale-95"
                          >
                            <div className="relative">
                              {renderAppIcon(app.iconName, "w-11 h-11")}
                              {app.isSelected && (
                                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-950 flex items-center justify-center ${isWorkHours() ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                                  {isWorkHours() ? <Sun className="w-2 h-2 text-slate-950" /> : <Moon className="w-2 h-2 text-slate-950" />}
                                </div>
                              )}
                            </div>
                            <span className="text-[9px] font-medium text-slate-300 max-w-[55px] truncate">{app.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Auto Learning suggestion inside active dashboard */}
                    {suggestions.length > 0 && (
                      <div className="bg-[#F97316]/5 border border-[#F97316]/25 rounded-xl p-3 flex gap-2.5 items-start">
                        <Zap className="w-4 h-4 text-[#F97316] animate-pulse shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-200">UsageStats Auto-Detection</h4>
                          <p className="text-[9px] text-slate-400 mt-0.5">Heavy evening opens detected in <strong className="text-[#F97316] font-semibold">{suggestions[0].name}</strong> outside work hours. Suggest adding to boundaries.</p>
                          <div className="flex gap-2 mt-2">
                            <button 
                              id={`dashboard-accept-suggest-${suggestions[0].id}`}
                              onClick={() => handleAcceptSuggestion(suggestions[0])}
                              className="bg-[#F97316] hover:bg-[#F97316]/90 text-black px-2 py-0.5 rounded text-[8px] font-extrabold transition"
                            >
                              + Yes, Monitor
                            </button>
                            <button 
                              id={`dashboard-decline-suggest-${suggestions[0].id}`}
                              onClick={() => setSuggestions(suggestions.filter(s => s.id !== suggestions[0].id))}
                              className="text-slate-500 hover:text-slate-400 text-[8px] font-medium transition"
                            >
                              Ignore app
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Off hours reminder notification mock */}
                    {!isWorkHours() && (
                      <div className="bg-slate-900/40 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Bell className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Evening protective boundary is <strong>fully armed</strong>.</span>
                        </div>
                        <span className="text-[9px] text-slate-500">Off-hours</span>
                      </div>
                    )}

                  </div>
                )}

                {/* 2. LOGS FEED TAB */}
                {activeTab === 'logs' && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Device activity log</span>
                      <button 
                        id="clear-logs-btn"
                        onClick={() => setLogs([])}
                        className="text-[9px] text-slate-500 hover:text-slate-400"
                      >
                        Clear logs
                      </button>
                    </div>

                    {logs.length === 0 ? (
                      <div className="text-center py-12 text-slate-600 space-y-2">
                        <ActivityIcon className="w-8 h-8 mx-auto text-slate-700 animate-pulse" />
                        <p className="text-xs">No active logs detected.</p>
                        <p className="text-[10px] text-slate-500 max-w-[180px] mx-auto">Change system time and try launching Slack or Teams to see logs populate!</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[350px] overflow-y-auto">
                        {logs.map(log => (
                          <div key={log.id} className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-2 flex items-start gap-2.5">
                            <div className="mt-0.5">
                              {log.action === 'reclaimed' ? (
                                <div className="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 font-bold text-[8px]">✓</div>
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-400 font-bold text-[8px]">!</div>
                              )}
                            </div>
                            <div className="flex-1 text-[10px]">
                              <div className="flex justify-between font-bold text-slate-300">
                                <span>{log.appName}</span>
                                <span className="text-slate-500 font-normal font-mono">{log.mockTime}</span>
                              </div>
                              <p className="text-slate-400 mt-0.5">
                                {log.action === 'reclaimed' ? (
                                  <span className="text-emerald-400">Evening Reclaimed 🎉 Nudge successfully accepted!</span>
                                ) : (
                                  <span className="text-slate-400">Opened anyway. Session bypass logged.</span>
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. SETTINGS TAB */}
                {activeTab === 'settings' && (
                  <div className="space-y-4 animate-fadeIn text-xs">
                    
                    {/* Schedule block */}
                    <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-3">
                      <span className="text-[10px] text-[#F97316] uppercase tracking-wider font-bold block mb-2 font-display">Adjust Boundary Schedule</span>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">Start Workday:</span>
                          <span className="font-mono text-white font-semibold">{schedule.startHour}:00 AM</span>
                        </div>
                        <input 
                          id="settings-start-slider"
                          type="range" 
                          min="6" 
                          max="11" 
                          value={schedule.startHour}
                          onChange={(e) => setSchedule({ ...schedule, startHour: parseInt(e.target.value) })}
                          className="w-full accent-[#F97316]"
                        />

                        <div className="flex justify-between items-center text-[11px] mt-2">
                          <span className="text-slate-400">End Workday:</span>
                          <span className="font-mono text-white font-semibold">{schedule.endHour - 12}:00 PM</span>
                        </div>
                        <input 
                          id="settings-end-slider"
                          type="range" 
                          min="15" 
                          max="21" 
                          value={schedule.endHour}
                          onChange={(e) => setSchedule({ ...schedule, endHour: parseInt(e.target.value) })}
                          className="w-full accent-[#F97316]"
                        />
                      </div>
                    </div>

                    {/* Strict Mode Pro */}
                    <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-3 flex justify-between items-start">
                      <div className="max-w-[170px]">
                        <div className="flex items-center gap-1 font-bold text-slate-200">
                          Strict Mode
                          {!isPro && <Lock className="w-3 h-3 text-[#F97316]" />}
                        </div>
                        <p className="text-[9px] text-slate-400 mt-0.5">Disables "Open Anyway" bypass on after-hours nudges. No shortcuts.</p>
                      </div>
                      <button
                        id="strict-mode-toggle"
                        onClick={() => {
                          if (!isPro) {
                            alert("Strict Mode is a Clockout Pro Feature. Get premium to lock down boundaries completely!");
                          } else {
                            setStrictMode(!strictMode);
                          }
                        }}
                        className={`w-9 h-5 rounded-full p-0.5 transition-all ${strictMode && isPro ? 'bg-[#F97316]' : 'bg-slate-800'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${strictMode && isPro ? 'translate-x-4' : 'translate-x-0'}`}></div>
                      </button>
                    </div>

                    {/* Pro Toggle */}
                    <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-3 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-200">Pro Subscriptions</span>
                        <p className="text-[9px] text-slate-400">Current tier: {isPro ? 'Clockout Pro' : 'Free Basic'}</p>
                      </div>
                      <button 
                        id="pro-status-toggle"
                        onClick={() => setIsPro(!isPro)}
                        className={`px-2.5 py-1 rounded font-bold text-[9px] border transition ${isPro ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-[#F97316] border-[#F97316] text-black'}`}
                      >
                        {isPro ? 'Downgrade' : 'Unlock Pro'}
                      </button>
                    </div>

                    {/* On-device statistics resetting */}
                    <div className="space-y-2 mt-4 pt-2 border-t border-slate-900">
                      <button 
                        id="reset-simulator-btn"
                        onClick={handleResetSimulator}
                        className="w-full text-center text-[10px] text-red-400/80 hover:text-red-400 border border-red-500/20 py-1.5 rounded-lg hover:bg-red-500/5 transition"
                      >
                        Reset Simulator Data
                      </button>
                    </div>

                  </div>
                )}

              </div>

              {/* MOCK PHONE BOTTOM NAVIGATION TAB BAR */}
              <div className="h-14 bg-slate-950 border-t border-slate-900/80 flex justify-around items-center px-4 z-40 select-none">
                <button 
                  id="tab-dashboard"
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 ${activeTab === 'dashboard' ? 'text-[#F97316] font-bold' : 'text-slate-500'}`}
                >
                  <Clock className="w-4 h-4" />
                  <span className="text-[8px] uppercase tracking-wider scale-90 font-display">Focus</span>
                </button>
                <button 
                  id="tab-logs"
                  onClick={() => setActiveTab('logs')}
                  className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 ${activeTab === 'logs' ? 'text-[#F97316] font-bold' : 'text-slate-500'}`}
                >
                  <ActivityIcon className="w-4 h-4" />
                  <span className="text-[8px] uppercase tracking-wider scale-90 font-display">Logs</span>
                </button>
                <button 
                  id="tab-settings"
                  onClick={() => setActiveTab('settings')}
                  className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 ${activeTab === 'settings' ? 'text-[#F97316] font-bold' : 'text-slate-500'}`}
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-[8px] uppercase tracking-wider scale-90 font-display">Settings</span>
                </button>
              </div>

            </div>
          )}

          {/* C. NUDGE INTERACTION SCREEN OVERLAY */}
          {activeNudgeApp && (
            <div className="absolute inset-0 bg-slate-950/98 z-50 flex flex-col justify-between p-6 text-slate-100 animate-fadeIn">
              <div className="flex flex-col items-center text-center mt-8">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-4 animate-pulse">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="text-xs font-mono text-[#F97316] uppercase tracking-widest font-bold font-display">Boundary Enforced</div>
                <h3 className="text-xl font-bold text-white mt-1.5 font-display">It's {formatTime(simHour, simMinute)}</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
                  Work is done for today. Are you sure you want to open <strong className="text-white">{activeNudgeApp.name}</strong>?
                </p>

                {/* The 3-second breathing nudge friction animation */}
                <div className="my-8 flex flex-col items-center justify-center h-28">
                  {nudgeState === 'countdown' ? (
                    <div className="relative flex items-center justify-center">
                      <div className={`absolute rounded-full border-2 border-[#F97316]/20 bg-[#F97316]/5 transition-all duration-1500 ${breathPulse ? 'w-24 h-24 scale-110' : 'w-20 h-20 scale-95'}`}></div>
                      <div className={`absolute rounded-full border border-emerald-500/20 bg-emerald-500/5 transition-all duration-1500 ${breathPulse ? 'w-16 h-16 scale-90' : 'w-20 h-20 scale-105'}`}></div>
                      
                      <div className="w-12 h-12 rounded-full bg-slate-900 border border-[#F97316]/30 flex items-center justify-center z-10">
                        <span className="text-base font-bold font-mono text-[#F97316]">{nudgeCountdown}</span>
                      </div>
                    </div>
                  ) : nudgeState === 'reclaimed' ? (
                    <div className="flex flex-col items-center animate-bounce">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                        <Check className="w-8 h-8" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-full bg-[#F97316]/10 flex items-center justify-center text-[#F97316] border border-[#F97316]/20 animate-pulse">
                        <Heart className="w-8 h-8 text-[#F97316] fill-[#F97316]" />
                      </div>
                    </div>
                  )}

                  <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-4 font-display">
                    {nudgeState === 'countdown' ? (
                      breathPulse ? 'Inhale deeply...' : 'Exhale slowly...'
                    ) : nudgeState === 'reclaimed' ? (
                      'Evening Saved! Reclaiming...'
                    ) : (
                      'Ready to disconnect?'
                    )}
                  </span>
                </div>
              </div>

              {/* Action Choices */}
              <div className="space-y-3 mb-6">
                {nudgeState === 'countdown' ? (
                  <div className="text-center py-4 text-[10px] text-slate-500 font-mono italic">
                    Calming breathing exercise active to reduce impulsivity...
                  </div>
                ) : (
                  <>
                    <button 
                      id="nudge-reclaim-btn"
                      onClick={handleNudgeReclaim}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl transition text-xs flex items-center justify-center gap-1 shadow-lg shadow-emerald-600/10 uppercase tracking-wider"
                    >
                      <Heart className="w-4 h-4 fill-white" />
                      Close & Reclaim My Evening
                    </button>

                    {strictMode && isPro ? (
                      <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl flex items-center gap-2 text-[10px] text-amber-500">
                        <Lock className="w-4 h-4 shrink-0" />
                        <span><strong>Strict Mode is Active:</strong> Access completely blocked until workday starts at {schedule.startHour}:00 AM. No exceptions.</span>
                      </div>
                    ) : (
                      <button 
                        id="nudge-bypass-btn"
                        onClick={handleNudgeBypass}
                        className="w-full text-slate-500 hover:text-slate-300 font-medium py-1 text-[10px] text-center transition block"
                      >
                        Open anyway (log session bypass)
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* D. SIMULATED LAUNCHED APP CONTENT SCREEN */}
          {simulatedWorkScreen && (
            <div className="absolute inset-0 bg-slate-900 z-50 flex flex-col justify-between text-slate-100 animate-fadeIn">
              
              {/* App Mock Top Bar */}
              <div className="bg-slate-950 p-3 border-b border-slate-800 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="font-bold">{simulatedWorkScreen} (Simulated)</span>
                </div>
                <button 
                  id="exit-simulated-app"
                  onClick={() => setSimulatedWorkScreen(null)}
                  className="bg-slate-800 hover:bg-slate-700 p-1 rounded-md text-[10px]"
                >
                  Back to Clockout
                </button>
              </div>

              {/* App Content Body */}
              <div className="flex-1 p-4 overflow-y-auto bg-slate-950 text-slate-300 space-y-4">
                
                {/* Specific look-and-feel of simulated slack/teams */}
                {simulatedWorkScreen === 'Slack' || simulatedWorkScreen === 'MS Teams' ? (
                  <div className="space-y-3">
                    <div className="flex gap-2 text-[10px] text-slate-500 border-b border-slate-900 pb-2">
                      <span className="font-bold text-teal-400"># general-chat</span>
                      <span>• Today</span>
                    </div>

                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded bg-indigo-500 flex items-center justify-center font-bold text-xs">PM</div>
                      <div className="text-[10px]">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-200">Product Manager</span>
                          <span className="text-[9px] text-slate-500">9:41 PM</span>
                        </div>
                        <p className="text-slate-300 mt-0.5">"Hey everyone, quick heads up. We got some feedback on the dashboard. Could we possibly push a quick hotfix tonight? Just need to look at the ticket in Jira."</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded bg-teal-600 flex items-center justify-center font-bold text-xs">QA</div>
                      <div className="text-[10px]">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-200">QA Lead</span>
                          <span className="text-[9px] text-slate-500">9:45 PM</span>
                        </div>
                        <p className="text-slate-300 mt-0.5">"Checking it now. Looks like the api endpoint is timing out on dev servers."</p>
                      </div>
                    </div>

                    <div className="p-2.5 bg-red-500/5 border border-red-500/10 rounded-xl text-[10px] text-slate-400 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span>
                        <strong>Impulse Checking Habit:</strong> Reading this message creates anxiety and forces you back into your workspace. Clockout's boundary would have prevented this stress loop.
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Standard app presentation */
                  <div className="space-y-3 text-center py-10">
                    <div className="w-12 h-12 bg-indigo-600/10 rounded-full flex items-center justify-center mx-auto text-indigo-400 border border-indigo-500/20">
                      <BriefcaseIcon className="w-6 h-6" />
                    </div>
                    <h4 className="text-xs font-bold text-white">{simulatedWorkScreen} workspace loaded</h4>
                    <p className="text-[10px] text-slate-500 max-w-[180px] mx-auto">This represents the active workspace where your emails, tasks, and notifications reside.</p>
                  </div>
                )}

              </div>

              {/* Bottom nudge banner urging to return */}
              <div className="bg-indigo-950/80 border-t border-indigo-500/20 p-3 text-center text-[10px] text-slate-300 flex items-center justify-between">
                <span>Clockout boundary is armed.</span>
                <button 
                  id="return-to-boundary-btn"
                  onClick={() => setSimulatedWorkScreen(null)}
                  className="bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 rounded font-bold text-white transition text-[9px]"
                >
                  Return to Downtime
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Home indicator bar at the very bottom of the phone */}
        <div className="bg-slate-950 h-5 pb-1.5 flex items-center justify-center z-40 select-none">
          <div className="w-24 h-1 bg-slate-800 rounded-full hover:bg-slate-700 cursor-pointer"></div>
        </div>

      </div>
    </div>
  );
}

// Minimal placeholder icons to ensure no typescript issues with missing icon exports in Lucide
function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function BriefcaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H9a2 2 0 0 0-2 2v2H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4V4a2 2 0 0 0-2-2z" />
      <rect width="20" height="14" x="2" y="6" rx="2" />
      <path d="M12 11h.01" />
    </svg>
  );
}
