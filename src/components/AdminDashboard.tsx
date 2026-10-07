import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Droplets,
  Award,
  TrendingUp,
  Sparkles,
  Plus,
  CheckCircle,
  ArrowLeft,
  RefreshCw,
  Sun,
  Moon,
  Pencil,
  Trash2,
  Lock,
  UserCheck,
  ShieldAlert,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { AppTheme, UserPlan } from '../types';

interface AdminDashboardProps {
  theme: AppTheme;
  userPlan?: UserPlan;
  onToggleTheme: () => void;
  onBackToApp: () => void;
  onUpgradeClick?: () => void;
}

export interface RewardItem {
  id: string;
  title: string;
  pointsRequired: number;
  type: string;
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
  rewardsActive: RewardItem[];
}

const REWARDS_CACHE_KEY = 'pausepulse_hr_rewards_cache';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  theme,
  userPlan = 'trial',
  onToggleTheme,
  onBackToApp,
  onUpgradeClick,
}) => {
  const isDark = theme === 'dark';
  const [data, setData] = useState<HRData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Role: HR_ADMIN can Add/Edit/Delete rewards; EMPLOYEE can only view rewards
  const [userRole, setUserRole] = useState<'HR_ADMIN' | 'EMPLOYEE'>('HR_ADMIN');

  // Reward Form States (for both Add and Edit)
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [editingReward, setEditingReward] = useState<RewardItem | null>(null);
  const [rewardTitle, setRewardTitle] = useState<string>('');
  const [rewardPoints, setRewardPoints] = useState<string>('1000');
  const [rewardType, setRewardType] = useState<string>('VOUCHER');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchHRData = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/v1/hr/dashboard');
      if (res.ok) {
        const json = await res.json();
        // Load custom cached rewards if any
        const cached = localStorage.getItem(REWARDS_CACHE_KEY);
        if (cached) {
          json.rewardsActive = JSON.parse(cached);
        }
        setData(json);
      } else {
        throw new Error('API offline');
      }
    } catch {
      // Fallback mock HR data
      const defaultRewards: RewardItem[] = [
        { id: 'rew_1', title: '$20 Coffee Voucher', pointsRequired: 1000, type: 'VOUCHER' },
        { id: 'rew_2', title: 'Half-Day Wellness Leave', pointsRequired: 2500, type: 'PERK' },
        { id: 'rew_3', title: 'Ergonomic Desk Accessories', pointsRequired: 4000, type: 'HARDWARE' },
      ];

      const cached = localStorage.getItem(REWARDS_CACHE_KEY);
      const rewardsToUse = cached ? JSON.parse(cached) : defaultRewards;

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
        rewardsActive: rewardsToUse,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, []);

  const saveRewardsToCache = (rewards: RewardItem[]) => {
    try {
      localStorage.setItem(REWARDS_CACHE_KEY, JSON.stringify(rewards));
    } catch {
      // Ignore
    }
  };

  // Open modal in Create mode
  const handleOpenAddModal = () => {
    if (userRole !== 'HR_ADMIN') {
      showToast('Permission denied: Only HR Administrators can add rewards.');
      return;
    }
    setEditingReward(null);
    setRewardTitle('');
    setRewardPoints('1000');
    setRewardType('VOUCHER');
    setShowRewardModal(true);
  };

  // Open modal in Edit mode
  const handleOpenEditModal = (reward: RewardItem) => {
    if (userRole !== 'HR_ADMIN') {
      showToast('Permission denied: Employees cannot edit company rewards.');
      return;
    }
    setEditingReward(reward);
    setRewardTitle(reward.title);
    setRewardPoints(reward.pointsRequired.toString());
    setRewardType(reward.type);
    setShowRewardModal(true);
  };

  // Delete Reward (HR only)
  const handleDeleteReward = (id: string, title: string) => {
    if (userRole !== 'HR_ADMIN') {
      showToast('Permission denied: Employees cannot delete company rewards.');
      return;
    }

    if (!data) return;

    const updated = data.rewardsActive.filter((r) => r.id !== id);
    setData({
      ...data,
      rewardsActive: updated,
    });
    saveRewardsToCache(updated);
    showToast(`Deleted reward: "${title}"`);
  };

  // Save Reward (Handles both Add and Edit)
  const handleSaveReward = (e: React.FormEvent) => {
    e.preventDefault();

    if (userRole !== 'HR_ADMIN') {
      showToast('Permission denied: Employees cannot modify rewards.');
      return;
    }

    if (!rewardTitle.trim() || !data) return;

    const pts = parseInt(rewardPoints, 10) || 1000;

    let updatedList: RewardItem[];

    if (editingReward) {
      // Update existing reward
      updatedList = data.rewardsActive.map((r) =>
        r.id === editingReward.id
          ? { ...r, title: rewardTitle.trim(), pointsRequired: pts, type: rewardType }
          : r
      );
      showToast(`Updated reward: "${rewardTitle.trim()}"`);
    } else {
      // Add new reward
      const newRew: RewardItem = {
        id: 'rew_' + Date.now(),
        title: rewardTitle.trim(),
        pointsRequired: pts,
        type: rewardType,
      };
      updatedList = [...data.rewardsActive, newRew];
      showToast(`Added new reward: "${rewardTitle.trim()}"`);
    }

    setData({ ...data, rewardsActive: updatedList });
    saveRewardsToCache(updatedList);
    setShowRewardModal(false);
    setEditingReward(null);
  };

  const handleExportCSV = () => {
    if (userPlan && userPlan !== 'team') {
      showToast('Export CSV Reports is available on the Pro Yearly & Team Plan.');
      onUpgradeClick?.();
      return;
    }

    if (!data) return;

    // Generate CSV content
    const headers = 'Date,Company Name,Active Seats,Total Seats,Wellness Compliance,Avg Hydration (ml),Total Breaks This Month\n';
    const row = `${new Date().toISOString().split('T')[0]},"${data.companyName}",${data.activeSeats},${data.totalSeats},${data.teamWellnessScore}%,${data.monthlyHydrationAvgMl},${data.anonymizedStats.totalBreaksCompletedThisMonth}\n`;

    const blob = new Blob([headers + row], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pausepulse-wellness-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Downloaded pausepulse-wellness-report.csv! 📄');
  };

  return (
    <div
      className={`w-full flex flex-col font-['Inter',sans-serif] space-y-4 transition-colors duration-300 ${
        isDark ? 'text-slate-100' : 'text-slate-900'
      }`}
    >
      {/* ── Top Header Navigation ────────────────────── */}
      <div className={`flex flex-wrap items-center justify-between gap-3 pb-4 border-b mb-4 ${isDark ? 'border-purple-500/20' : 'border-purple-200'}`}>
        <div className="flex items-center space-x-3 min-w-0">
          <button
            type="button"
            onClick={onBackToApp}
            className={`p-2 rounded-xl border flex items-center space-x-1.5 text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              isDark
                ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-800 shadow-sm'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to App</span>
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-extrabold tracking-tight whitespace-nowrap truncate">
              HR & Corporate Wellness Portal
            </h1>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Anonymized Team Analytics & Reward Challenges
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 👑 Role Permission Switcher (HR Admin vs Employee View) */}
          <div className={`p-1 rounded-xl border flex space-x-1 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-200 border-slate-300'}`}>
            <button
              type="button"
              onClick={() => {
                setUserRole('HR_ADMIN');
                showToast('Switched to HR Administrator Mode — Full Edit Access');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                userRole === 'HR_ADMIN'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="HR Admin: Can add, edit, and delete company rewards"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>HR Admin</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setUserRole('EMPLOYEE');
                showToast('Switched to Employee View — Read-Only Mode');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                userRole === 'EMPLOYEE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Employee: Can view rewards only, cannot edit or delete"
            >
              <Lock className="w-3 h-3" />
              <span>Employee View</span>
            </button>
          </div>

          {/* Export CSV Report Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className={`p-2 rounded-xl border flex items-center space-x-1.5 text-xs font-bold transition-all cursor-pointer ${
              userPlan === 'team'
                ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30'
                : isDark
                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm'
            }`}
            title={userPlan === 'team' ? 'Export CSV Wellness Report' : 'Export CSV (Team Plan Feature)'}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
            {userPlan && userPlan !== 'team' && (
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 font-bold ml-1">
                🔒 Team
              </span>
            )}
          </button>

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

      {/* Floating Toast Message */}
      {toastMessage && (
        <div className="mb-3 p-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg animate-in slide-in-from-top duration-200">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

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
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                    {userRole === 'HR_ADMIN' ? '👑 Logged in as HR Administrator' : '👤 Logged in as Employee (Read-Only)'}
                  </span>
                </div>
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
                <h3 className="text-xs font-bold uppercase tracking-wider">Company Rewards & Wellness Perks</h3>
              </div>

              {/* Add Reward Button — HR Only */}
              {userRole === 'HR_ADMIN' ? (
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Reward</span>
                </button>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>HR Managed Only</span>
                </span>
              )}
            </div>

            {/* Employee Banner Notice */}
            {userRole === 'EMPLOYEE' && (
              <div className="mb-3 p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  <strong>Employee Notice:</strong> You are viewing active company perks in read-only mode.
                  Complete breaks and hit hydration targets to earn points towards these perks!
                </span>
              </div>
            )}

            {/* Rewards Cards List */}
            <div className="space-y-2">
              {data?.rewardsActive.map((rew) => (
                <div
                  key={rew.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isDark ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-sm">
                      {rew.type === 'VOUCHER' ? '🎟️' : rew.type === 'PERK' ? '🏖️' : rew.type === 'HARDWARE' ? '🖥️' : '🏆'}
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{rew.title}</div>
                      <div className="text-[10px] text-slate-400">Type: {rew.type}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                      {rew.pointsRequired} pts
                    </span>

                    {/* Edit and Delete Buttons — ONLY VISIBLE AND ACCESSIBLE TO HR_ADMIN */}
                    {userRole === 'HR_ADMIN' && (
                      <div className="flex items-center space-x-1 pl-2 border-l border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(rew)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isDark
                              ? 'bg-slate-900 border-slate-800 hover:bg-indigo-600 hover:text-white text-slate-400'
                              : 'bg-white border-slate-300 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600'
                          }`}
                          title={`Edit "${rew.title}"`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReward(rew.id, rew.title)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isDark
                              ? 'bg-slate-900 border-slate-800 hover:bg-rose-600 hover:text-white text-slate-400'
                              : 'bg-white border-slate-300 hover:bg-rose-50 hover:text-rose-600 text-slate-600'
                          }`}
                          title={`Delete "${rew.title}"`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
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

      {/* Add / Edit Reward Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className={`w-full max-w-sm rounded-2xl p-5 space-y-4 border ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{editingReward ? 'Edit HR Company Reward' : 'Add New HR Company Reward'}</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">
                HR Admin
              </span>
            </div>

            <form onSubmit={handleSaveReward} className="space-y-3">
              <div>
                <label className={`text-[11px] font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Reward Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. $25 Amazon Gift Card"
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className={`text-[11px] font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Points Required
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={rewardPoints}
                  onChange={(e) => setRewardPoints(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-mono ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`text-[11px] font-semibold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Reward Category / Type
                </label>
                <select
                  value={rewardType}
                  onChange={(e) => setRewardType(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="VOUCHER">🎟️ Voucher / Gift Card</option>
                  <option value="PERK">🏖️ Wellness Leave / Day Off</option>
                  <option value="HARDWARE">🖥️ Ergonomic Equipment / Desk</option>
                  <option value="BADGE">🏆 Recognition & Badge</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowRewardModal(false);
                    setEditingReward(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                    isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer shadow-md shadow-indigo-500/20 active:scale-95"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{editingReward ? 'Update Reward' : 'Save Reward'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
