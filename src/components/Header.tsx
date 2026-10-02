import React from 'react';
import { Flame, Sparkles, Minus, X, Settings as SettingsIcon, Sun, Moon } from 'lucide-react';
import { AppTheme } from '../types';

interface HeaderProps {
  points: number;
  streakDays: number;
  theme: AppTheme;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  points,
  streakDays,
  theme,
  onToggleTheme,
  onOpenSettings,
}) => {
  const isDark = theme === 'dark';

  const handleMinimize = () => {
    window.electronAPI?.hideWindow();
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  return (
    <header
      className={`flex items-center justify-between px-4 py-3 border-b drag-region transition-colors duration-300 ${
        isDark
          ? 'bg-slate-950/80 border-slate-800/80 backdrop-blur text-white'
          : 'bg-white border-slate-200 backdrop-blur shadow-sm text-slate-900'
      }`}
    >
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
          <div
            className={`w-full h-full rounded-[10px] flex items-center justify-center ${
              isDark ? 'bg-slate-950' : 'bg-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-500" />
          </div>
        </div>
        <div>
          <h1
            className={`font-extrabold text-sm tracking-tight flex items-center gap-1.5 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            PAUSEPULSE{' '}
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 font-bold border border-indigo-500/30">
              PRO
            </span>
          </h1>
          <p className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Work-Rest Pacing
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-1.5 no-drag">
        {/* Streak Pill */}
        <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-bold">
          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
          <span>{streakDays}d</span>
        </div>

        {/* Points Pill */}
        <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>{points} pts</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={onToggleTheme}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            isDark
              ? 'text-amber-400 hover:bg-slate-800'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
            isDark
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="PausePulse Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>

        {/* Window controls */}
        <div className="flex items-center space-x-1 ml-0.5">
          <button
            type="button"
            onClick={handleMinimize}
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-200'
            }`}
            title="Minimize to Tray"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-md text-slate-400 hover:bg-red-500/20 hover:text-red-500 transition-colors cursor-pointer"
            title="Close Window"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
