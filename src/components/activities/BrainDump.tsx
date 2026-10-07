import { useState, useEffect, useRef } from 'react';
import { CheckCircle, Trash2 } from 'lucide-react';

type AppTheme = 'dark' | 'light';

interface Props {
  onComplete: (activityId: string) => void;
  theme: AppTheme;
}

const TOTAL_SECONDS = 120;
const DONE_ENABLE_AFTER_MS = 10_000; // 10s of accumulated typing time

export function BrainDump({ onComplete }: Props) {
  const [text, setText] = useState('');
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [completed, setCompleted] = useState(false);
  const [typingMs, setTypingMs] = useState(0); // milliseconds user has typed
  const [doneEnabled, setDoneEnabled] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isTypingRef = useRef(false);
  const lastTypingCheck = useRef(Date.now());

  // Main countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setCompleted(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, []);

  // Track typing duration for Done button unlock
  useEffect(() => {
    typingRef.current = setInterval(() => {
      if (isTypingRef.current) {
        const now = Date.now();
        const delta = now - lastTypingCheck.current;
        setTypingMs((prev) => {
          const next = prev + delta;
          if (next >= DONE_ENABLE_AFTER_MS) setDoneEnabled(true);
          return next;
        });
      }
      lastTypingCheck.current = Date.now();
      isTypingRef.current = false;
    }, 500);
    return () => clearInterval(typingRef.current!);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    isTypingRef.current = true;
  };

  const handleDone = () => setCompleted(true);

  const handleClear = () => setText('');

  const handleClaimAndClear = () => {
    setText('');
    onComplete('brain-dump');
  };

  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const progressPct = ((TOTAL_SECONDS - timeLeft) / TOTAL_SECONDS) * 100;
  const barWidth = Math.min(progressPct, 100);

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-10 px-6 text-center">
        <div
          className="flex items-center justify-center w-20 h-20 rounded-full"
          style={{ background: 'color-mix(in srgb, var(--success) 15%, transparent)' }}
        >
          <CheckCircle size={44} style={{ color: 'var(--success)' }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            Mind cleared ✦
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            You wrote{' '}
            <span className="font-semibold" style={{ color: 'var(--accent)' }}>
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>{' '}
            — great release!
          </p>
        </div>
        <button
          onClick={handleClaimAndClear}
          className="px-8 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 active:opacity-75"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-contrast)',
          }}
        >
          Clear &amp; Claim +30 pts
        </button>
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex flex-col gap-4 px-4 py-5" style={{ minHeight: 360 }}>
      {/* Countdown bar */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            Brain Dump
          </span>
          <span
            className="text-xs font-mono font-bold tabular-nums"
            style={{ color: timeLeft <= 10 ? 'var(--danger)' : 'var(--accent)' }}
          >
            {minutes}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
        <div
          className="relative w-full rounded-full overflow-hidden"
          style={{ height: 6, background: 'var(--border)' }}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              width: `${barWidth}%`,
              background: timeLeft <= 10 ? 'var(--danger)' : 'var(--accent)',
              transition: 'width 0.9s linear, background 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={handleChange}
        placeholder="Write everything on your mind — no judgment, no editing…"
        className="flex-1 w-full resize-none rounded-xl p-4 text-sm leading-relaxed outline-none focus:ring-2"
        style={{
          minHeight: 220,
          background: 'var(--surface-2)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          caretColor: 'var(--accent)',
          // focus ring via Tailwind focus:ring uses accent
          // We'll override focus ring color via inline style trick
        }}
        // @ts-expect-error - custom CSS property
        onFocus={(e) => (e.currentTarget.style.outline = `2px solid var(--accent)`)}
        onBlur={(e) => (e.currentTarget.style.outline = 'none')}
        autoFocus
      />

      {/* Word count + actions */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </span>

        <div className="flex items-center gap-2">
          {/* Clear button */}
          <button
            onClick={handleClear}
            disabled={text.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 active:opacity-60 disabled:opacity-30"
            style={{
              background: 'var(--surface-2)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
            title="Clear text"
          >
            <Trash2 size={13} />
            Clear
          </button>

          {/* Done button */}
          <button
            onClick={handleDone}
            disabled={!doneEnabled}
            className="px-5 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 active:opacity-75 disabled:opacity-35 disabled:cursor-not-allowed"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-contrast)',
            }}
            title={!doneEnabled ? 'Keep typing for a few more seconds…' : 'Mark as done'}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
