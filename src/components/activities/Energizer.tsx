import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle2, RotateCw, MoveUp, RefreshCw, Wind } from 'lucide-react';
import { AppTheme } from '../../types';

interface EnergizerProps {
  onComplete: (id: string) => void;
  theme: AppTheme;
}

const STEPS = [
  {
    title: 'Arm Circles',
    desc: 'Extend arms wide and make 10 big circles forward, then 10 backward.',
    icon: RefreshCw,
  },
  {
    title: 'High Knees',
    desc: 'March or jog lightly on the spot, lifting your knees to hip level.',
    icon: MoveUp,
  },
  {
    title: 'Shoulder Rolls',
    desc: 'Roll shoulders up, back, and down 5 times with big circles.',
    icon: RotateCw,
  },
  {
    title: 'Power Breaths',
    desc: 'Inhale deeply through nose for 4s, exhale with a whoosh for 6s.',
    icon: Wind,
  },
];

export const Energizer: React.FC<EnergizerProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepSeconds, setStepSeconds] = useState(15);
  const [isCompleted, setIsCompleted] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (isCompleted) return;

    const interval = setInterval(() => {
      setStepSeconds((prev) => {
        if (prev > 1) return prev - 1;

        // Move to next step or finish
        if (currentStep < STEPS.length - 1) {
          setCurrentStep((s) => s + 1);
          return 15;
        } else {
          setIsCompleted(true);
          return 0;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentStep, isCompleted]);

  const handleClaim = () => {
    if (claimed) return;
    setClaimed(true);
    onComplete('energizer');
  };

  const step = STEPS[currentStep];
  const StepIcon = step.icon;
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (circ * stepSeconds) / 15;

  if (isCompleted) {
    return (
      <div className="p-6 max-w-sm mx-auto text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-base font-black text-[var(--text)]">Energy Restored! ⚡</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Great job! You pumped fresh oxygen to your brain and beat the slump.
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
    <div className="p-6 max-w-sm mx-auto text-center space-y-4">
      {/* Progress Pills */}
      <div className="flex justify-center gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentStep
                ? 'w-6 bg-[var(--accent)]'
                : i < currentStep
                ? 'w-3 bg-[var(--success)]'
                : 'w-3 bg-[var(--border)]'
            }`}
          />
        ))}
      </div>

      {/* SVG Countdown */}
      <div className="relative inline-flex items-center justify-center my-2">
        <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <StepIcon className="w-5 h-5 text-[var(--accent)] mb-0.5 animate-pulse" />
          <span className="text-xs font-black font-mono text-[var(--text)]">{stepSeconds}s</span>
        </div>
      </div>

      <div>
        <div className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider">
          Step {currentStep + 1} of {STEPS.length}
        </div>
        <h3 className="text-sm font-black text-[var(--text)] mt-0.5">{step.title}</h3>
        <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed px-2">
          {step.desc}
        </p>
      </div>
    </div>
  );
};
