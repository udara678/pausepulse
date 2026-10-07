import React, { useState, useEffect } from 'react';
import { Wind, CheckCircle2, Play, Pause } from 'lucide-react';
import { AppTheme } from '../../types';

interface LongExhaleBreatheProps {
  onComplete: (id: string) => void;
  theme: AppTheme;
}

export const LongExhaleBreathe: React.FC<LongExhaleBreatheProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'INHALE' | 'EXHALE'>('INHALE');
  const [seconds, setSeconds] = useState(4);
  const [cycles, setCycles] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [claimed, setClaimed] = useState(false);

  const TOTAL_CYCLES = 4;

  useEffect(() => {
    if (!isRunning || cycles >= TOTAL_CYCLES) return;

    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev > 1) return prev - 1;

        if (phase === 'INHALE') {
          setPhase('EXHALE');
          return 6;
        } else {
          setPhase('INHALE');
          setCycles((c) => c + 1);
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, phase, cycles]);

  const handleClaim = () => {
    if (claimed) return;
    setClaimed(true);
    onComplete('long-exhale-breathing');
  };

  const isDone = cycles >= TOTAL_CYCLES;

  if (isDone) {
    return (
      <div className="p-6 max-w-sm mx-auto text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-base font-black text-[var(--text)]">Tension Released 🍃</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            4 cycles completed. Your nervous system is now calm and centered.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClaim}
          disabled={claimed}
          className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
            claimed
              ? 'glass-pill text-[var(--success)] border border-[var(--success)]/40 cursor-not-allowed'
              : 'bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] shadow-purple-500/25 cursor-pointer active:scale-95'
          }`}
        >
          {claimed ? 'Claimed ✓' : 'Claim +30 pts'}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-sm mx-auto text-center space-y-5">
      <div>
        <h2 className="text-base font-black text-[var(--text)]">Long-Exhale Breathing 🌬️</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          4s Inhale ➔ 6s Exhale (Extended exhale activates the vagus brake)
        </p>
      </div>

      {/* Cycle indicator pills */}
      <div className="flex justify-center gap-1.5">
        {Array.from({ length: TOTAL_CYCLES }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === cycles
                ? 'w-6 bg-[var(--accent)]'
                : i < cycles
                ? 'w-3 bg-[var(--success)]'
                : 'w-3 bg-[var(--border)]'
            }`}
          />
        ))}
      </div>

      {/* Breathing Animated Circle */}
      <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
        <div
          className={`absolute inset-0 rounded-full border-4 transition-all ${
            phase === 'INHALE'
              ? 'scale-115 bg-cyan-500/20 border-cyan-400 shadow-xl shadow-cyan-500/30 duration-[4000ms]'
              : 'scale-75 bg-emerald-500/20 border-emerald-400 shadow-xl shadow-emerald-500/30 duration-[6000ms]'
          }`}
        />
        <div className="text-center z-10">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-0.5">
            {phase}
          </div>
          <span className="text-4xl font-black font-mono text-[var(--text)]">{seconds}</span>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
            Cycle {cycles + 1}/{TOTAL_CYCLES}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsRunning(!isRunning)}
        className="px-4 py-2 rounded-xl glass-pill border border-[var(--border)] text-xs font-bold text-[var(--text)] hover:bg-[var(--surface-2)] transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
      >
        {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        <span>{isRunning ? 'Pause' : 'Resume'}</span>
      </button>
    </div>
  );
};
