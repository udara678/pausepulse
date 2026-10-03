import React from 'react';
import { X, Sparkles, Check, Crown, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import { AppTheme, UserPlan } from '../types';

interface UpgradeModalProps {
  isOpen: boolean;
  theme: AppTheme;
  currentPlan: UserPlan;
  targetFeature?: string;
  onClose: () => void;
  onSelectPlan: (plan: UserPlan) => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  theme,
  currentPlan,
  targetFeature,
  onClose,
  onSelectPlan,
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border space-y-5 relative ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-5 right-5 p-1.5 rounded-xl border transition-colors cursor-pointer ${
            isDark ? 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-100'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 mb-2">
            <Crown className="w-6 h-6 text-amber-400 fill-amber-400" />
          </div>
          <h2 className="text-lg font-black tracking-tight flex items-center justify-center gap-2">
            <span>Upgrade PausePulse</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Premium Tier
            </span>
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {targetFeature
              ? `"${targetFeature}" is available on Pro or Team plans.`
              : 'Unlock full ergonomic health tools, 7-day analytics, and team HR portals.'}
          </p>
        </div>

        {/* 2 Plan Cards (Pro Monthly vs Pro Yearly / Team) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {/* Pro Monthly */}
          <div
            className={`p-4 rounded-2xl border relative flex flex-col justify-between transition-all ${
              currentPlan === 'pro'
                ? 'border-indigo-500 bg-indigo-500/10'
                : isDark
                ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Individual</span>
                <div className="text-base font-extrabold text-white">Pro Monthly</div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-indigo-400 font-mono">$4.99</span>
                  <span className="text-xs text-slate-400">/month</span>
                </div>
              </div>

              <ul className="text-xs space-y-1.5 text-slate-300">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Full Mood Coach (all 6 moods)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Personal 7-Day Analytics</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>All 4 Gamification Tiers</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Bubble Pop Stress Game</span>
                </li>
              </ul>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  onSelectPlan('pro');
                  onClose();
                }}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentPlan === 'pro'
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/25 active:scale-95'
                }`}
              >
                {currentPlan === 'pro' ? 'Current Plan' : 'Switch to Pro ($4.99)'}
              </button>
            </div>
          </div>

          {/* Pro Yearly / Team (Best Value) */}
          <div
            className={`p-4 rounded-2xl border relative flex flex-col justify-between transition-all ${
              currentPlan === 'team'
                ? 'border-amber-500 bg-amber-500/10'
                : isDark
                ? 'bg-gradient-to-b from-indigo-950/40 to-slate-950 border-indigo-500/40'
                : 'bg-gradient-to-b from-indigo-50 to-white border-indigo-300 shadow-sm'
            }`}
          >
            <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              Best Value • Save 35%
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Team & Enterprise</span>
                <div className="text-base font-extrabold text-white">Pro Yearly & Team</div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-amber-400 font-mono">$39</span>
                  <span className="text-xs text-slate-400">/year</span>
                </div>
              </div>

              <ul className="text-xs space-y-1.5 text-slate-300">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-semibold text-white">Everything in Pro Monthly</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>HR Corporate Portal & Seats</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Company Wellness Metrics</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Export CSV / Reports</span>
                </li>
              </ul>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  onSelectPlan('team');
                  onClose();
                }}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentPlan === 'team'
                    ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                    : 'bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-md shadow-indigo-500/25 active:scale-95'
                }`}
              >
                {currentPlan === 'team' ? 'Current Plan' : 'Switch to Team ($39)'}
              </button>
            </div>
          </div>
        </div>

        {/* Demo / Portfolio Tier Simulator Footer */}
        <div
          className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
            isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-white">Portfolio Plan Simulator:</span>
          </div>

          <div className="flex items-center space-x-1.5">
            {(['trial', 'pro', 'team'] as UserPlan[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  onSelectPlan(p);
                  onClose();
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer ${
                  currentPlan === p
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isDark
                    ? 'bg-slate-800 text-slate-400 hover:text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
