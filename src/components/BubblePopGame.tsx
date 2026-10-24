/**
 * BubblePopGame — Cinematic bubble-pop stress buster
 *
 * Perf contract:
 *  • Bubble floating uses CSS-only keyframes — zero JS per-frame state updates.
 *  • Particle / ripple system draws directly on a canvas ref via a single RAF
 *    loop that never touches React state (uses mutable refs for the particle array).
 *  • React state updates only happen on user events (pops) or the slow cleanup
 *    interval (every 100 ms, only when something actually changed).
 */
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Bubble {
  id: number;
  // Fixed position in % — never mutated after spawn; CSS animates the drift.
  x: number;
  y: number;
  size: number;
  color: BubbleColor;
  // CSS animation tuning (randomised once at spawn)
  floatDuration: number;   // s
  floatDelay: number;      // s (negative = already mid-animation)
  floatAmplX: number;      // px
  floatAmplY: number;      // px
  popped: boolean;
}

interface BubbleColor {
  base: string;
  glow: string;
  shine: string;
  particle: string;
}

// Mutable particle — stored in a ref, never in React state
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  color: string;
  born: number;           // performance.now()
  lifetime: number;       // ms
}

interface Ripple {
  x: number; y: number;
  color: string;
  born: number;
  lifetime: number;
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const COLORS: BubbleColor[] = [
  { base: 'radial-gradient(circle at 34% 30%, #c4b5fd, #7c3aed 58%, #3b0764)', glow: '#7c3aed', shine: '#ddd6fe', particle: '#a78bfa' },
  { base: 'radial-gradient(circle at 34% 30%, #67e8f9, #0891b2 58%, #0c4a6e)', glow: '#0891b2', shine: '#a5f3fc', particle: '#22d3ee' },
  { base: 'radial-gradient(circle at 34% 30%, #6ee7b7, #059669 58%, #064e3b)', glow: '#059669', shine: '#a7f3d0', particle: '#34d399' },
  { base: 'radial-gradient(circle at 34% 30%, #fda4af, #e11d48 58%, #4c0519)', glow: '#e11d48', shine: '#fecdd3', particle: '#fb7185' },
  { base: 'radial-gradient(circle at 34% 30%, #fcd34d, #d97706 58%, #451a03)', glow: '#d97706', shine: '#fde68a', particle: '#fbbf24' },
  { base: 'radial-gradient(circle at 34% 30%, #f9a8d4, #db2777 58%, #500724)', glow: '#db2777', shine: '#fbcfe8', particle: '#f472b6' },
  { base: 'radial-gradient(circle at 34% 30%, #86efac, #16a34a 58%, #052e16)', glow: '#16a34a', shine: '#bbf7d0', particle: '#4ade80' },
  { base: 'radial-gradient(circle at 34% 30%, #93c5fd, #2563eb 58%, #172554)', glow: '#2563eb', shine: '#bfdbfe', particle: '#60a5fa' },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const BUBBLE_COUNT    = 16;
const POINTS_PER_POP  = 10;
const CLAIM_THRESHOLD = 50;
const POP_ANIM_MS     = 480;
const PARTICLE_LIFE   = 700;  // ms
const RIPPLE_LIFE     = 600;  // ms

let uid = 0;
const nextId = () => ++uid;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomBubble(id: number): Bubble {
  return {
    id,
    x: 6 + Math.random() * 83,
    y: 6 + Math.random() * 83,
    size: 46 + Math.random() * 34,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    floatDuration: 3.5 + Math.random() * 3,
    floatDelay: -(Math.random() * 4),
    floatAmplX: 8 + Math.random() * 10,
    floatAmplY: 6 + Math.random() * 8,
    popped: false,
  };
}

function spawnBubbles(): Bubble[] {
  return Array.from({ length: BUBBLE_COUNT }, () => randomBubble(nextId()));
}

// ─── Canvas particle renderer (pure imperative, no React state) ───────────────

function useParticleCanvas(
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const particles   = useRef<Particle[]>([]);
  const ripples     = useRef<Ripple[]>([]);
  const rafId       = useRef<number>(0);

  // Kick off the single RAF loop that draws everything
  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) { rafId.current = requestAnimationFrame(draw); return; }
      const ctx = canvas.getContext('2d');
      if (!ctx) { rafId.current = requestAnimationFrame(draw); return; }

      const now = performance.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Ripples
      ripples.current = ripples.current.filter(r => now - r.born < r.lifetime);
      for (const r of ripples.current) {
        const t = (now - r.born) / r.lifetime;
        const alpha = 1 - t;
        const radius = t * 90;
        ctx.beginPath();
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = r.color + Math.round(alpha * 220).toString(16).padStart(2, '0');
        ctx.lineWidth = 2.5 * (1 - t);
        ctx.stroke();
        if (t > 0.15) {
          const r2 = (t - 0.15) * 110;
          ctx.beginPath();
          ctx.arc(r.x, r.y, r2, 0, Math.PI * 2);
          ctx.strokeStyle = r.color + Math.round(alpha * 0.45 * 220).toString(16).padStart(2, '0');
          ctx.lineWidth = 1.5 * (1 - t);
          ctx.stroke();
        }
      }

      // Particles
      particles.current = particles.current.filter(p => now - p.born < p.lifetime);
      for (const p of particles.current) {
        const t = (now - p.born) / p.lifetime;
        const alpha = 1 - t;
        const dt = (now - p.born) / 1000;
        const px = p.x + p.vx * dt;
        const py = p.y + p.vy * dt + 40 * dt * dt; // slight gravity
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, p.size * (1 - t * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      rafId.current = requestAnimationFrame(draw);
    };
    rafId.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  // Keep canvas size in sync with container
  useEffect(() => {
    const el = containerRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const ro = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      canvas.width  = width;
      canvas.height = height;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  const emitBurst = useCallback((
    cx: number, cy: number, color: BubbleColor,
  ) => {
    const now = performance.now();
    const count = 14 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 130;
      particles.current.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        size: 2.5 + Math.random() * 4.5,
        color: color.particle,
        born: now,
        lifetime: PARTICLE_LIFE,
      });
    }
    ripples.current.push({ x: cx, y: cy, color: color.glow, born: now, lifetime: RIPPLE_LIFE });
  }, []);

  return { canvasRef, emitBurst };
}

// ─── Float label (React state, infrequent) ────────────────────────────────────

interface FloatLabel { id: number; x: number; y: number; pts: number; born: number }

// ─── Main Component ───────────────────────────────────────────────────────────

export interface BubblePopGameProps {
  theme: 'dark' | 'light';
  soundEnabled?: boolean;
  gameSessionClaimed: boolean;
  onClaimPoints: () => void;
  onResetGame: () => void;
  gameScore: number;
  onScoreChange: (delta: number) => void;
}

export const BubblePopGame: React.FC<BubblePopGameProps> = ({
  theme,
  gameSessionClaimed,
  onClaimPoints,
  onResetGame,
  gameScore,
  onScoreChange,
}) => {
  const isDark = theme === 'dark';
  const arenaRef = useRef<HTMLDivElement>(null);
  const { canvasRef, emitBurst } = useParticleCanvas(arenaRef);

  const [bubbles,    setBubbles]   = useState<Bubble[]>(() => spawnBubbles());
  const [comboCount, setComboCount] = useState(0);
  const comboTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handlePop = useCallback((bubble: Bubble, e: React.MouseEvent) => {
    if (bubble.popped) return;

    // Hit coords relative to arena
    const rect = arenaRef.current?.getBoundingClientRect();
    const cx = rect ? e.clientX - rect.left : bubble.x / 100 * 380;
    const cy = rect ? e.clientY - rect.top  : bubble.y / 100 * 300;

    // Combo
    const newCombo = comboCount + 1;
    setComboCount(newCombo);
    clearTimeout(comboTimer.current);
    comboTimer.current = setTimeout(() => setComboCount(0), 1300);

    const multiplier = newCombo >= 5 ? 3 : newCombo >= 3 ? 2 : 1;
    const pts = POINTS_PER_POP * multiplier;
    onScoreChange(pts);

    // Mark popped
    setBubbles(prev =>
      prev.map(b => b.id === bubble.id ? { ...b, popped: true } : b),
    );

    // Canvas FX — no React state involved
    emitBurst(cx, cy, bubble.color);

    // Respawn after pop animation finishes
    setTimeout(() => {
      setBubbles(prev =>
        prev.map(b =>
          b.id === bubble.id
            ? randomBubble(b.id)   // same id, fresh position/color
            : b,
        ),
      );
    }, POP_ANIM_MS);
  }, [comboCount, emitBurst, onScoreChange]);

  const handleReset = () => {
    setBubbles(spawnBubbles());
    setComboCount(0);
    onResetGame();
  };

  const progress      = Math.min(1, gameScore / CLAIM_THRESHOLD);
  const poppedCount   = bubbles.filter(b => b.popped).length;
  const claimReady    = gameScore >= CLAIM_THRESHOLD && !gameSessionClaimed;

  // CSS keyframe bodies are injected once; animation props set per-bubble inline.
  return (
    <div style={{
      background: isDark
        ? 'radial-gradient(ellipse at 50% 0%, rgba(109,40,217,.16) 0%, rgba(10,10,28,.97) 70%)'
        : 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,.1) 0%, rgba(243,240,255,.98) 70%)',
      borderRadius: '1.5rem',
      padding: '1.25rem',
      border: `1px solid ${isDark ? 'rgba(139,92,246,.22)' : 'rgba(139,92,246,.18)'}`,
      boxShadow: isDark
        ? '0 0 60px -20px rgba(109,40,217,.35), 0 20px 60px -20px rgba(0,0,0,.55)'
        : '0 0 40px -15px rgba(139,92,246,.2), 0 12px 40px -10px rgba(0,0,0,.1)',
    }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, letterSpacing: '-0.03em',
            color: isDark ? '#f1f5f9' : '#1e1b4b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>🫧</span> Bubble Pop
          </h2>
        </div>

        {/* Combo badge only — score display removed */}
        {comboCount >= 2 && (
          <div style={{
            fontSize: '0.72rem', fontWeight: 800, letterSpacing: '.05em',
            color: comboCount >= 5 ? '#ef4444' : comboCount >= 3 ? '#f59e0b' : '#a78bfa',
          }}>
            🔥 {comboCount}× COMBO
          </div>
        )}
      </div>

      {/* ── Progress bar ───────────────────────────────────────── */}
      <div style={{
        height: 4, borderRadius: 999, marginBottom: '0.7rem', overflow: 'hidden',
        background: isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)',
      }}>
        <div style={{
          height: '100%', borderRadius: 999,
          width: `${progress * 100}%`,
          background: progress >= 1
            ? 'linear-gradient(90deg,#10b981,#059669)'
            : 'linear-gradient(90deg,#7c3aed,#a78bfa)',
          transition: 'width .4s cubic-bezier(.34,1.56,.64,1)',
          boxShadow: progress >= 1 ? '0 0 8px #10b98170' : '0 0 8px #7c3aed70',
        }} />
      </div>

      {/* ── Bubble Arena ───────────────────────────────────────── */}
      <div
        ref={arenaRef}
        style={{
          position: 'relative',
          width: '100%', height: 300,
          borderRadius: '1rem', overflow: 'hidden',
          background: isDark
            ? 'radial-gradient(ellipse at 50% 110%, rgba(109,40,217,.1) 0%, rgba(2,6,23,.92) 80%)'
            : 'radial-gradient(ellipse at 50% 110%, rgba(196,181,253,.25) 0%, rgba(237,233,254,.92) 80%)',
          border: `1px solid ${isDark ? 'rgba(139,92,246,.12)' : 'rgba(139,92,246,.15)'}`,
          cursor: 'crosshair', userSelect: 'none',
        }}
      >
        {/* Ambient glow — static, pure CSS */}
        <div style={{
          position: 'absolute', top: '-30%', left: '15%',
          width: '55%', height: '55%', borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(109,40,217,.1) 0%, transparent 70%)',
        }} />

        {/* Particle canvas — managed imperatively, no React state */}
        <canvas ref={canvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        />

        {/* Bubbles — CSS-animated, no JS per-frame updates */}
        {bubbles.map(b => (
          <BubbleButton key={b.id} bubble={b} onPop={handlePop} />
        ))}
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.7rem', gap: '0.5rem' }}>
        <button onClick={handleReset} style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.45rem 0.85rem',
          borderRadius: '0.7rem',
          border: `1px solid ${isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.09)'}`,
          background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)',
          color: isDark ? '#94a3b8' : '#6b7280',
          fontSize: '0.73rem', fontWeight: 700, cursor: 'pointer',
        }}>
          <RotateCcw size={12} /> New Wave
        </button>

        <span style={{ fontSize: '0.68rem', color: isDark ? '#475569' : '#9ca3af', fontFamily: 'monospace' }}>
          {poppedCount} popped
        </span>

        <button
          disabled={!claimReady && !(gameSessionClaimed)}
          onClick={!gameSessionClaimed ? onClaimPoints : undefined}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.45rem 0.9rem',
            borderRadius: '0.7rem',
            fontSize: '0.73rem', fontWeight: 800, cursor: claimReady ? 'pointer' : 'not-allowed',
            transition: 'all .3s',
            ...(gameSessionClaimed ? {
              background: 'rgba(16,185,129,.1)',
              color: '#10b981',
              border: '1px solid rgba(16,185,129,.28)',
            } : claimReady ? {
              background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
              color: '#fff',
              border: 'none',
              boxShadow: '0 0 22px rgba(124,58,237,.55)',
              animation: 'ppClaimPulse 1.5s ease-in-out infinite',
            } : {
              background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)',
              color: isDark ? '#334155' : '#cbd5e1',
              border: `1px solid ${isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.07)'}`,
            }),
          }}
        >
          {gameSessionClaimed ? '✓ Claimed' : <><Sparkles size={12} /> Claim +30 pts</>}
        </button>
      </div>

      {/* Keyframes — injected once, scoped to the game */}
      <style>{`
        @keyframes ppFloat {
          0%   { transform: translate(0, 0) rotate(0deg); }
          25%  { transform: translate(var(--fx), calc(var(--fy) * -1)) rotate(1.5deg); }
          50%  { transform: translate(calc(var(--fx) * -0.6), var(--fy)) rotate(-1deg); }
          75%  { transform: translate(var(--fx), calc(var(--fy) * 0.4)) rotate(1deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes ppPop {
          0%   { transform: scale(1);   opacity: 1; filter: brightness(1); }
          35%  { transform: scale(1.6); opacity: .7; filter: brightness(2.5); }
          100% { transform: scale(0);   opacity: 0; filter: brightness(4); }
        }
        @keyframes ppAppear {
          0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
          65%  { transform: scale(1.12) rotate(3deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg);   opacity: 1; }
        }
        @keyframes ppClaimPulse {
          0%, 100% { box-shadow: 0 0 22px rgba(124,58,237,.55); }
          50%       { box-shadow: 0 0 38px rgba(168,85,247,.85); }
        }
      `}</style>
    </div>
  );
};

// ─── Individual Bubble ────────────────────────────────────────────────────────

const BubbleButton: React.FC<{
  bubble: Bubble;
  onPop: (b: Bubble, e: React.MouseEvent) => void;
}> = React.memo(({ bubble, onPop }) => {
  const half = bubble.size / 2;

  return (
    <button
      onClick={e => onPop(bubble, e)}
      disabled={bubble.popped}
      style={{
        position: 'absolute',
        left: `calc(${bubble.x}% - ${half}px)`,
        top:  `calc(${bubble.y}% - ${half}px)`,
        width:  bubble.size,
        height: bubble.size,
        borderRadius: '50%',
        border: 'none', padding: 0, outline: 'none',
        cursor: bubble.popped ? 'default' : 'pointer',
        background: bubble.color.base,
        boxShadow: bubble.popped
          ? 'none'
          : `0 0 ${bubble.size * 0.38}px ${bubble.color.glow}55, 0 4px 14px rgba(0,0,0,.28), inset 0 -3px 6px rgba(0,0,0,.18)`,
        // CSS float animation — no JS, no React state, pure GPU
        '--fx': `${bubble.floatAmplX}px`,
        '--fy': `${bubble.floatAmplY}px`,
        animation: bubble.popped
          ? `ppPop ${POP_ANIM_MS}ms cubic-bezier(.36,.07,.19,.97) forwards`
          : `ppFloat ${bubble.floatDuration}s ease-in-out ${bubble.floatDelay}s infinite,
             ppAppear .5s cubic-bezier(.34,1.56,.64,1) both`,
        zIndex: bubble.popped ? 0 : 2,
        overflow: 'hidden',
        willChange: 'transform',
      } as React.CSSProperties}
    >
      {/* Primary shine */}
      <div style={{
        position: 'absolute', top: '16%', left: '18%',
        width: '34%', height: '22%', borderRadius: '50%',
        background: `radial-gradient(circle, ${bubble.color.shine}CC 0%, transparent 100%)`,
        filter: 'blur(1px)', pointerEvents: 'none',
      }} />
      {/* Secondary shine */}
      <div style={{
        position: 'absolute', bottom: '18%', right: '16%',
        width: '18%', height: '12%', borderRadius: '50%',
        background: `radial-gradient(circle, ${bubble.color.shine}55 0%, transparent 100%)`,
        filter: 'blur(.5px)', pointerEvents: 'none',
      }} />
    </button>
  );
});
BubbleButton.displayName = 'BubbleButton';
