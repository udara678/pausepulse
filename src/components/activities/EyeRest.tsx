import { useState, useEffect, useRef, useCallback } from 'react';
import { Eye, CheckCircle2, Play } from 'lucide-react';

export type AppTheme = 'dark' | 'light';

interface EyeRestProps {
  onComplete: (activityId: string) => void;
  theme: AppTheme;
}

const DURATION = 20; // seconds
const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 276.5

type Phase = 'idle' | 'running' | 'done';

export function EyeRest({ onComplete }: EyeRestProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [timeLeft, setTimeLeft] = useState(DURATION);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (phase !== 'running') return;

    clearTimer();
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return clearTimer;
  }, [phase, clearTimer]);

  useEffect(() => {
    if (timeLeft === 0 && phase === 'running') {
      setPhase('done');
    }
  }, [timeLeft, phase]);

  const handleStart = () => {
    setTimeLeft(DURATION);
    setPhase('running');
  };

  const handleClaim = () => {
    onComplete('eye-rest-20-20-20');
  };

  const progress = (DURATION - timeLeft) / DURATION;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  /* ── Done screen ── */
  if (phase === 'done') {
    return (
      <div
        className="flex flex-col items-center justify-center gap-6 py-10 px-6 text-center"
        style={{ color: 'var(--text)' }}
      >
        <CheckCircle2 size={64} strokeWidth={1.5} style={{ color: 'var(--success)' }} />
        <div>
          <h2 className="text-2xl font-bold mb-1">Eyes Refreshed!</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Eye strain reduced. Keep it up with a break every 20 minutes.
          </p>
        </div>
        <button
          onClick={handleClaim}
          className="px-6 py-3 rounded-xl font-semibold text-sm transition-all"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-contrast)',
          }}
        >
          Claim +30 pts
        </button>
      </div>
    );
  }

  /* ── Idle screen ── */
  if (phase === 'idle') {
    return (
      <div
        className="flex flex-col items-center justify-center gap-7 py-10 px-6 text-center"
        style={{ color: 'var(--text)' }}
      >
        {/* Static eye with soft glow */}
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 120,
            height: 120,
            background: 'var(--surface-2)',
            border: '2px solid var(--border)',
            boxShadow: '0 0 28px 4px color-mix(in srgb, var(--accent) 18%, transparent)',
          }}
        >
          <Eye size={52} strokeWidth={1.4} style={{ color: 'var(--accent)' }} />
        </div>

        <div>
          <h2 className="text-xl font-bold mb-2">20-20-20 Eye Rest</h2>
          <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
            Look at something <strong>20 feet (6 meters) away</strong> for 20 seconds to relieve eye strain.
          </p>
        </div>

        <button
          onClick={handleStart}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-contrast)',
          }}
        >
          <Play size={15} fill="currentColor" />
          Start Timer
        </button>
      </div>
    );
  }

  /* ── Running screen ── */
  return (
    <div
      className="flex flex-col items-center justify-center gap-7 py-10 px-6 text-center"
      style={{ color: 'var(--text)' }}
    >
      {/* Circular countdown with glow ring */}
      <div className="relative flex items-center justify-center" style={{ width: 136, height: 136 }}>
        {/* Pulsing glow layer */}
        <div
          className="absolute rounded-full"
          style={{
            width: 136,
            height: 136,
            background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
            animation: 'eyeGlow 2s ease-in-out infinite',
          }}
        />

        <svg
          width={136}
          height={136}
          style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}
        >
          {/* Track */}
          <circle
            cx={68}
            cy={68}
            r={RADIUS}
            fill="none"
            stroke="var(--border)"
            strokeWidth={6}
          />
          {/* Progress arc */}
          <circle
            cx={68}
            cy={68}
            r={RADIUS}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.9s linear' }}
          />
        </svg>

        {/* Center content */}
        <div className="flex flex-col items-center gap-1 z-10">
          <Eye size={26} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
          <span
            className="text-2xl font-bold tabular-nums leading-none"
            style={{ color: 'var(--text)' }}
          >
            {timeLeft}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>sec</span>
        </div>
      </div>

      {/* Pulsing instruction */}
      <div style={{ animation: 'eyePulse 3s ease-in-out infinite' }}>
        <h2 className="text-xl font-bold mb-2">Look Away Now</h2>
        <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
          Focus on something <strong>20 feet (6 meters) away</strong> until the timer ends.
        </p>
      </div>

      {/* Keyframe styles injected via a style tag */}
      <style>{`
        @keyframes eyeGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.08); }
        }
        @keyframes eyePulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.65; }
        }
      `}</style>
    </div>
  );
}
