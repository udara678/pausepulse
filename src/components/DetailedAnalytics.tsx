import React, { useState } from 'react';
import { BarChart3, TrendingUp, Droplets, Clock, ShieldCheck, Lock, Sparkles, Calendar, Zap, ArrowUpRight } from 'lucide-react';
import { AppTheme, UserPlan } from '../types';

interface DetailedAnalyticsProps {
  theme: AppTheme;
  userPlan: UserPlan;
  onUpgradeClick: () => void;
}

interface DailyRecord {
  day: string;
  focusMins: number;
  breaks: number;
  waterMl: number;
  score: number;
}

const WEEKLY_DATA: DailyRecord[] = [
  { day: 'Mon', focusMins: 210, breaks: 7, waterMl: 2250, score: 94 },
  { day: 'Tue', focusMins: 185, breaks: 6, waterMl: 2000, score: 90 },
  { day: 'Wed', focusMins: 240, breaks: 8, waterMl: 2500, score: 96 },
  { day: 'Thu', focusMins: 195, breaks: 6, waterMl: 1750, score: 85 },
  { day: 'Fri', focusMins: 220, breaks: 7, waterMl: 2000, score: 92 },
  { day: 'Sat', focusMins: 90, breaks: 3, waterMl: 1500, score: 82 },
  { day: 'Sun', focusMins: 60, breaks: 2, waterMl: 1250, score: 78 },
];

export const DetailedAnalytics: React.FC<DetailedAnalyticsProps> = ({
  theme,
  userPlan,
  onUpgradeClick,
}) => {
  const isDark = theme === 'dark';
  const isLocked = userPlan === 'trial';
  const [selectedDay, setSelectedDay] = useState<DailyRecord>(WEEKLY_DATA[4]); // default Friday

  const maxMins = 240;

  return (
    <div className="space-y-4 max-w-3xl mx-auto relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-black tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <span>7-Day Personal Wellness Analytics</span>
            {isLocked && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Pro Feature
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400">Track focus discipline, hydration consistency, and micro-break adherence</p>
        </div>

        <div className="flex items-center space-x-1.5 text-xs text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>Last 7 Days</span>
        </div>
      </div>

      {/* Container with Locked Overlay for Trial Users */}
      <div className="relative">
        {isLocked && (
          <div className="absolute inset-0 z-20 backdrop-blur-md bg-slate-950/70 border border-indigo-500/30 rounded-3xl flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-base font-black text-white">Unlock 7-Day Personal Analytics</h3>
              <p className="text-xs text-slate-300">
                Detailed weekly trends, hourly focus heatmaps, and hydration compliance are available on <strong>Pro Monthly ($4.99)</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={onUpgradeClick}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Unlock with Pro ($4.99/mo)</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content (Rendered beneath, blurred if locked) */}
        <div className={`space-y-4 ${isLocked ? 'filter blur-xs pointer-events-none opacity-60' : ''}`}>
          {/* Key Stat Highlights */}
          <div className="grid grid-cols-4 gap-2.5">
            <div
              className={`p-3.5 rounded-2xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] text-emerald-400 font-bold">+14%</span>
              </div>
              <div className="text-lg font-black font-mono">20.0 hrs</div>
              <div className="text-[10px] text-slate-400 font-medium">Weekly Deep Work</div>
            </div>

            <div
              className={`p-3.5 rounded-2xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-bold">39/40</span>
              </div>
              <div className="text-lg font-black font-mono">92%</div>
              <div className="text-[10px] text-slate-400 font-medium">Break Adherence</div>
            </div>

            <div
              className={`p-3.5 rounded-2xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] text-cyan-400 font-bold">Goal Met</span>
              </div>
              <div className="text-lg font-black font-mono">1.9 L</div>
              <div className="text-[10px] text-slate-400 font-medium">Daily Avg Water</div>
            </div>

            <div
              className={`p-3.5 rounded-2xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] text-amber-400 font-bold">Top 5%</span>
              </div>
              <div className="text-lg font-black font-mono">94 / 100</div>
              <div className="text-[10px] text-slate-400 font-medium">Wellness Rating</div>
            </div>
          </div>

          {/* 7-Day Focus Time Bar Chart */}
          <div
            className={`p-5 rounded-3xl border space-y-4 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Weekly Focus Hours</h3>
                <span className="text-base font-black text-white">Daily Focus Session Breakdown</span>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400">Selected: </span>
                <span className="text-xs font-bold text-indigo-400">{selectedDay.day} ({selectedDay.focusMins} mins)</span>
              </div>
            </div>

            {/* Bars */}
            <div className="flex items-end justify-between gap-3 h-40 pt-4 px-2">
              {WEEKLY_DATA.map((d) => {
                const heightPercent = Math.round((d.focusMins / maxMins) * 100);
                const isSelected = selectedDay.day === d.day;
                return (
                  <button
                    key={d.day}
                    type="button"
                    onClick={() => setSelectedDay(d)}
                    className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {Math.round(d.focusMins / 60)}h
                    </span>
                    <div className="w-full bg-slate-800/60 rounded-xl h-28 flex items-end p-1">
                      <div
                        className={`w-full rounded-lg transition-all duration-500 ${
                          isSelected
                            ? 'bg-gradient-to-t from-indigo-600 to-cyan-400 shadow-md shadow-indigo-500/40'
                            : 'bg-indigo-600/40 hover:bg-indigo-600/70'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`}>
                      {d.day}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Peak Productivity Time Distribution */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Peak Focus Hours Distribution
              </span>
              <span className="text-[11px] text-slate-400">Based on timer completions</span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Morning (8:00 AM – 12:00 PM)</span>
                  <span className="font-bold text-cyan-400 font-mono">48% of deep work</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: '48%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Afternoon (1:00 PM – 5:00 PM)</span>
                  <span className="font-bold text-indigo-400 font-mono">36% of deep work</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '36%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Evening (6:00 PM – 9:00 PM)</span>
                  <span className="font-bold text-emerald-400 font-mono">16% of deep work</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '16%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
