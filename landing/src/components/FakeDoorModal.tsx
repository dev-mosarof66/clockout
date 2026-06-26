import React, { useState } from 'react';
import { X, Zap, Check, CreditCard, Mail, ShieldCheck, Loader2 } from 'lucide-react';
import { config, isConfigured } from '../lib/config';
import { submitWaitlist, track } from '../lib/analytics';

interface FakeDoorModalProps {
  open: boolean;
  tier: 'monthly' | 'yearly';
  onClose: () => void;
  onReserved: () => void;
}

// The fake-door: clicking "Get Pro early-bird" opens this. It does NOT charge or
// unlock anything — it captures the willingness-to-pay signal (Phase 0 §2.5).
//   • Reserve  → email capture, intent:'pro'  (strong signal)
//   • Pre-pay  → Stripe Payment Link, refundable, charged at launch (strongest)
export default function FakeDoorModal({ open, tier, onClose, onReserved }: FakeDoorModalProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [localOnly, setLocalOnly] = useState(false);

  if (!open) return null;

  const priceLabel = tier === 'yearly' ? '$49.99/yr' : '$6.99/mo';

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('submitting');
    const res = await submitWaitlist({ email, tier, intent: 'pro' });
    if (res.ok) {
      setLocalOnly(res.localOnly);
      setStatus('done');
      onReserved();
    } else {
      setStatus('error');
    }
  };

  const handlePrepay = () => {
    track('prepay_click', { tier });
    window.open(config.stripePaymentLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl p-6 space-y-5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="fakedoor-close"
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-300 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {status === 'done' ? (
          <div className="text-center space-y-3 py-4">
            <div className="w-12 h-12 rounded-full bg-[#4ADE80]/10 border border-[#4ADE80]/20 flex items-center justify-center text-[#4ADE80] mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#FAFAFA] font-display">You're on the founders list. 🎉</h3>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
              We'll email <strong className="text-neutral-200">{email}</strong> a founder link at launch with the
              locked-in <strong className="text-[#F97316]">$4.99/mo</strong> price.
            </p>
            {localOnly && (
              <p className="text-[10px] text-amber-400/80 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2 max-w-xs mx-auto">
                Dev note: no capture endpoint configured — this signup was logged locally only.
                Set <code className="font-mono">VITE_WAITLIST_ENDPOINT</code> to record real signups.
              </p>
            )}
            <button
              id="fakedoor-done-close"
              onClick={onClose}
              className="text-[#F97316] hover:text-[#F97316]/85 text-xs font-semibold mt-2"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F97316]/10 text-[#F97316] text-[10px] font-bold border border-[#F97316]/20 uppercase tracking-wider">
                <Zap className="w-3 h-3 fill-[#F97316]" />
                Founder early-bird
              </div>
              <h3 className="text-lg font-bold text-[#FAFAFA] font-display">You're in. (Almost.)</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Clockout Pro ({priceLabel}) launches in a few weeks. Lock in the founder price of{' '}
                <strong className="text-[#F97316]">$4.99/mo for life</strong>.
              </p>
            </div>

            {/* Option A — Reserve (email) */}
            <form onSubmit={handleReserve} className="space-y-2">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#F97316]" /> Reserve my founder spot
              </label>
              <div className="flex gap-2">
                <input
                  id="fakedoor-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-[#FAFAFA] placeholder-neutral-600 focus:outline-none focus:border-[#F97316] transition"
                />
                <button
                  id="fakedoor-reserve-btn"
                  type="submit"
                  disabled={status === 'submitting'}
                  className="bg-[#F97316] hover:bg-[#F97316]/90 disabled:opacity-60 text-black font-extrabold px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition"
                >
                  {status === 'submitting' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reserve'}
                </button>
              </div>
              {status === 'error' && (
                <p className="text-[10px] text-red-400">Something went wrong — please try again.</p>
              )}
            </form>

            {/* Option B — Pre-pay (Stripe), strongest signal. Only if configured. */}
            {isConfigured.prepay && (
              <>
                <div className="flex items-center gap-3 text-[10px] text-neutral-600 uppercase tracking-widest">
                  <div className="flex-1 h-px bg-neutral-800" /> or skip the line <div className="flex-1 h-px bg-neutral-800" />
                </div>
                <button
                  id="fakedoor-prepay-btn"
                  onClick={handlePrepay}
                  className="w-full bg-neutral-950 hover:bg-neutral-800/60 border border-[#F97316]/30 text-[#FAFAFA] font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition"
                >
                  <CreditCard className="w-4 h-4 text-[#F97316]" />
                  Pre-pay $4.99 &amp; skip the line
                </button>
                <p className="text-[10px] text-neutral-500 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#4ADE80]" />
                  Fully refundable · charged only at launch
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
