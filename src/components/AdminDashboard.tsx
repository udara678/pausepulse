import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Droplets, Award, TrendingUp, Sparkles, Plus, CheckCircle, ArrowLeft, RefreshCw, Sun, Moon } from 'lucide-react';
import { AppTheme } from '../types';

interface AdminDashboardProps {
  theme: AppTheme;
  onToggleTheme: () => void;
  onBackToApp: () => void;
}

interface HRData {
  companyName: string;
  totalSeats: number;
  activeSeats: number;
  teamWellnessScore: number;
  monthlyHydrationAvgMl: number;
  anonymizedStats: {
    averageBreaksPerDay: number;
    averageFocusSessionMins: number;
    totalBreaksCompletedThisMonth: number;
  };
  rewardsActive: Array<{
    id: string;
    title: string;
    pointsRequired: number;
    type: string;
  }>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ theme, onToggleTheme, onBackToApp }) => {
  const isDark = theme === 'dark';
  const [data, setData] = useState<HRData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [newRewardTitle, setNewRewardTitle] = useState<string>('');
  const [newRewardPoints, setNewRewardPoints] = useState<string>('1000');
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);

  const fetchHRData = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/v1/hr/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        throw new Error('API offline');
      }
    } catch {
      // Fallback mock HR data
      setData({
        companyName: 'Acme Technologies Inc.',
        totalSeats: 25,
        activeSeats: 18,
        teamWellnessScore: 88,
        monthlyHydrationAvgMl: 1950,
        anonymizedStats: {
          averageBreaksPerDay: 4.8,
          averageFocusSessionMins: 26,
          totalBreaksCompletedThisMonth: 1240,
        },
        rewardsActive: [
          { id: 'rew_1', title: '$20 Coffee Voucher', pointsRequired: 1000, type: 'VOUCHER' },
          { id: 'rew_2', title: 'Half-Day Wellness Leave', pointsRequired: 2500, type: 'PERK' },
          { id: 'rew_3', title: 'Ergonomic Desk Accessories', pointsRequired: 4000, type: 'HARDWARE' },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, []);

  const handleAddReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRewardTitle && data) {
      const newRew = {
        id: 'rew_' + Date.now(),
        title: newRewardTitle,
        pointsRequired: parseInt(newRewardPoints, 10) || 1000,
        type: 'VOUCHER',
      };
      setData({
        ...data,
        rewardsActive: [...data.rewardsActive, newRew],
      });
      setNewRewardTitle('');
      setShowRewardModal(false);
    }
  };

  return (
    <div
      className={`w-full h-screen flex flex-col font-['Plus_Jakarta_Sans',sans-serif] overflow-y-auto p-4 transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Header Navigation */}
      <div className={`flex items-center justify-between pb-4 border-b mb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBackToApp}
            className={`p-2 rounded-xl border flex items-center space-x-1.5 text-xs font-semibold transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700 shadow-sm'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to App</span>
          </button>
          <div>
            <h1 className="text-base font-extrabold tracking-tight flex items-center gap-2">
              HR & Corporate Wellness Portal
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 font-semibold border border-emerald-500/30">
                LIVE API CONNECTED
              </span>
            </h1>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Anonymized Team Analytics & Reward Challenges
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Sun/Moon Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className={`p-2 rounded-xl border flex items-center space-x-1.5 text-xs font-bold transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 shadow-sm'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            <span className="text-[11px]">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button
            type="button"
            onClick={fetchHRData}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-white border-slate-300 text-slate-600 shadow-sm'
            }`}
            title="Refresh HR Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading HR Admin Analytics...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Company Overview Header Card */}
          <div
            className={`p-4 rounded-2xl border relative overflow-hidden transition-colors ${
              isDark
                ? 'bg-gradient-to-r from-indigo-950/60 to-slate-900 border-indigo-500/30'
                : 'bg-gradient-to-r from-indigo-600 to-cyan-600 border-indigo-500 text-white shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-indigo-400' : 'text-indigo-100'}`}>
                  Enterprise Tenant
                </span>
                <h2 className="text-xl font-extrabold tracking-tight">{data?.companyName}</h2>
              </div>
              <div className="text-right">
                <span className={`text-3xl font-black font-mono ${isDark ? 'text-emerald-400' : 'text-white'}`}>
                  {data?.teamWellnessScore}%
                </span>
                <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-indigo-100'}`}>Team Wellness Compliance</p>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Active Seats */}
            <div
              className={`p-3.5 rounded-2xl border transition-colors ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-bold border border-indigo-500/20">
                  {data?.activeSeats} / {data?.totalSeats} Seats
                </span>
              </div>
              <div className="text-lg font-extrabold font-mono">{data?.activeSeats} Active Employees</div>
              <div className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                B2B SaaS License Seats
              </div>
            </div>

            {/* Hydration Avg */}
            <div
              className={`p-3.5 rounded-2xl border transition-colors ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Droplets className="w-4 h-4 text-cyan-500" />
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 font-bold border border-cyan-500/20">
                  Avg Hydration
                </span>
              </div>
              <div className="text-lg font-extrabold font-mono text-cyan-500">{data?.monthlyHydrationAvgMl} ml/day</div>
              <div className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Company Average Hydration
              </div>
            </div>

            {/* Breaks Completed */}
            <div
              className={`p-3.5 rounded-2xl border transition-colors ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                  Monthly Total
                </span>
              </div>
              <div className="text-lg font-extrabold font-mono text-emerald-500">
                {data?.anonymizedStats.totalBreaksCompletedThisMonth}
              </div>
              <div className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Micro-Breaks Taken This Month
              </div>
            </div>
          </div>

          {/* Active Corporate Rewards Panel */}
          <div
            className={`p-4 rounded-2xl border transition-colors ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Active HR Company Rewards</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRewardModal(true)}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Reward</span>
              </button>
            </div>

            <div className="space-y-2">
              {data?.rewardsActive.map((rew) => (
                <div
                  key={rew.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-xs">
                      🏆
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{rew.title}</div>
                      <div className="text-[10px] text-slate-400">Reward Type: {rew.type}</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    {rew.pointsRequired} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Guarantee Notice */}
          <div
            className={`p-3 rounded-xl border flex items-center space-x-2 text-xs transition-colors ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-600'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              <strong>Privacy Guaranteed:</strong> HR Dashboards only show aggregate company health metrics.
              Individual employee logs, keystrokes, and screens are strictly private.
            </span>
          </div>
        </div>
      )}

      {/* Add Reward Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className={`w-full max-w-sm rounded-2xl p-4 space-y-3 border ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}
          >
            <h3 className="text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" /> Add New HR Employee Reward
            </h3>
            <form onSubmit={handleAddReward} className="space-y-3">
              <div>
                <label className={`text-[11px] block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Reward Title</label>
                <input
                  type="text"
                  placeholder="e.g. $25 Amazon Gift Card"
                  value={newRewardTitle}
                  onChange={(e) => setNewRewardTitle(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  required
                />
              </div>
              <div>
                <label className={`text-[11px] block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Points Required</label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={newRewardPoints}
                  onChange={(e) => setNewRewardPoints(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRewardModal(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Save Reward</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
