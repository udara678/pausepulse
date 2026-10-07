import { useEffect, useRef, useState } from "react";
import { Navigation, Pause, Play, RotateCcw } from "lucide-react";

type AppTheme = "light" | "dark";

interface WalkTimerProps {
  onComplete: (activityId: string) => void;
  theme: AppTheme;
}

const TOTAL_SECONDS = 180;
const RADIUS = 50;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 314.16

const TIPS = [
  "Walk to a window and look outside",
  "Get a glass of water while you walk",
  "Walk a different route around your office or home",
  "Stretch your arms while walking",
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function WalkTimer({ onComplete }: WalkTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Main countdown
  useEffect(() => {
    if (running && !completed) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            setCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, completed]);

  // Rotate tip every 45 seconds of elapsed time
  useEffect(() => {
    const elapsed = TOTAL_SECONDS - secondsLeft;
    setTipIndex(Math.floor(elapsed / 45) % TIPS.length);
  }, [secondsLeft]);

  const handleReset = () => {
    setRunning(false);
    setCompleted(false);
    setSecondsLeft(TOTAL_SECONDS);
    setTipIndex(0);
  };

  const progress = secondsLeft / TOTAL_SECONDS;
  const dashOffset = CIRCUMFERENCE * progress;

  return (
    <div
      style={{
        background: "var(--surface)",
        color: "var(--text)",
        border: "1px solid var(--border)",
      }}
      className="rounded-2xl p-6 flex flex-col gap-5 max-w-sm mx-auto shadow-md"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Navigation
          size={22}
          style={{ color: "var(--accent)" }}
          aria-hidden="true"
        />
        <div>
          <h2 className="text-lg font-semibold leading-tight">
            Walk Timer 🚶
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Step away from your desk for 3 minutes
          </p>
        </div>
      </div>

      {/* Circular Timer */}
      <div className="flex justify-center">
        <div className="relative flex items-center justify-center">
          <svg width={140} height={140} viewBox="0 0 140 140">
            {/* Track */}
            <circle
              cx={70}
              cy={70}
              r={RADIUS}
              fill="none"
              stroke="var(--surface-2)"
              strokeWidth={10}
            />
            {/* Progress arc */}
            <circle
              cx={70}
              cy={70}
              r={RADIUS}
              fill="none"
              stroke={completed ? "var(--success)" : "var(--accent)"}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 70 70)"
              style={{ transition: "stroke-dashoffset 0.8s linear, stroke 0.4s ease" }}
            />
          </svg>
          {/* Time label */}
          <span
            className="absolute text-2xl font-bold tabular-nums"
            style={{ color: completed ? "var(--success)" : "var(--text)" }}
          >
            {completed ? "✓" : formatTime(secondsLeft)}
          </span>
        </div>
      </div>

      {/* Micro-tip */}
      {!completed && (
        <div
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
          }}
          className="rounded-xl px-4 py-3 text-sm text-center min-h-[52px] flex items-center justify-center transition-all duration-500"
        >
          💡 {TIPS[tipIndex]}
        </div>
      )}

      {/* Completion message */}
      {completed && (
        <div
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--success)",
            color: "var(--success)",
          }}
          className="rounded-xl px-4 py-3 text-sm text-center font-medium"
        >
          Walk complete! Fresh perspective incoming 🧠
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {/* Reset */}
        <button
          onClick={handleReset}
          title="Reset"
          style={{
            background: "var(--surface-2)",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
          }}
          className="rounded-full p-2.5 hover:opacity-80 transition-opacity"
        >
          <RotateCcw size={18} />
        </button>

        {/* Play / Pause */}
        {!completed && (
          <button
            onClick={() => setRunning((r) => !r)}
            style={{
              background: "var(--accent)",
              color: "var(--accent-contrast)",
            }}
            className="rounded-full px-6 py-2.5 font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            {running ? <Pause size={18} /> : <Play size={18} />}
            {running ? "Pause" : secondsLeft === TOTAL_SECONDS ? "Start" : "Resume"}
          </button>
        )}

        {/* Claim points */}
        {completed && (
          <button
            onClick={() => onComplete("walk-timer")}
            style={{
              background: "var(--accent)",
              color: "var(--accent-contrast)",
            }}
            className="rounded-full px-6 py-2.5 font-semibold hover:opacity-90 transition-opacity"
          >
            Claim +30 pts
          </button>
        )}
      </div>
    </div>
  );
}
