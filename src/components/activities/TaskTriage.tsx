import { useState } from 'react';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

type Stage = 'list' | 'pick' | 'focus';

interface TaskTriageProps {
  onComplete: (activityId: string) => void;
  theme: 'dark' | 'light';
}

export function TaskTriage({ onComplete }: TaskTriageProps) {
  const [stage, setStage] = useState<Stage>('list');
  const [rawText, setRawText] = useState('');
  const [picked, setPicked] = useState<string>('');

  const tasks = rawText
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean);

  const canContinue = tasks.length >= 2;

  return (
    <div
      className="flex flex-col gap-6 p-6 rounded-2xl"
      style={{ background: 'var(--surface)', color: 'var(--text)' }}
    >
      {/* ── STAGE: LIST ── */}
      {stage === 'list' && (
        <>
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
              🧠 Brain Dump
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Dump your open tasks — one per line
            </p>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={8}
            placeholder={`Reply to Sarah's email\nFinish Q3 report\nReview pull request #42`}
            className="w-full rounded-xl p-4 text-sm resize-none outline-none transition-all"
            style={{
              background: 'var(--surface-2)',
              color: 'var(--text)',
              border: '1.5px solid var(--border)',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          />

          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} entered
              {!canContinue && tasks.length > 0 && ' · add at least 2'}
            </span>
            <button
              disabled={!canContinue}
              onClick={() => setStage('pick')}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: canContinue ? 'var(--accent)' : 'var(--surface-2)',
                color: canContinue ? 'var(--accent-contrast)' : 'var(--text-muted)',
              }}
            >
              Continue
              <ArrowRight size={16} />
            </button>
          </div>
        </>
      )}

      {/* ── STAGE: PICK ── */}
      {stage === 'pick' && (
        <>
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
              🎯 Pick One
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Which task is your single most important next action?
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {tasks.map((task, i) => (
              <li key={i}>
                <button
                  onClick={() => {
                    setPicked(task);
                    setStage('focus');
                  }}
                  className="w-full text-left px-5 py-4 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    border: '1.5px solid var(--border)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.background = 'var(--surface)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background = 'var(--surface-2)';
                  }}
                >
                  {task}
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={() => setStage('list')}
            className="self-start text-xs underline"
            style={{ color: 'var(--text-muted)' }}
          >
            ← Edit tasks
          </button>
        </>
      )}

      {/* ── STAGE: FOCUS ── */}
      {stage === 'focus' && (
        <>
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
              ✅ Your Focus
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Everything else can wait.
            </p>
          </div>

          {/* Glowing focus card */}
          <div
            className="rounded-2xl px-6 py-8 flex flex-col items-center gap-3 text-center"
            style={{
              background: 'var(--surface-2)',
              border: '2px solid var(--accent)',
              boxShadow: '0 0 32px -4px var(--accent)',
            }}
          >
            <Sparkles size={28} style={{ color: 'var(--accent)' }} />
            <p className="text-2xl font-black leading-snug" style={{ color: 'var(--text)' }}>
              {picked}
            </p>
          </div>

          <p
            className="text-center text-sm font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            This is your <span style={{ color: 'var(--accent)' }}>ONE</span> next step.
          </p>

          <button
            onClick={() => onComplete('task-triage')}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-contrast)',
            }}
          >
            <CheckCircle2 size={16} />
            Claim +30 pts
          </button>

          <button
            onClick={() => {
              setPicked('');
              setStage('pick');
            }}
            className="self-center text-xs underline"
            style={{ color: 'var(--text-muted)' }}
          >
            ← Choose a different task
          </button>
        </>
      )}
    </div>
  );
}
