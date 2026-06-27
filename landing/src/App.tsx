import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import PhoneSimulator from './components/PhoneSimulator';
import { SimulatorStats, AppLog } from './types';
import { Smartphone, Layers } from 'lucide-react';
import Logo from './components/Logo';
import { initAnalytics } from './lib/analytics';
import { config, isConfigured } from './lib/config';

export default function App() {
  // Count of REAL signups captured this session. Persisted as a number (not
  // fabricated people) so the honest "Join N" counter survives a refresh.
  const [signupCount, setSignupCount] = useState<number>(() => {
    return Number(localStorage.getItem('clockout_session_signups') ?? 0) || 0;
  });

  // Simulator demo state (sandbox only — never counted as validation).
  const [simulatorStats, setSimulatorStats] = useState<SimulatorStats>({
    eveningsReclaimed: 5,
    opensAvoided: 12,
    streak: 6,
    totalNudges: 18,
  });
  const [appLogs, setAppLogs] = useState<AppLog[]>([]);
  const [mobileTab, setMobileTab] = useState<'discover' | 'simulator'>('discover');

  useEffect(() => {
    initAnalytics();
  }, []);

  const handleSignup = () => {
    setSignupCount((prev) => {
      const next = prev + 1;
      localStorage.setItem('clockout_session_signups', String(next));
      return next;
    });
  };

  // Bring the demo into view on any viewport (mobile: switch tab first).
  const handleTryDemo = () => {
    setMobileTab('simulator');
    requestAnimationFrame(() => {
      document
        .getElementById('phone-simulator-section')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA] font-sans flex flex-col antialiased">
      {/* GLOBAL NAVBAR */}
      <header className="bg-[#0A0A0A]/80 backdrop-blur-md border-b border-neutral-800 sticky top-0 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={40} className="shrink-0" />
            <div>
              <span className="font-extrabold tracking-tight text-[#FAFAFA] text-lg font-display">Clockout</span>
              <span className="text-[9px] bg-neutral-900 text-neutral-400 font-bold ml-1.5 px-2 py-0.5 rounded border border-neutral-800 uppercase tracking-widest">
                Phase 0 · Validation
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="hidden sm:flex items-center gap-4 text-[11px] text-neutral-400 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F97316]"></span>
                <span>Early access: <strong className="text-[#FAFAFA]">{config.waitlistBase + signupCount}</strong></span>
              </div>
            </div>

            <button
              onClick={handleTryDemo}
              className="bg-[#F97316] hover:bg-[#F97316]/90 text-black font-extrabold px-3.5 py-1.5 rounded-xl text-xs transition-all tracking-wider uppercase hidden md:block"
            >
              Try the demo
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE SWITCHER BAR */}
      <div className="md:hidden bg-neutral-950 border-b border-neutral-800 p-2 sticky top-[53px] z-40 flex">
        <button
          onClick={() => setMobileTab('discover')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${mobileTab === 'discover' ? 'bg-neutral-900 text-[#FAFAFA] border border-neutral-800' : 'text-neutral-500'}`}
        >
          <Layers className="w-4 h-4" />
          The Pitch
        </button>
        <button
          onClick={() => setMobileTab('simulator')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${mobileTab === 'simulator' ? 'bg-neutral-900 text-[#FAFAFA] border border-neutral-800' : 'text-neutral-500'}`}
        >
          <Smartphone className="w-4 h-4" />
          Try the demo
        </button>
      </div>

      {/* WORKSPACE AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* LEFT COLUMN: LANDING PAGE */}
        <div className={`flex-1 space-y-8 ${mobileTab === 'discover' ? 'block' : 'hidden md:block'} md:w-3/5 lg:w-4/7`}>
          <LandingPage signupCount={signupCount} onSignup={handleSignup} />
        </div>

        {/* RIGHT COLUMN: SIMULATOR PANEL (interactive demo) */}
        <div id="phone-simulator-section" className={`md:w-2/5 lg:w-3/7 flex flex-col items-center sticky top-20 self-start ${mobileTab === 'simulator' ? 'block' : 'hidden md:block'} py-4 md:py-0 w-full`}>
          <div className="w-full max-w-sm mb-4 bg-neutral-900/50 border border-neutral-800 rounded-3xl p-5 text-xs">
            <h4 className="font-bold text-[#FAFAFA] font-display flex items-center gap-1.5 uppercase tracking-widest text-[10px]">
              <Smartphone className="w-4 h-4 text-[#F97316]" />
              Live interactive demo
            </h4>
            <p className="text-neutral-400 mt-2 leading-relaxed">
              See how Clockout works. Slide the system time, pick your work apps in onboarding, then{' '}
              <strong>tap a work app</strong> like Slack outside work hours (e.g. 9:45 PM) to feel the breathing nudge.
              This is a sandbox — nothing here is a real signup.
            </p>
          </div>

          <PhoneSimulator
            onStatsChange={setSimulatorStats}
            onLogAdded={(log) => setAppLogs((prev) => [log, ...prev])}
          />
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-neutral-950 border-t border-neutral-800/80 text-neutral-500 py-10 px-4 text-xs mt-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Logo size={28} className="shrink-0" />
            <span className="font-bold text-neutral-300 font-display">Clockout.</span>
          </div>
          <p className="text-neutral-500 text-center md:text-left">
            Validating willingness-to-pay before we build. The phone on the right is an interactive demo, not the shipping app.
          </p>
          <div className="flex gap-4">
            <span>Privacy first</span>
            <span>•</span>
            <span>On-device processing</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
