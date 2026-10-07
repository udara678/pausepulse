import React from 'react';
import { Timer, Play, Pause, RotateCcw, Check, Lock, Sparkles, Heart, Utensils } from 'lucide-react';
import { AppTheme, TimerMode } from '../types';

interface BreakTimerCardProps {
  timeLeftSeconds: number;
  isRunning: boolean;
  mode: TimerMode;
  theme: AppTheme;
  lunchBreakMins: number;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onCompleteBreak: () => void;
  onOpenBreakActivities: () => void;
  onStartLunchBreak: () => void;
}

export const BreakTimerCard: React.FC<BreakTimerCardProps> = ({
  timeLeftSeconds,
  isRunning,
  mode,
  theme,
  lunchBreakMins,
  onToggleTimer,
  onResetTimer,
  onCompleteBreak,
  onOpenBreakActivities,
  onStartLunchBreak,
}) => {
  const isDark = theme === 'dark';
  const isBreak = mode === 'BREAK';
  const isLunch = mode === 'LUNCH';

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`border rounded-2xl p-4 shadow-lg relative overflow-hidden group backdrop-blur-md transition-all duration-300 ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 shadow-slate-200/50 text-slate-900'
      }`}
    >
      {/* Background Glow */}
      <div
        className={`absolute -left-8 -top-8 w-36 h-36 rounded-full blur-2xl transition-all duration-500 pointer-events-none ${
          isLunch
            ? 'bg-amber-500/20'
            : isBreak
            ? 'bg-emerald-500/20'
            : 'bg-indigo-500/15 group-hover:bg-indigo-500/25'
        }`}
      />

      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
              isLunch
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-500 shadow-md shadow-amber-500/20'
                : isBreak
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-500 shadow-md shadow-emerald-500/20'
                : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-500 shadow-md shadow-indigo-500/10'
            }`}
          >
            {isLunch ? (
              <Utensils className="w-5 h-5 animate-bounce" />
            ) : (
              <Timer className={`w-5 h-5 ${isRunning ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            )}
          </div>
          <div>
            <h2 className="text-xs font-bold flex items-center gap-1.5">
              {isLunch ? (
                <span className="text-amber-600 font-extrabold flex items-center gap-1 animate-pulse">
                  <Utensils className="w-3.5 h-3.5" /> Lunch Break ({lunchBreakMins}m)
                </span>
              ) : isBreak ? (
                <span className="text-emerald-600 font-extrabold flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" /> Active Break Session
                </span>
              ) : (
                <span className={isDark ? 'text-slate-100' : 'text-slate-900 font-extrabold'}>Focus Session</span>
              )}
            </h2>
            <p className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {isLunch
                ? 'Enjoy your meal & rest! Work alerts paused'
                : isBreak
                ? 'Break counting down - step away now!'
                : 'Focus timer active. Rest unlocked when done'}
            </p>
          </div>
        </div>

        <span
          className={`text-2xl font-black tracking-tight font-mono px-3.5 py-1 rounded-xl border shadow-inner ${
            isLunch
              ? 'bg-amber-950/90 text-amber-400 border-amber-500/40 shadow-amber-500/20'
              : isBreak
              ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/40 shadow-emerald-500/20'
              : isDark
              ? 'bg-slate-950 text-white border-slate-800'
              : 'bg-slate-100 text-slate-900 border-slate-300 font-black'
          }`}
        >
          {formatTime(timeLeftSeconds)}
        </span>
      </div>

      {/* Break Activities Banner Button */}
      {isBreak && (
        <div className="mb-2.5 relative z-10">
          <button
            type="button"
            onClick={onOpenBreakActivities}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 font-bold hover:text-emerald-700 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center space-x-1.5">
              <Heart className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span className="text-xs font-extrabold">3-Phase Breathing & Stress Game</span>
            </div>
            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
              +30 Bonus Pts
            </span>
          </button>
        </div>
      )}

      <div className="flex items-center justify-between pt-1 relative z-10">
        {/* Play/Pause & Reset controls */}
        <div className="flex space-x-1.5">
          <button
            type="button"
            onClick={onToggleTimer}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 border cursor-pointer ${
              isRunning
                ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500 shadow-md shadow-indigo-500/20'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? 'Pause' : isLunch ? 'Resume Meal' : isBreak ? 'Resume Break' : 'Start Focus'}</span>
          </button>

          <button
            type="button"
            onClick={onResetTimer}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
            }`}
            title="Reset Session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Start Dedicated Lunch Break Button */}
          {!isLunch && (
            <button
              type="button"
              onClick={onStartLunchBreak}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                isDark
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 shadow-sm'
              }`}
              title={`Start dedicated ${lunchBreakMins}-min lunch break`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Lunch ({lunchBreakMins}m)</span>
            </button>
          )}
        </div>

        {/* Lock Rules */}
        {!isLunch && (
          <button
            type="button"
            onClick={onCompleteBreak}
            disabled={!isBreak}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 border ${
              isBreak
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white border-emerald-400 shadow-md shadow-emerald-500/30 animate-bounce cursor-pointer'
                : isDark
                ? 'bg-slate-950/60 text-slate-500 border-slate-800 cursor-not-allowed opacity-60'
                : 'bg-slate-100 text-slate-500 border-slate-300 cursor-not-allowed opacity-70'
            }`}
            title={!isBreak ? 'Unlocked automatically when Focus timer reaches 0:00' : 'Claim +50 points for break'}
          >
            {!isBreak ? (
              <>
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Locked</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Took Break (+50 pts)</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
