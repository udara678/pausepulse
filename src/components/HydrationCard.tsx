import React, { useState } from 'react';
import { Droplets, Plus, GlassWater } from 'lucide-react';
import { AppTheme } from '../types';

interface HydrationCardProps {
  currentMl: number;
  targetMl: number;
  theme: AppTheme;
  onAddWater: (amountMl: number) => void;
}

export const HydrationCard: React.FC<HydrationCardProps> = ({ currentMl, targetMl, theme, onAddWater }) => {
  const [customMl, setCustomMl] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  const isDark = theme === 'dark';
  const percentage = Math.min(100, Math.round((currentMl / targetMl) * 100));

  const handleCustomAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customMl, 10);
    if (!isNaN(val) && val > 0) {
      onAddWater(val);
      setCustomMl('');
      setShowCustomInput(false);
    }
  };

  return (
    <div
      className={`border rounded-2xl p-4 shadow-lg relative overflow-hidden group backdrop-blur-md transition-all duration-300 ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200/80 shadow-slate-200/50 text-slate-900'
      }`}
    >
      {/* Dynamic Cyan Glow */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-cyan-500/15 rounded-full blur-2xl group-hover:bg-cyan-500/25 transition-all duration-500 pointer-events-none" />

      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-500 shadow-md shadow-cyan-500/10">
            <Droplets className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs font-bold flex items-center gap-1.5">
              <span className={isDark ? 'text-slate-100' : 'text-slate-900 font-extrabold'}>Hydration Tracker</span>
              {percentage >= 100 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-bold border border-emerald-500/30">
                  Goal Met! 💧
                </span>
              )}
            </h2>
            <p className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Target: {targetMl} ml per day</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-base font-black text-cyan-600 dark:text-cyan-400 font-mono tracking-tight">{currentMl}</span>
          <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}> / {targetMl} ml</span>
        </div>
      </div>

      {/* Animated Progress Bar */}
      <div
        className={`w-full h-3 rounded-full overflow-hidden mb-3 border p-0.5 relative z-10 ${
          isDark ? 'bg-slate-950 border-slate-800/80' : 'bg-slate-100 border-slate-200'
        }`}
      >
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-500 rounded-full transition-all duration-500 shadow-md shadow-cyan-500/40 relative"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="relative z-10 space-y-2">
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-bold flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <GlassWater className="w-3.5 h-3.5 text-cyan-500" />
            <span>Quick Log Water:</span>
          </span>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => onAddWater(100)}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              +100ml
            </button>
            <button
              type="button"
              onClick={() => onAddWater(250)}
              className="px-3 py-1 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 border border-cyan-400 text-xs font-extrabold shadow-md shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
            >
              +250ml
            </button>
            <button
              type="button"
              onClick={() => onAddWater(500)}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              +500ml
            </button>
            <button
              type="button"
              onClick={() => setShowCustomInput(!showCustomInput)}
              className={`p-1 rounded-lg border transition-all active:scale-95 cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
              title="Add Custom Amount"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Custom Input Drawer */}
        {showCustomInput && (
          <form onSubmit={handleCustomAdd} className="flex items-center space-x-2 pt-1.5 animate-in fade-in duration-200">
            <input
              type="number"
              placeholder="Custom ml (e.g. 350)"
              value={customMl}
              onChange={(e) => setCustomMl(e.target.value)}
              className={`flex-1 border rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:border-cyan-400 ${
                isDark ? 'bg-slate-950 border-cyan-500/40 text-white' : 'bg-slate-50 border-cyan-500/50 text-slate-900'
              }`}
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold rounded-lg transition-colors cursor-pointer"
            >
              Add
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
