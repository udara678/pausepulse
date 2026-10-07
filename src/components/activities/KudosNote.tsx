import { useState, useEffect } from 'react';
import { Copy, CheckCircle2, Heart } from 'lucide-react';

const MAX_CHARS = 280;

interface KudosNoteProps {
  onComplete: (activityId: string) => void;
  theme: 'dark' | 'light';
}

export function KudosNote({ onComplete }: KudosNoteProps) {
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const charsLeft = MAX_CHARS - message.length;
  const isOverLimit = charsLeft < 0;
  const bothFilled = recipient.trim().length > 0 && message.trim().length > 0 && !isOverLimit;
  const canClaim = bothFilled && copied;

  const composedNote = `💙 Kudos to ${recipient.trim()}!\n\n"${message.trim()}"`;

  const handleCopy = async () => {
    if (!bothFilled) return;
    try {
      await navigator.clipboard.writeText(composedNote);
      setCopied(true);
      setShowToast(true);
    } catch {
      // Fallback for environments where clipboard API is restricted
      const el = document.createElement('textarea');
      el.value = composedNote;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setShowToast(true);
    }
  };

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 2000);
    return () => clearTimeout(timer);
  }, [showToast]);

  // Reset copied state if the user edits content after copying
  useEffect(() => {
    setCopied(false);
  }, [recipient, message]);

  return (
    <div
      className="flex flex-col gap-5 p-6 rounded-2xl"
      style={{ background: 'var(--surface)', color: 'var(--text)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Heart size={20} style={{ color: 'var(--accent)' }} />
        <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
          Send a Kudos 💙
        </h2>
      </div>

      {/* Recipient */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          Who are you appreciating?
        </label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="e.g. Jamie, the design team, my manager…"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
          style={{
            background: 'var(--surface-2)',
            color: 'var(--text)',
            border: '1.5px solid var(--border)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        />
      </div>

      {/* Message */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          What did they do that helped you?
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS + 20))}
          rows={4}
          placeholder="They went out of their way to…"
          className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all"
          style={{
            background: 'var(--surface-2)',
            color: 'var(--text)',
            border: `1.5px solid ${isOverLimit ? 'var(--danger)' : 'var(--border)'}`,
          }}
          onFocus={(e) => {
            if (!isOverLimit) e.currentTarget.style.borderColor = 'var(--accent)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = isOverLimit ? 'var(--danger)' : 'var(--border)';
          }}
        />
        {/* Character counter */}
        <span
          className="self-end text-xs tabular-nums"
          style={{ color: isOverLimit ? 'var(--danger)' : 'var(--text-muted)' }}
        >
          {charsLeft} / {MAX_CHARS}
        </span>
      </div>

      {/* Preview bubble */}
      {bothFilled && (
        <div
          className="relative rounded-2xl rounded-tl-sm px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap"
          style={{
            background: 'var(--surface-2)',
            border: '1.5px solid var(--border)',
            color: 'var(--text)',
          }}
        >
          {/* Speech bubble tail */}
          <span
            className="absolute -top-2 left-5 w-4 h-4 rotate-45"
            style={{ background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRight: 'none', borderBottom: 'none' }}
          />
          <span className="relative z-10">{composedNote}</span>
        </div>
      )}

      {/* Copy button + toast */}
      <div className="relative flex items-center gap-3">
        <button
          onClick={handleCopy}
          disabled={!bothFilled}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: copied ? 'var(--success)' : 'var(--surface-2)',
            color: copied ? '#fff' : 'var(--text)',
            border: '1.5px solid var(--border)',
          }}
        >
          <Copy size={15} />
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>

        {/* Toast */}
        <span
          className="absolute left-full ml-3 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-300"
          style={{
            background: 'var(--success)',
            color: '#fff',
            opacity: showToast ? 1 : 0,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          ✓ Copied to clipboard!
        </span>
      </div>

      {/* Claim button */}
      <button
        onClick={() => onComplete('kudos-note')}
        disabled={!canClaim}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: canClaim ? 'var(--accent)' : 'var(--surface-2)',
          color: canClaim ? 'var(--accent-contrast)' : 'var(--text-muted)',
        }}
      >
        <CheckCircle2 size={16} />
        Claim +30 pts
      </button>

      {!canClaim && (
        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          {!bothFilled
            ? 'Fill in both fields to continue'
            : 'Copy the note first to claim your points'}
        </p>
      )}
    </div>
  );
}
