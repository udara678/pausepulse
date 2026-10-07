import React, { useState } from 'react';
import { CheckCircle2, Heart } from 'lucide-react';
import { AppTheme } from '../../types';

interface GratitudeNoteProps {
  onComplete: (id: string) => void;
  theme: AppTheme;
}

export const GratitudeNote: React.FC<GratitudeNoteProps> = ({ onComplete }) => {
  const [thing1, setThing1] = useState('');
  const [thing2, setThing2] = useState('');
  const [thing3, setThing3] = useState('');
  const [claimed, setClaimed] = useState(false);

  const isValid1 = thing1.trim().length >= 5;
  const isValid2 = thing2.trim().length >= 5;
  const isValid3 = thing3.trim().length >= 5;
  const allValid = isValid1 && isValid2 && isValid3;

  const handleClaim = () => {
    if (!allValid || claimed) return;
    setClaimed(true);
    onComplete('gratitude-note');
  };

  return (
    <div className="p-6 max-w-md mx-auto text-center space-y-5">
      <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/15 border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--accent)]">
        <Heart className="w-6 h-6 fill-current" />
      </div>

      <div>
        <h2 className="text-base font-black tracking-tight text-[var(--text)]">Three Good Things 🌱</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Take 2 minutes to write down three positive moments or people from today.
        </p>
      </div>

      <div className="space-y-3 text-left">
        <div>
          <label className="text-xs font-semibold text-[var(--text)] block mb-1 flex items-center justify-between">
            <span>1. Something that went well today</span>
            {isValid1 && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />}
          </label>
          <input
            type="text"
            value={thing1}
            onChange={(e) => setThing1(e.target.value)}
            placeholder="e.g. Cleared my inbox, solved that tricky bug..."
            className="w-full px-3 py-2 rounded-xl border border-[var(--border)] glass-pill text-xs text-[var(--text)] placeholder-[var(--text-muted)]/60 outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[var(--text)] block mb-1 flex items-center justify-between">
            <span>2. A person who made your day easier</span>
            {isValid2 && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />}
          </label>
          <input
            type="text"
            value={thing2}
            onChange={(e) => setThing2(e.target.value)}
            placeholder="e.g. Sarah for the quick PR review..."
            className="w-full px-3 py-2 rounded-xl border border-[var(--border)] glass-pill text-xs text-[var(--text)] placeholder-[var(--text-muted)]/60 outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[var(--text)] block mb-1 flex items-center justify-between">
            <span>3. Something small you're grateful for</span>
            {isValid3 && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />}
          </label>
          <input
            type="text"
            value={thing3}
            onChange={(e) => setThing3(e.target.value)}
            placeholder="e.g. Good cup of coffee, quiet morning..."
            className="w-full px-3 py-2 rounded-xl border border-[var(--border)] glass-pill text-xs text-[var(--text)] placeholder-[var(--text-muted)]/60 outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      <button
        type="button"
        disabled={!allValid || claimed}
        onClick={handleClaim}
        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
          claimed
            ? 'glass-pill text-[var(--success)] border border-[var(--success)]/40 cursor-not-allowed'
            : allValid
            ? 'bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] shadow-purple-500/25 cursor-pointer active:scale-95'
            : 'glass-pill text-[var(--text-muted)] opacity-50 cursor-not-allowed'
        }`}
      >
        {claimed ? 'Claimed ✓' : 'Claim +30 pts'}
      </button>
    </div>
  );
};
