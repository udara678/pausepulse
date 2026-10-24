import React, { useState, useEffect } from 'react';
import {
  Clock, Lock, Sparkles, Calendar, Droplets,
  ShieldCheck, Target, Sun, Moon, Sunrise
} from 'lucide-react';
import { AppTheme, UserPlan } from '../types';

interface DetailedAnalyticsProps {
  theme: AppTheme;
  userPlan: UserPlan;
  onUpgradeClick: () => void;
}

interface DailyRecord {
  day: string;
  fullDay: string;
  focusMins: number;
  breakMins: number;
  waterMl: number;
  score: number;
  mood: number;
  breathingSessions: number;
}

const WEEKLY_DATA: DailyRecord[] = [
  { day: 'Mon', fullDay: 'Monday',    focusMins: 210, breakMins: 45, waterMl: 2250, score: 94, mood: 4, breathingSessions: 3 },
  { day: 'Tue', fullDay: 'Tuesday',   focusMins: 185, breakMins: 40, waterMl: 2000, score: 90, mood: 3, breathingSessions: 2 },
  { day: 'Wed', fullDay: 'Wednesday', focusMins: 240, breakMins: 55, waterMl: 2500, score: 96, mood: 5, breathingSessions: 4 },
  { day: 'Thu', fullDay: 'Thursday',  focusMins: 195, breakMins: 42, waterMl: 1750, score: 85, mood: 3, breathingSessions: 2 },
  { day: 'Fri', fullDay: 'Friday',    focusMins: 220, breakMins: 50, waterMl: 2000, score: 92, mood: 4, breathingSessions: 3 },
  { day: 'Sat', fullDay: 'Saturday',  focusMins: 90,  breakMins: 25, waterMl: 1500, score: 82, mood: 4, breathingSessions: 1 },
  { day: 'Sun', fullDay: 'Sunday',    focusMins: 60,  breakMins: 15, waterMl: 1250, score: 78, mood: 2, breathingSessions: 1 },
];

const RADAR_AXES = [
  { key: 'focus',       label: 'Focus',       value: 87, color: '#6366f1' },
  { key: 'hydration',   label: 'Hydration',   value: 76, color: '#22d3ee' },
  { key: 'breaks',      label: 'Breaks',      value: 92, color: '#a78bfa' },
  { key: 'mood',        label: 'Mood',        value: 68, color: '#f59e0b' },
  { key: 'breathing',   label: 'Breathing',   value: 55, color: '#10b981' },
  { key: 'consistency', label: 'Consistency', value: 94, color: '#f43f5e' },
];

const HEATMAP_DATA = [
  [0.1, 0.8, 0.7, 0.3],
  [0.0, 0.7, 0.6, 0.2],
  [0.2, 0.9, 0.8, 0.4],
  [0.0, 0.6, 0.7, 0.3],
  [0.1, 0.8, 0.7, 0.5],
  [0.3, 0.4, 0.4, 0.2],
  [0.2, 0.2, 0.3, 0.1],
];
const HEATMAP_BLOCKS = ['Night', 'Morning', 'Afternoon', 'Evening'];

// ─── COUNT-UP HOOK ───────────────────────
function useCountUp(target: number, duration = 1200, delay = 0): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf: number;
    const timeout = setTimeout(() => {
      let start: number | null = null;
      const step = (ts: number) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(ease * target));
        if (progress < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return value;
}

// ─── ANIMATED ARC GAUGE ──────────────────
const GaugeArc: React.FC<{ score: number; size?: number }> = ({ score, size = 150 }) => {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1400, 1);
      setAnimated(Math.round((1 - Math.pow(1 - p, 3)) * score));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const r = size * 0.36;
  const cx = size / 2;
  const cy = size * 0.52;
  const startAngle = -210;
  const totalArc = 240;
  const polar = (a: number) => {
    const rad = ((a - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const s = polar(startAngle);
  const e = polar(startAngle + totalArc);
  const largeArc = totalArc > 180 ? 1 : 0;
  const bgPath = `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  const fillAngle = (animated / 100) * totalArc;
  const fp = polar(startAngle + fillAngle);
  const fgLargeArc = fillAngle > 180 ? 1 : 0;
  const fgPath = animated > 0 ? `M ${s.x} ${s.y} A ${r} ${r} 0 ${fgLargeArc} 1 ${fp.x} ${fp.y}` : '';

  const grade = score >= 90 ? 'S' : score >= 80 ? 'A' : score >= 70 ? 'B' : 'C';
  const gradeColor = score >= 90 ? '#22d3ee' : score >= 80 ? '#10b981' : score >= 70 ? '#f59e0b' : '#f43f5e';

  return (
    <svg width={size} height={size * 0.82} viewBox={`0 0 ${size} ${size * 0.82}`}>
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <filter id="gaugeGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d={bgPath} fill="none" stroke="rgba(99,102,241,0.12)" strokeWidth={size * 0.065} strokeLinecap="round" />
      {fgPath && <path d={fgPath} fill="none" stroke="url(#gaugeGrad)" strokeWidth={size * 0.065} strokeLinecap="round" filter="url(#gaugeGlow)" />}
      <text x={cx} y={cy - 2} textAnchor="middle" fill="white" fontSize={size * 0.2} fontWeight="900" fontFamily="monospace">{animated}</text>
      <text x={cx} y={cy + size * 0.1} textAnchor="middle" fill="#94a3b8" fontSize={size * 0.085}>/100</text>
      <circle cx={cx} cy={cy + size * 0.2} r={size * 0.09} fill={`${gradeColor}22`} stroke={`${gradeColor}55`} strokeWidth="1" />
      <text x={cx} y={cy + size * 0.24} textAnchor="middle" fill={gradeColor} fontSize={size * 0.11} fontWeight="900">{grade}</text>
    </svg>
  );
};

// ─── RADAR / SPIDER CHART ────────────────
const RadarChart: React.FC<{ axes: typeof RADAR_AXES; size?: number }> = ({ axes, size = 220 }) => {
  const [animPct, setAnimPct] = useState(0);
  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1200, 1);
      setAnimPct(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const [hoveredAxis, setHoveredAxis] = useState<number | null>(null);
  const cx = size / 2, cy = size / 2;
  const maxR = size * 0.32;
  const n = axes.length;
  const angleStep = (2 * Math.PI) / n;
  const getPoint = (i: number, rr: number) => {
    const a = i * angleStep - Math.PI / 2;
    return { x: cx + rr * Math.cos(a), y: cy + rr * Math.sin(a) };
  };
  const rings = [0.25, 0.5, 0.75, 1.0];
  const dataPoints = axes.map((ax, i) => getPoint(i, (ax.value / 100) * maxR * animPct));
  const polyPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.1" />
        </radialGradient>
        <filter id="radarGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {rings.map(r => {
        const pts = Array.from({ length: n }, (_, i) => getPoint(i, r * maxR));
        return <polygon key={r} points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="1" />;
      })}
      {axes.map((_, i) => {
        const end = getPoint(i, maxR);
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(99,102,241,0.2)" strokeWidth="1" />;
      })}
      <polygon points={polyPoints} fill="url(#radarFill)" stroke="#6366f1" strokeWidth="1.5" filter="url(#radarGlow)" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={hoveredAxis === i ? 5 : 3.5}
          fill={axes[i].color} stroke="rgba(0,0,0,0.6)" strokeWidth="1"
          style={{ cursor: 'pointer', transition: 'r 0.15s' }}
          onMouseEnter={() => setHoveredAxis(i)} onMouseLeave={() => setHoveredAxis(null)} />
      ))}
      {axes.map((ax, i) => {
        const lp = getPoint(i, maxR + 18);
        return (
          <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="central"
            fill={hoveredAxis === i ? ax.color : '#cbd5e1'} fontSize="10" fontWeight={hoveredAxis === i ? '900' : '700'}
            style={{ transition: 'fill 0.15s' }}>{ax.label}</text>
        );
      })}
      {hoveredAxis !== null && (() => {
        const ax = axes[hoveredAxis];
        const p = dataPoints[hoveredAxis];
        return (
          <g>
            <rect x={p.x - 22} y={p.y - 22} width="44" height="16" rx="4" fill="rgba(15,23,42,0.95)" stroke={ax.color} strokeWidth="1" />
            <text x={p.x} y={p.y - 11} textAnchor="middle" dominantBaseline="middle" fill={ax.color} fontSize="9" fontWeight="800">{ax.value}%</text>
          </g>
        );
      })()}
    </svg>
  );
};

// ─── AREA LINE CHART ─────────────────────
const AreaLineChart: React.FC<{
  data: DailyRecord[];
  metric: 'focusMins' | 'waterMl' | 'score';
  color: string;
  gradId: string;
  formatVal: (v: number) => string;
}> = ({ data, metric, color, gradId, formatVal }) => {
  const [animPct, setAnimPct] = useState(0);
  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 900, 1);
      setAnimPct(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [metric]);

  const [hovered, setHovered] = useState<number | null>(null);
  const W = 340, H = 100;
  const pad = { l: 10, r: 10, t: 12, b: 14 };
  const values = data.map(d => d[metric] as number);
  const minV = Math.min(...values) * 0.85;
  const maxV = Math.max(...values) * 1.05;
  const toX = (i: number) => pad.l + (i / (data.length - 1)) * (W - pad.l - pad.r);
  const toY = (v: number) => pad.t + (1 - (v - minV) / (maxV - minV)) * (H - pad.t - pad.b);
  const animValues = values.map(v => minV + (v - minV) * animPct);
  const points = animValues.map((v, i) => ({ x: toX(i), y: toY(v) }));
  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[i - 1];
    const cpx = (prev.x + pt.x) / 2;
    return `${acc} C ${cpx} ${prev.y} ${cpx} ${pt.y} ${pt.x} ${pt.y}`;
  }, '');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${H - pad.b} L ${points[0].x} ${H - pad.b} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
        <filter id={`${gradId}Glow`}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" filter={`url(#${gradId}Glow)`} />
      {points.map((pt, i) => (
        <g key={i}>
          <circle cx={pt.x} cy={pt.y} r={hovered === i ? 5 : 3} fill={color} stroke="rgba(0,0,0,0.6)" strokeWidth="1.2"
            style={{ cursor: 'pointer', transition: 'r 0.15s' }}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
          {hovered === i && (
            <g>
              <rect x={pt.x - 28} y={pt.y - 23} width="56" height="15" rx="3" fill="rgba(15,23,42,0.95)" stroke={color} strokeWidth="0.8" />
              <text x={pt.x} y={pt.y - 13} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="8" fontWeight="800">
                {data[i].day}: {formatVal(values[i])}
              </text>
            </g>
          )}
        </g>
      ))}
      {data.map((d, i) => (
        <text key={i} x={toX(i)} y={H - 1} textAnchor="middle" fill="#475569" fontSize="7.5" fontWeight="600">{d.day}</text>
      ))}
    </svg>
  );
};

// ─── STACKED BAR CHART ───────────────────
const StackedBarChart: React.FC<{
  data: DailyRecord[];
  selectedDay: string;
  onSelect: (d: DailyRecord) => void;
}> = ({ data, selectedDay, onSelect }) => {
  const [animPct, setAnimPct] = useState(0);
  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1000, 1);
      setAnimPct(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const maxTotal = Math.max(...data.map(d => d.focusMins + d.breakMins));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '6px', height: '120px', paddingTop: '8px' }}>
      {data.map(d => {
        const total = d.focusMins + d.breakMins;
        const totalH = (total / maxTotal) * 100 * animPct;
        const focusH = (d.focusMins / total) * totalH;
        const breakH = (d.breakMins / total) * totalH;
        const isSel = selectedDay === d.day;
        return (
          <button key={d.day} type="button" onClick={() => onSelect(d)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', height: '100px', justifyContent: 'flex-end', gap: '1px' }}>
              <div style={{
                height: `${focusH}px`,
                background: isSel ? 'linear-gradient(to top, #6366f1, #818cf8)' : 'rgba(99,102,241,0.45)',
                borderRadius: breakH > 0 ? '0' : '4px 4px 0 0',
                boxShadow: isSel ? '0 0 8px rgba(99,102,241,0.5)' : 'none',
                transition: 'background 0.2s, box-shadow 0.2s'
              }} />
              {breakH > 0 && (
                <div style={{
                  height: `${breakH}px`,
                  background: isSel ? 'linear-gradient(to top, #22d3ee, #67e8f9)' : 'rgba(34,211,238,0.3)',
                  borderRadius: '4px 4px 0 0', transition: 'background 0.2s'
                }} />
              )}
            </div>
            <span style={{ fontSize: '9px', fontWeight: '700', color: isSel ? '#818cf8' : '#475569', transition: 'color 0.2s' }}>{d.day}</span>
          </button>
        );
      })}
    </div>
  );
};

// ─── DONUT CHART ─────────────────────────
const DonutChart: React.FC<{
  segments: { label: string; value: number; color: string }[];
  size?: number;
}> = ({ segments, size = 120 }) => {
  const [animPct, setAnimPct] = useState(0);
  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1000, 1);
      setAnimPct(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const [hovered, setHovered] = useState<number | null>(null);
  const cx = size / 2, cy = size / 2;
  const outerR = size * 0.4, innerR = size * 0.26;
  const total = segments.reduce((s, x) => s + x.value, 0);
  let currentAngle = -Math.PI / 2;

  const paths = segments.map((seg, i) => {
    const frac = (seg.value / total) * animPct;
    const sweep = frac * 2 * Math.PI;
    const rr = hovered === i ? outerR + 5 : outerR;
    const x1 = cx + rr * Math.cos(currentAngle);
    const y1 = cy + rr * Math.sin(currentAngle);
    const x2 = cx + rr * Math.cos(currentAngle + sweep);
    const y2 = cy + rr * Math.sin(currentAngle + sweep);
    const xi1 = cx + innerR * Math.cos(currentAngle);
    const yi1 = cy + innerR * Math.sin(currentAngle);
    const xi2 = cx + innerR * Math.cos(currentAngle + sweep);
    const yi2 = cy + innerR * Math.sin(currentAngle + sweep);
    const la = sweep > Math.PI ? 1 : 0;
    const d = `M ${x1} ${y1} A ${rr} ${rr} 0 ${la} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${innerR} ${innerR} 0 ${la} 0 ${xi1} ${yi1} Z`;
    currentAngle += sweep;
    return { d, color: seg.color, seg, i };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <filter id="donutGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {paths.map(({ d, color, i }) => (
        <path key={i} d={d} fill={color} opacity={hovered === null || hovered === i ? 1 : 0.4}
          filter={hovered === i ? 'url(#donutGlow)' : 'none'}
          style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
          onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
      ))}
      {hovered !== null ? (
        <>
          <text x={cx} y={cy - 5} textAnchor="middle" fill={segments[hovered].color} fontSize={size * 0.11} fontWeight="900">{segments[hovered].value}%</text>
          <text x={cx} y={cy + size * 0.1} textAnchor="middle" fill="#94a3b8" fontSize={size * 0.075} fontWeight="600">{segments[hovered].label}</text>
        </>
      ) : (
        <>
          <text x={cx} y={cy - 2} textAnchor="middle" fill="white" fontSize={size * 0.1} fontWeight="800">Focus</text>
          <text x={cx} y={cy + size * 0.1} textAnchor="middle" fill="#475569" fontSize={size * 0.075}>split</text>
        </>
      )}
    </svg>
  );
};

// ─── HEATMAP GRID ────────────────────────
const HeatmapGrid: React.FC<{ data: number[][]; days: string[]; blocks: string[] }> = ({ data, days, blocks }) => {
  const [hovered, setHovered] = useState<{ d: number; b: number } | null>(null);
  const cellW = 36, cellH = 22, gap = 3;
  const labelW = 36, headerH = 18;
  const W = labelW + blocks.length * (cellW + gap);
  const H = headerH + days.length * (cellH + gap);
  const toColor = (v: number) => {
    if (v === 0) return 'rgba(99,102,241,0.05)';
    const levels = ['rgba(99,102,241,0.12)', 'rgba(99,102,241,0.3)', 'rgba(99,102,241,0.55)', 'rgba(99,102,241,0.8)', '#6366f1'];
    return levels[Math.min(Math.floor(v * 5), 4)];
  };
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {blocks.map((b, bi) => (
        <text key={bi} x={labelW + bi * (cellW + gap) + cellW / 2} y={12}
          textAnchor="middle" fill="#475569" fontSize="7.5" fontWeight="700">{b}</text>
      ))}
      {data.map((row, di) =>
        row.map((val, bi) => {
          const isHov = hovered?.d === di && hovered?.b === bi;
          const x = labelW + bi * (cellW + gap);
          const y = headerH + di * (cellH + gap);
          return (
            <g key={`${di}-${bi}`}>
              <rect x={x} y={y} width={cellW} height={cellH} rx="4" fill={toColor(val)}
                stroke={isHov ? '#6366f1' : 'transparent'} strokeWidth="1.5"
                style={{ cursor: 'pointer', transition: 'stroke 0.15s' }}
                onMouseEnter={() => setHovered({ d: di, b: bi })} onMouseLeave={() => setHovered(null)} />
              {isHov && (
                <text x={x + cellW / 2} y={y + cellH / 2 + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="7" fontWeight="800">
                  {Math.round(val * 100)}%
                </text>
              )}
            </g>
          );
        })
      )}
      {days.map((d, di) => (
        <text key={di} x={labelW - 4} y={headerH + di * (cellH + gap) + cellH / 2 + 1}
          textAnchor="end" dominantBaseline="middle" fill="#475569" fontSize="8" fontWeight="700">{d}</text>
      ))}
    </svg>
  );
};

// ─── MOOD LINE CHART ─────────────────────
const MoodChart: React.FC<{ data: DailyRecord[] }> = ({ data }) => {
  const [animPct, setAnimPct] = useState(0);
  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 900, 1);
      setAnimPct(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const W = 340, H = 72;
  const pad = { l: 8, r: 8, t: 8, b: 16 };
  const moodColors = ['', '#f43f5e', '#f59e0b', '#22d3ee', '#10b981', '#a78bfa'];
  const toX = (i: number) => pad.l + (i / (data.length - 1)) * (W - pad.l - pad.r);
  const toY = (v: number) => pad.t + (1 - (v - 1) / 4) * (H - pad.t - pad.b);
  const animValues = data.map(d => 1 + (d.mood - 1) * animPct);
  const points = animValues.map((v, i) => ({ x: toX(i), y: toY(v) }));
  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[i - 1];
    const cpx = (prev.x + pt.x) / 2;
    return `${acc} C ${cpx} ${prev.y} ${cpx} ${pt.y} ${pt.x} ${pt.y}`;
  }, '');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${H - pad.b} L ${points[0].x} ${H - pad.b} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#moodGrad)" />
      <path d={pathD} fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
      {points.map((pt, i) => (
        <g key={i}>
          <circle cx={pt.x} cy={pt.y} r="4" fill={moodColors[data[i].mood]} stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
          <text x={pt.x} y={H - 3} textAnchor="middle" fontSize="8" fill="#475569" fontWeight="700">{data[i].day}</text>
        </g>
      ))}
    </svg>
  );
};

// ─── MOST HELPFUL ACTIVITIES ─────────────
interface ActivityLogItem {
  id: string;
  moodId: string;
  activityId: string;
  activityTitle: string;
  timestamp: number;
}

const MostHelpfulActivities: React.FC<{
  isDark: boolean;
  cardStyle: React.CSSProperties;
  sectionLabelStyle: React.CSSProperties;
}> = ({ isDark, cardStyle, sectionLabelStyle }) => {
  const [activities, setActivities] = useState<{ title: string; count: number }[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('pausepulse_activity_history');
      if (raw) {
        const logs: ActivityLogItem[] = JSON.parse(raw);
        const counts: Record<string, number> = {};
        logs.forEach(l => { counts[l.activityTitle] = (counts[l.activityTitle] || 0) + 1; });
        const sorted = Object.entries(counts).map(([title, count]) => ({ title, count }))
          .sort((a, b) => b.count - a.count).slice(0, 5);
        if (sorted.length > 0) { setActivities(sorted); return; }
      }
    } catch { /* fallback */ }
    setActivities([
      { title: '3-Phase Breathing', count: 12 },
      { title: 'Desk Stretch',      count: 9 },
      { title: 'Grounding 5-4-3-2-1', count: 7 },
      { title: 'Brain Dump',        count: 5 },
      { title: 'Eye Rest 20-20-20', count: 4 },
    ]);
  }, []);

  const maxCount = Math.max(...activities.map(a => a.count), 1);
  const actColors = ['#6366f1', '#22d3ee', '#10b981', '#f59e0b', '#a78bfa'];

  return (
    <div style={{ ...cardStyle }}>
      <div style={{ marginBottom: '10px' }}>
        <div style={sectionLabelStyle}>Activity Impact</div>
        <div style={{ fontSize: '12px', fontWeight: 800, color: isDark ? '#fff' : '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={12} color="#6366f1" /> Most Completed Activities
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {activities.map((act, i) => {
          const pct = Math.round((act.count / maxCount) * 100);
          return (
            <div key={act.title}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: isDark ? '#cbd5e1' : '#334155' }}>{act.title}</span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: actColors[i], fontFamily: 'monospace' }}>{act.count}×</span>
              </div>
              <div style={{ height: '5px', borderRadius: '99px', background: 'rgba(99,102,241,0.1)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${pct}%`, borderRadius: '99px',
                  background: `linear-gradient(to right, ${actColors[i]}, ${actColors[i]}99)`,
                  boxShadow: `0 0 6px ${actColors[i]}50`,
                  transition: 'width 1s cubic-bezier(0.23, 1, 0.32, 1)'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────
export const DetailedAnalytics: React.FC<DetailedAnalyticsProps> = ({ theme, userPlan, onUpgradeClick }) => {
  const isDark = theme === 'dark';
  const isLocked = userPlan === 'trial';
  const [selectedDay, setSelectedDay] = useState<DailyRecord>(WEEKLY_DATA[4]);
  const [activeMetric, setActiveMetric] = useState<'focusMins' | 'waterMl' | 'score'>('focusMins');

  const weeklyFocusMins = WEEKLY_DATA.reduce((s, d) => s + d.focusMins, 0);
  const weeklyFocusHrsDisplay = useCountUp(Math.round(weeklyFocusMins / 60), 1200, 200);
  const avgScore = useCountUp(Math.round(WEEKLY_DATA.reduce((s, d) => s + d.score, 0) / 7), 1400, 300);
  const avgWaterVal = useCountUp(Math.round(WEEKLY_DATA.reduce((s, d) => s + d.waterMl, 0) / 7 / 100) * 100, 1200, 250);
  const breakAdherence = useCountUp(92, 1300, 350);

  const card: React.CSSProperties = {
    background: isDark ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.95)',
    border: isDark ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(203,213,225,0.8)',
    borderRadius: '20px',
    backdropFilter: 'blur(12px)',
    padding: '16px',
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '9px',
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#6366f1',
    marginBottom: '4px',
  };

  const metricOptions: {
    key: 'focusMins' | 'waterMl' | 'score';
    label: string;
    color: string;
    format: (v: number) => string;
  }[] = [
    { key: 'focusMins', label: 'Focus Time', color: '#6366f1', format: v => `${Math.round(v / 60 * 10) / 10}h` },
    { key: 'waterMl',   label: 'Hydration',  color: '#22d3ee', format: v => `${(v / 1000).toFixed(1)}L` },
    { key: 'score',     label: 'Score',       color: '#10b981', format: v => `${v}` },
  ];
  const activeMetricObj = metricOptions.find(m => m.key === activeMetric)!;

  const donutSegments = [
    { label: 'Morning',   value: 48, color: '#f59e0b' },
    { label: 'Afternoon', value: 36, color: '#6366f1' },
    { label: 'Evening',   value: 16, color: '#10b981' },
  ];

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', position: 'relative' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={sectionLabelStyle}>Personal Analytics</div>
          <h2 style={{ fontSize: '18px', fontWeight: 900, color: isDark ? '#fff' : '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            7-Day Wellness Report
            {isLocked && (
              <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.1em', padding: '2px 8px', borderRadius: '99px',
                background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)',
                display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Lock size={9} /> PRO
              </span>
            )}
          </h2>
          <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0', fontWeight: 500 }}>
            Unified diagnostics calculated automatically from your completed focus sprints, hydration logs, and micro-break activities.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
          <Calendar size={13} />
          <span style={{ fontWeight: 700 }}>Last 7 Days</span>
        </div>
      </div>

      {/* LOCK OVERLAY */}
      <div style={{ position: 'relative' }}>
        {isLocked && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 20,
            backdropFilter: 'blur(10px)', background: 'rgba(2,6,23,0.75)',
            border: '1px solid rgba(99,102,241,0.3)', borderRadius: '24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '24px', textAlign: 'center', gap: '12px'
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(99,102,241,0.2)',
              border: '1px solid rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
              <Lock size={22} />
            </div>
            <div>
              <h3 style={{ color: '#fff', fontWeight: 900, fontSize: '15px', margin: '0 0 4px' }}>Unlock 7-Day Personal Analytics</h3>
              <p style={{ color: '#94a3b8', fontSize: '12px', maxWidth: '320px', margin: 0 }}>
                Radar wellness charts, heatmaps, mood trends, and full interactive dashboards on <strong>Pro ($4.99/mo)</strong>.
              </p>
            </div>
            <button type="button" onClick={onUpgradeClick} style={{
              padding: '10px 24px', borderRadius: '12px', cursor: 'pointer', border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #22d3ee)', color: '#fff',
              fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: '0 0 24px rgba(99,102,241,0.4)'
            }}>
              <Sparkles size={14} /> Unlock with Pro
            </button>
          </div>
        )}

        <div style={{ filter: isLocked ? 'blur(4px)' : 'none', pointerEvents: isLocked ? 'none' : 'auto', opacity: isLocked ? 0.5 : 1 }}>

          {/* ROW 1 — KPI TILES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
            {[
              { icon: <Clock size={14} color="#6366f1" />,      label: 'Deep Work',  value: `${weeklyFocusHrsDisplay}h`, badge: '+14%',  badgeColor: '#10b981' },
              { icon: <Target size={14} color="#10b981" />,      label: 'Avg Score',  value: `${avgScore}`,              badge: 'Top 5%', badgeColor: '#10b981' },
              { icon: <Droplets size={14} color="#22d3ee" />,    label: 'Avg Water',  value: `${avgWaterVal}ml`,         badge: 'Goal ✓', badgeColor: '#22d3ee' },
              { icon: <ShieldCheck size={14} color="#f59e0b" />, label: 'Breaks',     value: `${breakAdherence}%`,       badge: '39/40',  badgeColor: '#f59e0b' },
            ].map((kpi, i) => (
              <div key={i} style={{ ...card, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {kpi.icon}
                  <span style={{ fontSize: '9px', fontWeight: 800, color: kpi.badgeColor }}>{kpi.badge}</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'monospace', color: isDark ? '#fff' : '#0f172a', lineHeight: 1 }}>{kpi.value}</div>
                <div style={{ fontSize: '9px', fontWeight: 600, color: '#475569' }}>{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* ROW 2 — GAUGE + STACKED BARS */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '10px', marginBottom: '12px' }}>
            <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={sectionLabelStyle}>Focus Score</div>
              <GaugeArc score={selectedDay.score} size={150} />
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginTop: '-4px' }}>{selectedDay.fullDay}</div>
              <div style={{ fontSize: '9px', color: '#475569', textAlign: 'center', lineHeight: 1.4 }}>Focus · Break Pacing · Compliance</div>
            </div>
            <div style={{ ...card }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <div>
                  <div style={sectionLabelStyle}>Daily Breakdown</div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: isDark ? '#fff' : '#0f172a' }}>Focus vs Break Time</div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '9px', color: '#818cf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#6366f1', display: 'inline-block' }} /> Focus
                  </span>
                  <span style={{ fontSize: '9px', color: '#22d3ee', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#22d3ee', display: 'inline-block' }} /> Break
                  </span>
                </div>
              </div>
              <StackedBarChart data={WEEKLY_DATA} selectedDay={selectedDay.day} onSelect={setSelectedDay} />
              <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px', fontWeight: 600 }}>
                Selected: <span style={{ color: '#818cf8' }}>{selectedDay.fullDay} — {selectedDay.focusMins}m focus, {selectedDay.breakMins}m breaks</span>
              </div>
            </div>
          </div>

          {/* ROW 3 — AREA CHART + RADAR */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '10px', marginBottom: '12px' }}>
            <div style={{ ...card }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={sectionLabelStyle}>Trend View</div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: isDark ? '#fff' : '#0f172a' }}>7-Day {activeMetricObj.label} Trend</div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {metricOptions.map(m => (
                    <button key={m.key} type="button" onClick={() => setActiveMetric(m.key)} style={{
                      fontSize: '8px', fontWeight: 800, padding: '3px 8px', borderRadius: '99px', cursor: 'pointer', border: 'none',
                      background: activeMetric === m.key ? m.color : 'rgba(99,102,241,0.1)',
                      color: activeMetric === m.key ? '#fff' : '#475569',
                      transition: 'all 0.2s'
                    }}>{m.label}</button>
                  ))}
                </div>
              </div>
              <AreaLineChart key={activeMetric} data={WEEKLY_DATA} metric={activeMetric}
                color={activeMetricObj.color} gradId={`areaGrad_${activeMetric}`}
                formatVal={activeMetricObj.format} />
            </div>
            <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', overflow: 'visible' }}>
              <div style={sectionLabelStyle}>Wellness Radar</div>
              <RadarChart axes={RADAR_AXES} size={200} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', width: '100%', marginTop: '4px' }}>
                {RADAR_AXES.map(ax => (
                  <div key={ax.key} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '8px', fontWeight: 700, color: '#475569' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: ax.color, flexShrink: 0 }} />
                    <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{ax.label}</span>
                    <span style={{ color: ax.color, marginLeft: 'auto', fontWeight: 800 }}>{ax.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ROW 4 — MOOD + DONUT */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 190px', gap: '10px', marginBottom: '12px' }}>
            <div style={{ ...card }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={sectionLabelStyle}>Mood & Energy Trend</div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: isDark ? '#fff' : '#0f172a' }}>Daily Emotional Rhythm</div>
                  <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0 0' }}>
                    Tracks your logged state from Mood Coach check-ins (1 = Stressed/Tired to 5 = Inspired/Great)
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '5px', fontSize: '13px' }}>
                  {['😞','😐','🙂','😊','🤩'].map((e, i) => (
                    <span key={i} title={['Very Low (1)','Low (2)','Okay (3)','Good (4)','Great (5)'][i]}>{e}</span>
                  ))}
                </div>
              </div>
              <MoodChart data={WEEKLY_DATA} />
            </div>
            <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={sectionLabelStyle}>Focus by Time of Day</div>
              <DonutChart segments={donutSegments} size={120} />
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {donutSegments.map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', fontWeight: 700 }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: s.color, flexShrink: 0 }} />
                    <span style={{ color: '#475569', flex: 1 }}>{s.label}</span>
                    <span style={{ color: s.color }}>{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ROW 5 — HEATMAP + ACTIVITIES */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div style={{ ...card }}>
              <div style={{ marginBottom: '8px' }}>
                <div style={sectionLabelStyle}>Activity Heatmap</div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: isDark ? '#fff' : '#0f172a' }}>Focus Intensity by Time Block</div>
              </div>
              <HeatmapGrid data={HEATMAP_DATA} days={WEEKLY_DATA.map(d => d.day)} blocks={HEATMAP_BLOCKS} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '8px', color: '#475569', fontWeight: 600 }}>Low</span>
                {[0.06, 0.18, 0.38, 0.62, 1.0].map((v, i) => (
                  <span key={i} style={{ width: '12px', height: '10px', borderRadius: '2px', background: `rgba(99,102,241,${v})`, display: 'inline-block' }} />
                ))}
                <span style={{ fontSize: '8px', color: '#475569', fontWeight: 600 }}>High</span>
              </div>
            </div>
            <MostHelpfulActivities isDark={isDark} cardStyle={card} sectionLabelStyle={sectionLabelStyle} />
          </div>

          {/* ROW 6 — PEAK HOURS */}
          <div style={{ ...card }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <div>
                <div style={sectionLabelStyle}>Peak Performance</div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: isDark ? '#fff' : '#0f172a' }}>⚡ Focus Hours Distribution</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#475569', fontWeight: 600 }}>Based on session completions</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { icon: <Sunrise size={12} color="#f59e0b" />, label: 'Morning',   sub: '8:00 – 12:00', pct: 48, color: '#f59e0b' },
                { icon: <Sun     size={12} color="#6366f1" />, label: 'Afternoon', sub: '1:00 – 5:00',  pct: 36, color: '#6366f1' },
                { icon: <Moon    size={12} color="#10b981" />, label: 'Evening',   sub: '6:00 – 9:00',  pct: 16, color: '#10b981' },
              ].map(row => (
                <div key={row.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: isDark ? '#cbd5e1' : '#334155' }}>
                      {row.icon} {row.label}
                      <span style={{ fontWeight: 500, color: '#475569' }}>{row.sub}</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: row.color, fontFamily: 'monospace' }}>{row.pct}% of deep work</span>
                  </div>
                  <div style={{ height: '7px', borderRadius: '99px', background: 'rgba(99,102,241,0.1)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${row.pct}%`, borderRadius: '99px',
                      background: `linear-gradient(to right, ${row.color}, ${row.color}aa)`,
                      boxShadow: `0 0 8px ${row.color}60`,
                      transition: 'width 1s cubic-bezier(0.23, 1, 0.32, 1)'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
