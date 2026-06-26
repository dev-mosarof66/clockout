import React, { useState } from 'react';
import {
  ArrowRight, Moon, Check, TrendingUp, Layers, Zap, Sparkles, Lock,
  Calendar, Flame, ShieldCheck, Users, ChevronDown,
} from 'lucide-react';
import FakeDoorModal from './FakeDoorModal';
import { submitWaitlist, track } from '../lib/analytics';
import { config, isConfigured } from '../lib/config';

interface LandingPageProps {
  /** Real signups recorded this session (added on top of the honest base count). */
  signupCount: number;
  onSignup: () => void;
}

const FAQ = [
  {
    q: 'Is this just another screen-time app?',
    a: 'No — Clockout only cares about your work apps after your work hours. It’s a work/life boundary app, not a digital-detox or parental-control app.',
  },
  {
    q: 'Android or iOS?',
    a: 'Android first (launching in weeks). iOS is on the roadmap — drop your email to vote for it.',
  },
  {
    q: 'Will it drain my battery or spy on me?',
    a: 'Everything runs on-device. Your usage data never touches our servers.',
  },
  {
    q: 'When can I get it?',
    a: 'Early access in a few weeks. Founders get it first, plus a locked-in price.',
  },
];

export default function LandingPage({ signupCount, onSignup }: LandingPageProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Software Engineer');
  const [submitted, setSubmitted] = useState(false);
  const [localOnly, setLocalOnly] = useState(false);
  const [error, setError] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTier, setModalTier] = useState<'monthly' | 'yearly'>('yearly');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const liveCount = config.waitlistBase + signupCount;

  const handleFreeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(false);
    const res = await submitWaitlist({ email, name, role, intent: 'free' });
    if (res.ok) {
      setLocalOnly(res.localOnly);
      setSubmitted(true);
      onSignup();
      setEmail('');
      setName('');
    } else {
      setError(true);
    }
  };

  // The fake-door: opening it IS the willingness-to-pay measurement (Phase 0 §1).
  const openFakeDoor = (tier: 'monthly' | 'yearly') => {
    track('pro_click', { tier });
    setModalTier(tier);
    setModalOpen(true);
  };

  return (
    <div className="space-y-14">
      {/* ── HERO (§2.1) ─────────────────────────────────────────────── */}
      <div className="space-y-5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4ADE80]/10 border border-[#4ADE80]/20 text-[#4ADE80] text-xs font-semibold uppercase tracking-wider">
          <Moon className="w-3.5 h-3.5" />
          Early access · Android first
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-[#FAFAFA] tracking-tight leading-[1.05] font-display">
          Your workday should end.<br />
          <span className="text-[#F97316]">Your phone disagrees.</span>
        </h1>
        <p className="text-lg font-medium text-neutral-300 max-w-2xl leading-relaxed">
          Clockout automatically detects when you&rsquo;re still in Slack at 9pm — and gently logs you out of
          work so you can actually have an evening. Built for remote professionals who can&rsquo;t stop checking.
        </p>
      </div>

      {/* ── PRIMARY EMAIL CAPTURE + honest social proof ─────────────── */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-5 shadow-xl">
        {submitted ? (
          <div className="bg-[#4ADE80]/10 border border-[#4ADE80]/20 rounded-2xl p-6 text-center space-y-3 animate-fadeIn">
            <div className="w-10 h-10 rounded-full bg-[#4ADE80]/10 border border-[#4ADE80]/20 flex items-center justify-center text-[#4ADE80] mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-[#FAFAFA] font-display">You&rsquo;re on the list.</h4>
            <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
              We&rsquo;ll send one email when Clockout launches. Want it the moment it ships, at the founder price?
            </p>
            <button
              id="hero-upgrade-to-pro"
              onClick={() => openFakeDoor('yearly')}
              className="text-[#F97316] hover:text-[#F97316]/85 text-xs font-bold inline-flex items-center gap-1 mt-1"
            >
              Lock in the $4.99/mo founder price <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {localOnly && (
              <p className="text-[10px] text-amber-400/80 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2 max-w-sm mx-auto">
                Dev note: no capture endpoint configured — recorded locally only. Set{' '}
                <code className="font-mono">VITE_WAITLIST_ENDPOINT</code> to collect real signups.
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleFreeSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">Name (optional)</label>
                <input
                  id="hero-name"
                  type="text"
                  placeholder="Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-[#FAFAFA] placeholder-neutral-600 focus:outline-none focus:border-[#F97316] transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">Work email</label>
                <input
                  id="hero-email"
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-[#FAFAFA] placeholder-neutral-600 focus:outline-none focus:border-[#F97316] transition"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">What do you do? (helps us build the right thing)</label>
              <select
                id="hero-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F97316] transition"
              >
                <option>Software Engineer</option>
                <option>Product Designer</option>
                <option>Growth / Marketing</option>
                <option>Founder / CEO</option>
                <option>Freelancer / Consultant</option>
                <option>Other knowledge work</option>
              </select>
            </div>

            <button
              id="hero-submit-btn"
              type="submit"
              className="w-full bg-[#F97316] hover:bg-[#F97316]/90 text-black font-extrabold py-3.5 px-4 rounded-xl transition text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-[#F97316]/15 uppercase tracking-wider"
            >
              Get early access
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
            {error && (
              <p className="text-[10px] text-red-400 text-center">Something went wrong — please try again.</p>
            )}
            <p className="text-[11px] text-neutral-500 text-center flex items-center justify-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#F97316]" />
              Join <strong className="text-neutral-300">{liveCount}</strong> remote {liveCount === 1 ? 'worker' : 'workers'} reclaiming their evenings.
              <span className="text-neutral-600">No spam — one email at launch.</span>
            </p>
          </form>
        )}
      </div>

      {/* ── PROBLEM (§2.2) — cited research figures ─────────────────── */}
      <div className="space-y-4">
        <h2 className="text-2xl font-extrabold text-[#FAFAFA] tracking-tight font-display">
          You &ldquo;logged off&rdquo; hours ago. So why are you still working?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard value="+16%" label="Meetings after 8 PM" note="YoY increase in off-hours coordination (Microsoft Work Trend Index)." />
          <StatCard value="29%" label="Back in the inbox by 10 PM" note="Workers pulled into the after-hours correspondence loop (M365 telemetry)." />
          <StatCard value="57%" label="Fewer app opens" note="From a simple 3–5 second friction pause before access (PNAS 2023)." />
        </div>
        <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
          Screen Time and Digital Wellbeing weren&rsquo;t built for this. They make <em>you</em> do the work of
          setting up blockers. You won&rsquo;t. (Nobody does.)
        </p>
      </div>

      {/* ── SOLUTION (§2.3) ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-2xl font-extrabold text-[#FAFAFA] tracking-tight font-display">
          It clocks you out, so you don&rsquo;t have to think about it.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Step n="1" title="It learns your work apps" body="Slack, Teams, Gmail, Jira — Clockout knows which apps are work. You confirm in 10 seconds." />
          <Step n="2" title="It knows when you're off" body="Set your hours once. Clockout watches for work apps opening after hours." />
          <Step n="3" title="It gently stops you" body="Open Slack at 9:40pm and Clockout pauses you with a breath and a question: &ldquo;Work&rsquo;s done. Sure?&rdquo;" />
        </div>
        <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
          <strong className="text-neutral-200">No willpower required. No blocklists to babysit.</strong> Your data never leaves your phone.
        </p>
      </div>

      {/* ── DIFFERENTIATION (§2.4) ──────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-lg font-extrabold text-[#FAFAFA] uppercase tracking-wider flex items-center gap-1.5 font-display">
          <Layers className="w-5 h-5 text-[#F97316]" />
          Why not just use Screen Time?
        </h3>
        <div className="overflow-x-auto border border-neutral-800 rounded-3xl bg-neutral-900/40">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-950 border-b border-neutral-800 text-neutral-300 font-bold uppercase tracking-wider">
                <th className="p-4 font-display"> </th>
                <th className="p-4 font-display">Screen Time / Digital Wellbeing</th>
                <th className="p-4 font-display">Generic blockers</th>
                <th className="p-4 text-[#F97316] bg-[#F97316]/5 font-display">Clockout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-400">
              {[
                ['Knows which apps are work', false, false, true],
                ['Auto-detects "you’re still working"', false, false, true],
                ['Gentle nudge, not blunt block', false, false, true],
                ['Built for work/life boundaries', false, false, true],
                ['Data stays on your device', true, null, true],
              ].map(([label, a, b, c], i) => (
                <tr key={i}>
                  <td className="p-4 font-bold text-neutral-200">{label as string}</td>
                  <Cell v={a as boolean | null} />
                  <Cell v={b as boolean | null} />
                  <td className="p-4 bg-[#F97316]/5 text-center">{c ? <Check className="w-4 h-4 text-[#4ADE80] inline" /> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PRICING + FAKE-DOOR (§2.5) — the critical test ──────────── */}
      <div className="space-y-4">
        <h3 className="text-lg font-extrabold text-[#FAFAFA] uppercase tracking-wider flex items-center gap-1.5 font-display">
          <Sparkles className="w-5 h-5 text-[#F97316]" />
          Pricing
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Free */}
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-6 space-y-4 flex flex-col">
            <div>
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-display">Free</span>
              <div className="text-3xl font-black text-[#FAFAFA] font-display mt-1">$0</div>
            </div>
            <ul className="space-y-2 text-xs text-neutral-400 flex-1">
              <li className="flex gap-2"><Check className="w-4 h-4 text-[#4ADE80] shrink-0" /> Clock out of up to 3 work apps</li>
              <li className="flex gap-2"><Check className="w-4 h-4 text-[#4ADE80] shrink-0" /> Basic evening stats</li>
            </ul>
            <button
              id="pricing-free-btn"
              onClick={() => document.getElementById('hero-email')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-[#FAFAFA] font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition"
            >
              Join early access
            </button>
          </div>

          {/* Pro — the fake-door */}
          <div className="bg-[#F97316]/5 border border-[#F97316]/30 rounded-3xl p-6 space-y-4 flex flex-col relative shadow-lg shadow-[#F97316]/5">
            <span className="absolute -top-2.5 right-5 bg-[#F97316] text-black text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
              Founders: $4.99/mo for life
            </span>
            <div>
              <span className="text-xs font-bold text-[#F97316] uppercase tracking-wider font-display flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-[#F97316]" /> Clockout Pro
              </span>
              <div className="text-3xl font-black text-[#FAFAFA] font-display mt-1">
                $6.99<span className="text-sm font-bold text-neutral-500">/mo</span>
                <span className="text-xs font-semibold text-neutral-500 ml-2">or $49.99/yr</span>
              </div>
            </div>
            <ul className="space-y-2 text-xs text-neutral-300 flex-1">
              <li className="flex gap-2"><Lock className="w-4 h-4 text-[#F97316] shrink-0" /> Unlimited work apps · Strict Mode</li>
              <li className="flex gap-2"><Calendar className="w-4 h-4 text-[#F97316] shrink-0" /> Auto-learn your hours · multi-schedule</li>
              <li className="flex gap-2"><Flame className="w-4 h-4 text-[#F97316] shrink-0" /> Weekly &ldquo;evenings reclaimed&rdquo; report · wind-down routines</li>
            </ul>
            <button
              id="pricing-pro-btn"
              onClick={() => openFakeDoor('yearly')}
              className="w-full bg-[#F97316] hover:bg-[#F97316]/90 text-black font-extrabold py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
            >
              Get Pro early-bird <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
            <p className="text-[10px] text-neutral-500 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4ADE80]" />
              {isConfigured.prepay ? 'Reserve free, or pre-pay (refundable, charged at launch).' : 'Reserve your founder spot — nothing charged today.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── FAQ (§2.6) ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-lg font-extrabold text-[#FAFAFA] uppercase tracking-wider flex items-center gap-1.5 font-display">
          <TrendingUp className="w-5 h-5 text-[#F97316]" />
          Questions
        </h3>
        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <div key={i} className="bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden">
              <button
                id={`faq-${i}`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-xs font-bold text-neutral-200">{item.q}</span>
                <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <p className="px-4 pb-4 text-xs text-neutral-400 leading-relaxed -mt-1">{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── FINAL CTA (§2.7) ────────────────────────────────────────── */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 text-center space-y-4">
        <h3 className="text-2xl font-black text-[#FAFAFA] font-display">Take your evenings back.</h3>
        <button
          id="final-cta-btn"
          onClick={() => document.getElementById('hero-email')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          className="bg-[#F97316] hover:bg-[#F97316]/90 text-black font-extrabold py-3 px-6 rounded-xl text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition"
        >
          Get early access <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
        <p className="text-[11px] text-neutral-500">No spam. One email when Clockout launches.</p>
      </div>

      <FakeDoorModal
        open={modalOpen}
        tier={modalTier}
        onClose={() => setModalOpen(false)}
        onReserved={onSignup}
      />
    </div>
  );
}

// ── small presentational helpers ──────────────────────────────────────────────

function StatCard({ value, label, note }: { value: string; label: string; note: string }) {
  return (
    <div className="bg-neutral-900/50 border border-neutral-800 p-5 rounded-3xl space-y-1">
      <span className="text-3xl font-black text-[#FAFAFA] font-display">{value}</span>
      <p className="text-[11px] font-bold text-neutral-200 mt-1 uppercase tracking-wider">{label}</p>
      <p className="text-[10px] text-neutral-400 mt-0.5 leading-relaxed">{note}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-3xl space-y-2">
      <div className="w-7 h-7 rounded-full bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] flex items-center justify-center font-bold font-mono text-xs">{n}</div>
      <h4 className="text-sm font-bold text-[#FAFAFA] font-display">{title}</h4>
      <p className="text-[11px] text-neutral-400 leading-relaxed">{body}</p>
    </div>
  );
}

function Cell({ v }: { v: boolean | null }) {
  return (
    <td className="p-4 text-center">
      {v === true ? <Check className="w-4 h-4 text-[#4ADE80] inline" /> : v === null ? <span className="text-amber-500/70">⚠</span> : <span className="text-neutral-600">—</span>}
    </td>
  );
}
