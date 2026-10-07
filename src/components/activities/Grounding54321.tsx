import { useState, useEffect, useRef } from 'react';
import { Eye, Ear, Hand, Wind, Coffee, CheckCircle } from 'lucide-react';

type AppTheme = 'dark' | 'light';

interface Props {
  onComplete: (activityId: string) => void;
  theme: AppTheme;
}

interface Step {
  number: number;
  sense: string;
  prompt: string;
  icon: React.ReactNode;
  color: string;
}

const STEP_DURATION = 30; // seconds

const steps: Step[] = [
  {
    number: 1,
    sense: 'SEE',
    prompt: 'Look around and name 5 things you can see right now.',
    icon: <Eye size={56} strokeWidth={1.5} />,
    color: 'var(--accent)',
  },
  {
    number: 2,
    sense: 'HEAR',
    prompt: 'Pause and notice 4 things you can hear around you.',
    icon: <Ear size={56} strokeWidth={1.5} />,
    color: 'var(--success)',
  },
  {
    number: 3,
    sense: 'TOUCH',
    prompt: 'Reach out and touch 3 things near you — notice their texture.',
    icon: <Hand size={56} strokeWidth={1.5} />,
    color: 'var(--warning)',
  },
  {
    number: 4,
    sense: 'SMELL',
    prompt: 'Take a slow breath and identify 2 things you can smell.',
    icon: <Wind size={56} strokeWidth={1.5} />,
    color: 'var(--accent)',
  },
  {
    number: 5,
    sense: 'TASTE',
    prompt: 'Bring your awareness inward — notice 1 thing you can taste.',
    icon: <Coffee size={56} strokeWidth={1.5} />,
    color: 'var(--success)',
  },
];

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function Grounding54321({ onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(STEP_DURATION);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const advanceStep = () => {
    clearTimer();
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
      setTimeLeft(STEP_DURATION);
    } else {
      setCompleted(true);
    }
  };

  useEffect(() => {
    if (completed) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearTimer();
          // advance after a short delay so user sees 0
          setTimeout(() => advanceStep(), 300);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, completed]);

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
            Calm restored
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            You've completed all 5 senses. Your nervous system thanks you.
          </p>
        </div>
        <div className="flex gap-2 mt-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: 'var(--success)' }}
            />
          ))}
        </div>
        <button
          onClick={() => onComplete('grounding-54321')}
          className="mt-2 px-8 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 active:opacity-75"
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

  const step = steps[currentStep];
  const progress = timeLeft / STEP_DURATION;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-6 px-6 py-8 select-none">
      {/* Progress Pills */}
      <div className="flex gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: i === currentStep ? '2rem' : '0.5rem',
              background: i <= currentStep ? 'var(--accent)' : 'var(--border)',
            }}
          />
        ))}
      </div>

      {/* Step label */}
      <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
        Step {currentStep + 1} of {steps.length}
      </p>

      {/* Circular countdown with icon */}
      <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
        <svg
          width={140}
          height={140}
          className="absolute top-0 left-0"
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Track */}
          <circle
            cx={70}
            cy={70}
            r={RADIUS}
            fill="none"
            strokeWidth={6}
            style={{ stroke: 'var(--border)' }}
          />
          {/* Progress arc */}
          <circle
            cx={70}
            cy={70}
            r={RADIUS}
            fill="none"
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{
              stroke: step.color,
              transition: 'stroke-dashoffset 0.9s linear',
            }}
          />
        </svg>

        {/* Icon + timer */}
        <div className="flex flex-col items-center gap-1 z-10" style={{ color: step.color }}>
          {step.icon}
          <span className="text-xs font-mono font-semibold" style={{ color: 'var(--text-muted)' }}>
            {String(timeLeft).padStart(2, '0')}s
          </span>
        </div>
      </div>

      {/* Sense badge */}
      <div
        className="px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase"
        style={{
          background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
          color: 'var(--accent)',
          border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
        }}
      >
        {step.sense}
      </div>

      {/* Prompt */}
      <p
        className="text-center text-base leading-relaxed max-w-xs"
        style={{ color: 'var(--text)' }}
      >
        {step.prompt}
      </p>

      {/* Next Step button */}
      <button
        onClick={advanceStep}
        className="mt-2 px-8 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 active:opacity-75"
        style={{
          background: 'var(--accent)',
          color: 'var(--accent-contrast)',
        }}
      >
        {currentStep < steps.length - 1 ? 'Next Step →' : 'Finish'}
      </button>
    </div>
  );
}
