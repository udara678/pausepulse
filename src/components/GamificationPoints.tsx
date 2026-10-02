import React from 'react';
import { Trophy, ShieldCheck, HeartPulse, Award } from 'lucide-react';
import { AppTheme } from '../types';

interface GamificationPointsProps {
  points: number;
  breaksCompleted: number;
  activeMinutes: number;
  theme: AppTheme;
}

export const GamificationPoints: React.FC<GamificationPointsProps> = ({
  points,
  breaksCompleted,
  activeMinutes,
  theme,
}) => {
  const isDark = theme === 'dark';

  const getLevel = (pts: number) => {
    if (pts < 200) return { name: 'Health Novice', level: 1, color: isDark ? 'text-slate-400' : 'text-slate-600' };
    if (pts < 500) return { name: 'Pacing Pro', level: 2, color: 'text-cyan-500' };
    if (pts < 1000) return { name: 'Ergo Master', level: 3, color: 'text-emerald-500' };
    return { name: 'Wellness Legend', level: 4, color: 'text-amber-500' };
  };

  const levelInfo = getLevel(points);

  return (
    <div
      className={`border rounded-2xl p-4 shadow-lg transition-all duration-300 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80 shadow-slate-200/50'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h2 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Daily Health Level</h2>
        </div>
        <span
          className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          } ${levelInfo.color}`}
        >
          Lvl {levelInfo.level}: {levelInfo.name}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div
          className={`p-2.5 rounded-xl border ${
            isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
          <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{breaksCompleted}</div>
          <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Breaks Done</div>
        </div>

        <div
          className={`p-2.5 rounded-xl border ${
            isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <HeartPulse className="w-4 h-4 text-cyan-500 mx-auto mb-1" />
          <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeMinutes}m</div>
          <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Focus Time</div>
        </div>

        <div
          className={`p-2.5 rounded-xl border ${
            isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <Award className="w-4 h-4 text-amber-500 mx-auto mb-1" />
          <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{points}</div>
          <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Points</div>
        </div>
      </div>
    </div>
  );
};
