import { useState, useEffect, useRef, useCallback } from 'react';
import {
  RotateCcw,
  ArrowUp,
  Heart,
  Circle,
  Rotate3d,
  PersonStanding,
  CheckCircle2,
  ChevronRight,
  SkipForward,
} from 'lucide-react';

export type AppTheme = 'dark' | 'light';

interface DeskStretchProps {
  onComplete: (activityId: string) => void;
  theme: AppTheme;
}

interface Step {
  title: string;
  instruction: string;
  Icon: React.ElementType;
}

const STEPS: Step[] = [
  {
    title: 'Neck Roll',
    instruction: 'Slowly roll your head to the left, then to the right. Keep movements smooth and gentle.',
    Icon: RotateCcw,
  },
  {
    title: 'Shoulder Shrug',
    instruction: 'Raise both shoulders up toward your ears, hold for 2 seconds, then release and let them drop.',
    Icon: ArrowUp,
  },
  {
    title: 'Chest Opener',
    instruction: 'Clasp your hands behind your back, straighten your arms and gently open your chest upward.',
    Icon: Heart,
  },
  {
    title: 'Wrist Circles',
    instruction: 'Extend both arms in front of you. Rotate your wrists slowly clockwise, then counter-clockwise.',
    Icon: Circle,
  },
  {
    title: 'Seated Spinal Twist',
    instruction: 'Place your right hand on your left knee and twist gently to the left. Then switch sides.',
    Icon: Rotate3d,
  },
  {
    title: 'Forward Fold',
    instruction: 'Push your chair back slightly, then fold forward from the hips with a straight back toward the floor.',
    Icon: PersonStanding,
  },
];

const STEP_DURATION = 20; // seconds
const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 226

export function DeskStretch({ onComplete }: DeskStretchProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(STEP_DURATION);
  const [running, setRunning] = useState(true);
  const [skipped, setSkipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Countdown ticker
  useEffect(() => {
    if (!running || completed) return;

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
  }, [running, completed, stepIndex, clearTimer]);

  // Auto-advance when timeLeft hits 0
  useEffect(() => {
    if (timeLeft === 0 && running && !completed) {
      if (stepIndex < STEPS.length - 1) {
        setStepIndex((i) => i + 1);
        setTimeLeft(STEP_DURATION);
      } else {
        setCompleted(true);
        setRunning(false);
      }
    }
  }, [timeLeft, running, completed, stepIndex]);

  const handleNext = () => {
    clearTimer();
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
      setTimeLeft(STEP_DURATION);
      setRunning(true);
    } else {
      setCompleted(true);
      setRunning(false);
    }
  };

  const handleSkip = () => {
    clearTimer();
    setRunning(false);
    setSkipped(true);
    setCompleted(true);
  };

  const handleClaim = () => {
    if (!skipped) {
      onComplete('desk-stretch');
    }
  };

  const progress = (STEP_DURATION - timeLeft) / STEP_DURATION;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const currentStep = STEPS[stepIndex];
  const StepIcon = currentStep.Icon;

  if (completed) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-6 py-10 px-6 text-center"
        style={{ color: 'var(--text)' }}
      >
        <CheckCircle2
          size={64}
          style={{ color: skipped ? 'var(--text-muted)' : 'var(--success)' }}
          strokeWidth={1.5}
        />
        <div>
          <h2 className="text-2xl font-bold mb-1">
            {skipped ? 'Stretch Skipped' : 'Stretch Complete!'}
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {skipped
              ? 'Finish all 6 steps to earn your points.'
              : 'Great work! Your body will thank you.'}
          </p>
        </div>

        <div className="relative inline-block">
          <button
            onClick={handleClaim}
            onMouseEnter={() => skipped && setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            disabled={skipped}
            className="px-6 py-3 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: skipped ? 'var(--surface-2)' : 'var(--accent)',
              color: skipped ? 'var(--text-muted)' : 'var(--accent-contrast)',
              cursor: skipped ? 'not-allowed' : 'pointer',
              opacity: skipped ? 0.6 : 1,
            }}
          >
            Claim +30 pts
          </button>
          {showTooltip && skipped && (
            <div
              className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs px-3 py-1.5 rounded-lg shadow-lg z-10"
              style={{
                background: 'var(--surface-2)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}
            >
              Complete all steps to claim
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-5 px-6 py-5 select-none"
      style={{ color: 'var(--text)' }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        {/* Step pills */}
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === stepIndex ? 20 : 8,
                height: 8,
                background: i <= stepIndex ? 'var(--accent)' : 'var(--border)',
              }}
            />
          ))}
        </div>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-all"
          style={{
            color: 'var(--text-muted)',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
          }}
        >
          <SkipForward size={12} />
          Skip
        </button>
      </div>

      {/* Step label */}
      <p className="text-xs font-medium tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
        Step {stepIndex + 1} of {STEPS.length}
      </p>

      {/* Main content */}
      <div className="flex flex-col items-center gap-4">
        {/* Circular countdown */}
        <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
          <svg width={96} height={96} style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
            {/* Background ring */}
            <circle
              cx={48}
              cy={48}
              r={RADIUS}
              fill="none"
              stroke="var(--border)"
              strokeWidth={5}
            />
            {/* Progress ring */}
            <circle
              cx={48}
              cy={48}
              r={RADIUS}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.9s linear' }}
            />
          </svg>

          {/* Icon + timer inside */}
          <div className="flex flex-col items-center gap-0.5 z-10">
            <StepIcon size={22} style={{ color: 'var(--accent)' }} strokeWidth={1.8} />
            <span className="text-lg font-bold leading-none tabular-nums" style={{ color: 'var(--text)' }}>
              {timeLeft}
            </span>
          </div>
        </div>

        {/* Step info */}
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">{currentStep.title}</h2>
          <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
            {currentStep.instruction}
          </p>
        </div>
      </div>

      {/* Next button */}
      <button
        onClick={handleNext}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all mt-2"
        style={{
          background: 'var(--accent)',
          color: 'var(--accent-contrast)',
        }}
      >
        {stepIndex < STEPS.length - 1 ? 'Next Step' : 'Finish'}
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
