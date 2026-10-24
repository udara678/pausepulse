import React from 'react';
import {
  Clock,
  Droplets,
  Smile,
  Heart,
  Gamepad2,
  BarChart3,
  Trophy,
  Crown,
  Sliders,
  Zap,
  Sparkles,
} from 'lucide-react';
import { UserPlan, PLAN_LIMITS, ActiveNavTab } from '../types';

interface FuturisticSidebarProps {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  isAnyRunning: boolean;
  waterIntakeMl: number;
  userPlan: UserPlan;
  points: number;
  levelInfo: { name: string; level: number; next: number; percent: number };
  levelUpToast: string | null;
}

export const FuturisticSidebar: React.FC<FuturisticSidebarProps> = ({
  activeTab,
  setActiveTab,
  isAnyRunning,
  waterIntakeMl,
  userPlan,
  points,
  levelInfo,
  levelUpToast,
}) => {
  const tabs = [
    {
      id: 'TIMER' as ActiveNavTab,
      icon: Clock,
      label: 'Focus Timer',
      badge: isAnyRunning ? 'Live' : undefined,
      color: '#8b5cf6', // Neon Violet
      bgGradient: 'from-violet-600/30 via-indigo-600/20 to-purple-900/40',
      borderColor: 'border-violet-500/50',
      activeText: 'text-violet-300',
      glowShadow: '0 0 20px rgba(139, 92, 246, 0.6)',
      desc: 'Deep work sprint & pacing',
    },
    {
      id: 'HYDRATION' as ActiveNavTab,
      icon: Droplets,
      label: 'Hydration',
      badge: `${waterIntakeMl}ml`,
      color: '#06b6d4', // Electric Cyan
      bgGradient: 'from-cyan-500/30 via-teal-500/20 to-blue-900/40',
      borderColor: 'border-cyan-400/50',
      activeText: 'text-cyan-300',
      glowShadow: '0 0 20px rgba(6, 182, 212, 0.6)',
      desc: 'Cellular water balance',
    },
    {
      id: 'MOOD' as ActiveNavTab,
      icon: Smile,
      label: 'Mood Coach',
      badge: PLAN_LIMITS[userPlan].fullMoodCoach ? '9 Moods' : '3 Free',
      color: '#ec4899', // Cyber Fuchsia
      bgGradient: 'from-fuchsia-500/30 via-pink-500/20 to-rose-900/40',
      borderColor: 'border-fuchsia-400/50',
      activeText: 'text-fuchsia-300',
      glowShadow: '0 0 20px rgba(236, 72, 153, 0.6)',
      desc: 'Neuro-calming micro-routines',
    },
    {
      id: 'BREATHING' as ActiveNavTab,
      icon: Heart,
      label: 'Guided Breathing',
      badge: '3-Phase',
      color: '#10b981', // Emerald Zen
      bgGradient: 'from-emerald-500/30 via-teal-500/20 to-green-900/40',
      borderColor: 'border-emerald-400/50',
      activeText: 'text-emerald-300',
      glowShadow: '0 0 20px rgba(16, 185, 129, 0.6)',
      desc: 'Vagal brake downregulation',
    },
    {
      id: 'GAMES' as ActiveNavTab,
      icon: Gamepad2,
      label: 'Stress Buster',
      badge: PLAN_LIMITS[userPlan].bubbleGame ? 'Mini Game' : '🔒 Pro',
      color: '#f59e0b', // Solar Amber
      bgGradient: 'from-amber-500/30 via-orange-500/20 to-yellow-900/40',
      borderColor: 'border-amber-400/50',
      activeText: 'text-amber-300',
      glowShadow: '0 0 20px rgba(245, 158, 11, 0.6)',
      desc: 'Kinetic bubble pop stress dissipation',
    },
    {
      id: 'ANALYTICS' as ActiveNavTab,
      icon: BarChart3,
      label: 'Personal Analytics',
      badge: PLAN_LIMITS[userPlan].detailedAnalytics ? '7-Day' : '🔒 Pro',
      color: '#3b82f6', // Quantum Blue
      bgGradient: 'from-blue-500/30 via-indigo-500/20 to-sky-900/40',
      borderColor: 'border-blue-400/50',
      activeText: 'text-blue-300',
      glowShadow: '0 0 20px rgba(59, 130, 246, 0.6)',
      desc: 'Peak hours & habit telemetry',
    },
    {
      id: 'ACHIEVEMENTS' as ActiveNavTab,
      icon: Trophy,
      label: 'Achievements',
      badge: `${points} pts`,
      color: '#eab308', // Radiant Gold
      bgGradient: 'from-yellow-500/30 via-amber-500/20 to-orange-900/40',
      borderColor: 'border-yellow-400/50',
      activeText: 'text-yellow-300',
      glowShadow: '0 0 20px rgba(234, 179, 8, 0.6)',
      desc: 'Tiers, streaks & wellness rewards',
    },
    {
      id: 'HR_PORTAL' as ActiveNavTab,
      icon: Crown,
      label: 'Corporate HR',
      badge: PLAN_LIMITS[userPlan].hrDashboard ? 'Team' : '🔒 Team',
      color: '#f97316', // Imperial Orange
      bgGradient: 'from-orange-500/30 via-amber-500/20 to-red-900/40',
      borderColor: 'border-orange-400/50',
      activeText: 'text-orange-300',
      glowShadow: '0 0 20px rgba(249, 115, 22, 0.6)',
      desc: 'Team burnout & wellness metrics',
    },
    {
      id: 'SETTINGS' as ActiveNavTab,
      icon: Sliders,
      label: 'Settings',
      badge: undefined,
      color: '#a855f7', // Holographic Tech
      bgGradient: 'from-purple-500/30 via-violet-500/20 to-indigo-900/40',
      borderColor: 'border-purple-400/50',
      activeText: 'text-purple-300',
      glowShadow: '0 0 20px rgba(168, 85, 247, 0.6)',
      desc: 'Timers, alerts & preferences',
    },
    {
      id: 'BACKGROUND_COLOR' as ActiveNavTab,
      icon: Sparkles,
      label: 'Background Orb',
      badge: 'Live',
      color: '#10b981', // Bio-Luminescent Emerald
      bgGradient: 'from-emerald-500/30 via-teal-500/20 to-cyan-900/40',
      borderColor: 'border-emerald-400/50',
      activeText: 'text-emerald-300',
      glowShadow: '0 0 20px rgba(16, 185, 129, 0.6)',
      desc: 'Full 3D Orb & Color Mixer',
    },
  ];

  return (
    <aside className="w-20 flex-shrink-0 flex flex-col justify-between py-3.5 px-2.5 border-r border-[var(--border)] glass-panel transition-colors z-40 select-none">
      {/* ── Top Header Mini Indicator ── */}
      <div className="relative group/top flex justify-center mb-1">
        <div className="w-10 h-7 rounded-xl flex items-center justify-center glass-pill border border-white/10 cursor-default transition-all group-hover/top:border-[var(--accent)]/50">
          <span className="text-[10px] font-black font-mono tracking-wider text-[var(--accent)] uppercase">
            HUB
          </span>
        </div>

        {/* Hover-reveal Header Details */}
        <div className="absolute left-full top-0 ml-3 px-3 py-1.5 rounded-xl bg-slate-900/95 border border-[var(--border)] text-white text-[11px] font-bold whitespace-nowrap shadow-2xl backdrop-blur-xl opacity-0 group-hover/top:opacity-100 translate-x-2 group-hover/top:translate-x-0 transition-all duration-200 pointer-events-none z-50 flex items-center gap-2">
          <span>PausePulse Dashboard</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[var(--accent)]/20 text-[var(--accent)] font-mono lowercase border border-[var(--accent)]/30">
            {userPlan} tier
          </span>
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900/95 border-l border-b border-[var(--border)] rotate-45" />
        </div>
      </div>

      {/* ── Futuristic Cyber Icon Navigation Dock ── */}
      <div className="flex-1 flex flex-col justify-center space-y-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <div key={tab.id} className="relative group flex items-center justify-center">
              <button
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer ${
                  isActive
                    ? `bg-gradient-to-br ${tab.bgGradient} ${tab.borderColor} border shadow-lg scale-105 ring-1 ring-white/20`
                    : 'bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 hover:scale-105 text-[var(--text-muted)] hover:text-white'
                }`}
                style={{
                  boxShadow: isActive ? tab.glowShadow : undefined,
                }}
              >
                {/* Active Indicator Pulse Bar on the Left Edge */}
                {isActive && (
                  <div
                    className="absolute -left-2 top-2.5 bottom-2.5 w-1 rounded-r-full shadow-md animate-pulse"
                    style={{ backgroundColor: tab.color }}
                  />
                )}

                {/* Futuristic Icon Glyph */}
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? tab.activeText : 'text-[var(--text-muted)] group-hover:text-white'
                  }`}
                  style={{
                    filter: isActive ? `drop-shadow(0 0 8px ${tab.color})` : undefined,
                  }}
                />
              </button>

              {/* ── Hover-Only Floating Cyber Tooltip ── */}
              <div className="absolute left-full ml-3 px-3 py-2 rounded-2xl bg-slate-950/95 border border-[var(--border)] text-white shadow-2xl backdrop-blur-2xl opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 pointer-events-none z-50 min-w-44 flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black tracking-tight">{tab.label}</span>
                  {tab.badge && (
                    <span
                      className="text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold"
                      style={{
                        backgroundColor: `${tab.color}25`,
                        color: tab.color,
                        border: `1px solid ${tab.color}40`,
                      }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-medium leading-tight">
                  {tab.desc}
                </span>

                {/* Tooltip Pointer Arrow */}
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-950/95 border-l border-b border-[var(--border)] rotate-45" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bottom Dock: Your Level Holographic Pill ── */}
      <div className="relative group/level pt-2 border-t border-[var(--border)] flex justify-center">
        <button
          type="button"
          onClick={() => setActiveTab('ACHIEVEMENTS')}
          className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/25 via-purple-500/15 to-cyan-500/20 border border-amber-500/30 flex flex-col items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-105 shadow-md shadow-amber-500/10"
        >
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
          <span className="text-[8px] font-mono font-black text-amber-300 leading-none mt-0.5">
            L{levelInfo.level}
          </span>
        </button>

        {/* Hover-reveal Level Progress Details */}
        <div className="absolute left-full bottom-0 ml-3 p-3 rounded-2xl bg-slate-950/95 border border-[var(--border)] text-white shadow-2xl backdrop-blur-2xl opacity-0 group-hover/level:opacity-100 translate-x-2 group-hover/level:translate-x-0 transition-all duration-200 pointer-events-none z-50 min-w-48 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-amber-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-current" /> {levelInfo.name}
            </span>
            <span className="text-cyan-400 font-mono">{points.toLocaleString()} pts</span>
          </div>

          <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-purple-500 transition-all duration-500"
              style={{ width: `${levelInfo.percent}%` }}
            />
          </div>

          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5 font-mono">
            <span>Level {levelInfo.level}</span>
            <span>{Math.round(levelInfo.percent)}% to next</span>
          </div>
          <div className="text-[9px] text-[var(--accent)] font-semibold text-center pt-0.5">
            Click to view all achievements
          </div>

          {/* Pointer Arrow */}
          <div className="absolute -left-1 bottom-4 w-2 h-2 bg-slate-950/95 border-l border-b border-[var(--border)] rotate-45" />
        </div>
      </div>

      {/* Floating Level Up Toast Notification */}
      {levelUpToast && (
        <div className="absolute left-full bottom-14 ml-3 p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom duration-300 z-50 whitespace-nowrap">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{levelUpToast}</span>
        </div>
      )}
    </aside>
  );
};
