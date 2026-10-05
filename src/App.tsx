import React, { useState, useEffect } from 'react';
import {
  Clock,
  Droplets,
  Smile,
  Heart,
  Gamepad2,
  Trophy,
  BarChart3,
  Sliders,
  Sun,
  Moon,
  Bell,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Bookmark,
  X,
  Target,
  Sparkles,
  Zap,
  Crown,
  Lock,
  ArrowUpRight,
  ShieldAlert,
  Download,
} from 'lucide-react';
import { UserStats, Settings, TimerMode, AppTheme, UserPlan, PLAN_LIMITS } from './types';
import { soundEngine } from './utils/audio';
import { SettingsModal } from './components/SettingsModal';
import { FocusCheckpointModal } from './components/FocusCheckpointModal';
import { HydrationCard } from './components/HydrationCard';
import { GamificationPoints } from './components/GamificationPoints';
import { AdminDashboard } from './components/AdminDashboard';
import { LicenseGate } from './components/LicenseGate';
import { UpgradeModal } from './components/UpgradeModal';
import { DetailedAnalytics } from './components/DetailedAnalytics';

const TRIAL_STARTED_KEY = 'pausepulse_trial_started';
const LICENSE_KEY_STORE = 'pausepulse_license';
const USER_PLAN_STORE = 'pausepulse_user_plan';

const DEFAULT_SETTINGS: Settings = {
  hydrationIntervalMins: 60,
  breakIntervalMins: 25,
  breakDurationMins: 3,
  lunchBreakMins: 45,
  eyeRestIntervalMins: 20,
  soundEnabled: true,
  strictMode: false,
  autoMuteInMeetings: true,
  waterTargetMl: 2000,
  selectedTone: 'chime',
  theme: 'dark',
};

type ActiveNavTab = 'TIMER' | 'HYDRATION' | 'MOOD' | 'BREATHING' | 'GAMES' | 'ANALYTICS' | 'ACHIEVEMENTS' | 'HR_PORTAL';

interface MoodOption {
  id: string;
  emoji: string;
  label: string;
  desc: string;
  recommended: string;
  durationSecs: number;
  proOnly?: boolean;
}

const MOOD_DATA: MoodOption[] = [
  { id: 'anxious', emoji: '😰', label: 'Anxious / Stressed', desc: 'High mental tension', recommended: '3-Phase Breathing (Inhale-Hold-Exhale)', durationSecs: 60, proOnly: false },
  { id: 'tired', emoji: '🥱', label: 'Physically Tired', desc: 'Heavy eyes & fatigue', recommended: '60s Ergonomic Neck & Shoulder Stretch', durationSecs: 60, proOnly: false },
  { id: 'blocked', emoji: '🤯', label: 'Mentally Blocked', desc: 'Stuck on problem', recommended: 'Look out window at a distant object for 2m', durationSecs: 120, proOnly: true },
  { id: 'isolated', emoji: '🤝', label: 'Isolated / Distant', desc: 'Solo deep work gap', recommended: 'Pantry tea break or chat with a colleague', durationSecs: 120, proOnly: true },
  { id: 'overloaded', emoji: '🌪️', label: 'Overwhelmed', desc: 'Too many tasks', recommended: 'Write top 1 tiny task and complete it first', durationSecs: 45, proOnly: true },
  { id: 'bored', emoji: '😴', label: 'Bored / Lethargic', desc: 'Low motivation', recommended: 'Quick Stress Buster Bubble mini-game', durationSecs: 30, proOnly: true },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('TIMER');
  const [licenseStatus, setLicenseStatus] = useState<'checking' | 'unlocked' | 'gate'>('checking');

  // Plan State (Trial, Pro, or Team)
  const [userPlan, setUserPlan] = useState<UserPlan>(() => {
    return (localStorage.getItem(USER_PLAN_STORE) as UserPlan) || 'trial';
  });

  // Upgrade Modal State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [upgradeTargetFeature, setUpgradeTargetFeature] = useState<string | undefined>(undefined);

  // Settings
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem('pausepulse_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCheckpointOpen, setIsCheckpointOpen] = useState<boolean>(false);
  const [showWelcomeBackBanner, setShowWelcomeBackBanner] = useState<boolean>(false);
  const [levelUpToast, setLevelUpToast] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState<UserStats>(() => {
    const cachedNote = localStorage.getItem('pausepulse_checkpoint_note') || undefined;
    return {
      points: 2340,
      streakDays: 12,
      waterIntakeMl: 1500,
      waterTargetMl: settings.waterTargetMl,
      breaksCompleted: 5,
      breaksTarget: 8,
      activeMinutes: 185,
      lastCheckpointNote: cachedNote,
    };
  });

  // Timer states
  const [mode, setMode] = useState<TimerMode>('FOCUS');
  const [timeLeft, setTimeLeft] = useState<number>(settings.breakIntervalMins * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [breakCompleted, setBreakCompleted] = useState<boolean>(false);
  const [breakClaimed, setBreakClaimed] = useState<boolean>(false);

  // Breathing Interactive state machine (3-Phase: 4s Inhale -> 4s Hold -> 4s Exhale)
  const [breathPhase, setBreathPhase] = useState<'INHALE' | 'HOLD' | 'EXHALE'>('INHALE');
  const [breathSecs, setBreathSecs] = useState<number>(4);
  const [breathCycles, setBreathCycles] = useState<number>(0);
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);

  // Bubble Game states
  const [bubbles, setBubbles] = useState<Array<{ id: number; popped: boolean; color: string }>>([]);
  const [gameScore, setGameScore] = useState<number>(0);

  // Guided Mood Timer states
  const [selectedMood, setSelectedMood] = useState<MoodOption>(MOOD_DATA[0]);
  const [guidedTimerSecs, setGuidedTimerSecs] = useState<number>(60);
  const [isGuidedRunning, setIsGuidedRunning] = useState<boolean>(false);
  const [guidedCompleted, setGuidedCompleted] = useState<boolean>(false);

  // One-time claim flags — reset when activity resets/restarts
  const [moodActivityClaimed, setMoodActivityClaimed] = useState<boolean>(false);
  const [breathSessionClaimed, setBreathSessionClaimed] = useState<boolean>(false);
  const [gameSessionClaimed, setGameSessionClaimed] = useState<boolean>(false);

  // Plan selection / upgrade handler
  const handleSelectPlan = (newPlan: UserPlan) => {
    setUserPlan(newPlan);
    try {
      localStorage.setItem(USER_PLAN_STORE, newPlan);
    } catch {
      // Ignore
    }
    setLevelUpToast(`Switched active plan to: ${newPlan.toUpperCase()}! 🚀`);
    setTimeout(() => setLevelUpToast(null), 3000);
  };

  const openUpgradeModal = (feature?: string) => {
    setUpgradeTargetFeature(feature);
    setIsUpgradeModalOpen(true);
  };

  // Check license / trial on startup
  useEffect(() => {
    const savedKey = localStorage.getItem(LICENSE_KEY_STORE);
    const trialStart = localStorage.getItem(TRIAL_STARTED_KEY);

    if (savedKey) {
      setLicenseStatus('unlocked');
      return;
    }

    if (trialStart) {
      const daysUsed = (Date.now() - new Date(trialStart).getTime()) / (1000 * 60 * 60 * 24);
      if (daysUsed < 7) {
        setLicenseStatus('unlocked');
        return;
      }
    }

    setLicenseStatus('unlocked'); // Default unlocked
  }, []);

  // Sync settings target
  useEffect(() => {
    setStats((prev) => ({ ...prev, waterTargetMl: settings.waterTargetMl }));
  }, [settings.waterTargetMl]);

  // Main countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (mode === 'FOCUS') {
        setIsCheckpointOpen(true);
        setIsRunning(false);
        if (settings.soundEnabled) {
          soundEngine.playTone(settings.selectedTone, settings.customSoundUrl);
        }
      } else if (mode === 'LUNCH') {
        startFocusSession();
        window.electronAPI?.sendNotification(
          'Lunch Break Finished! 🍱',
          'Hope you had a great meal! Welcome back to your focus session.'
        );
      } else if (mode === 'BREAK') {
        // Break complete — stop timer, unlock Claim button
        setIsRunning(false);
        setBreakCompleted(true);
        if (settings.soundEnabled) soundEngine.playTone('zen');
        window.electronAPI?.sendNotification(
          'Break Complete! 🎉',
          'Great rest! Claim your +50 pts and return to focus when ready.'
        );
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, settings]);

  // 3-Phase Breathing Engine
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isBreathingActive && activeTab === 'BREATHING') {
      timer = setInterval(() => {
        setBreathSecs((prev) => {
          if (prev > 1) return prev - 1;

          if (breathPhase === 'INHALE') {
            setBreathPhase('HOLD');
            if (settings.soundEnabled) soundEngine.playTone('chime');
            return 4;
          } else if (breathPhase === 'HOLD') {
            setBreathPhase('EXHALE');
            if (settings.soundEnabled) soundEngine.playTone('chime');
            return 4;
          } else {
            setBreathPhase('INHALE');
            setBreathCycles((c) => c + 1);
            if (settings.soundEnabled) soundEngine.playTone('zen');
            return 4;
          }
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isBreathingActive, activeTab, breathPhase, settings.soundEnabled]);

  // Guided Mood Timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isGuidedRunning && guidedTimerSecs > 0) {
      timer = setInterval(() => setGuidedTimerSecs((s) => s - 1), 1000);
    } else if (guidedTimerSecs === 0 && isGuidedRunning) {
      setIsGuidedRunning(false);
      setGuidedCompleted(true);
      if (settings.soundEnabled) soundEngine.playTone('zen');
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isGuidedRunning, guidedTimerSecs, settings.soundEnabled]);

  // Initialize bubbles for bubble game
  useEffect(() => {
    resetBubbleGame();
  }, []);

  const resetBubbleGame = () => {
    const colors = ['bg-cyan-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
    setBubbles(
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        popped: false,
        color: colors[i % colors.length],
      }))
    );
    setGameScore(0);
  };

  const handlePopBubble = (id: number) => {
    setBubbles((prev) => prev.map((b) => (b.id === id ? { ...b, popped: true } : b)));
    setGameScore((s) => s + 10);
    if (settings.soundEnabled) soundEngine.playTone('splash');
  };

  const startBreakSession = () => {
    setIsCheckpointOpen(false);
    setMode('BREAK');
    setTimeLeft((settings.breakDurationMins || 3) * 60);
    setIsRunning(false); // paused — user must press Start Break
    setBreakCompleted(false);
    setBreakClaimed(false);
  };

  const startBreakTimer = () => {
    setIsRunning(true);
    window.electronAPI?.sendNotification(
      'Break Time Started! 🧘',
      `Take a ${settings.breakDurationMins || 3}-minute break now!`
    );
  };

  const handleStartLunchBreak = () => {
    setMode('LUNCH');
    setTimeLeft((settings.lunchBreakMins || 45) * 60);
    setIsRunning(false); // paused — user must press Start Lunch Break
  };

  const startLunchTimer = () => {
    setIsRunning(true);
    if (settings.soundEnabled) soundEngine.playTone('chime');
    window.electronAPI?.sendNotification(
      'Lunch Break Started 🍱',
      `Enjoy your ${settings.lunchBreakMins || 45}-minute meal break!`
    );
  };

  const startFocusSession = () => {
    setMode('FOCUS');
    setTimeLeft(settings.breakIntervalMins * 60);
    setIsRunning(false); // paused — user must press Start Focus
    if (stats.lastCheckpointNote) setShowWelcomeBackBanner(true);
  };

  const handleSaveCheckpoint = (note: string) => {
    setStats((prev) => ({
      ...prev,
      points: prev.points + 10,
      lastCheckpointNote: note,
    }));
    try {
      localStorage.setItem('pausepulse_checkpoint_note', note);
    } catch {
      // Ignore
    }
    startBreakSession();
  };

  const handleAddWater = (amountMl: number) => {
    if (settings.soundEnabled) soundEngine.playTone('splash');
    setStats((prev) => ({
      ...prev,
      waterIntakeMl: prev.waterIntakeMl + amountMl,
      points: prev.points + 20,
    }));
    window.electronAPI?.sendNotification(
      'Hydration Logged! 💧',
      `Awesome! Logged ${amountMl}ml of water (+20 points)`
    );
  };

  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('pausepulse_settings', JSON.stringify(newSettings));
    } catch {
      // Ignore
    }
    setMode('FOCUS');
    setTimeLeft(newSettings.breakIntervalMins * 60);
    setIsRunning(false); // paused after settings change
  };

  const handleToggleTheme = () => {
    const nextTheme: AppTheme = settings.theme === 'dark' ? 'light' : 'dark';
    const updated = { ...settings, theme: nextTheme };
    setSettings(updated);
    try {
      localStorage.setItem('pausepulse_settings', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleTriggerTestAlert = () => {
    if (settings.soundEnabled) soundEngine.playTone(settings.selectedTone, settings.customSoundUrl);
    window.electronAPI?.sendNotification(
      'PausePulse Alert Test 🎯',
      'Time to take a relaxing micro-break and drink water! 💧'
    );
  };

  const handleClaimBonus = (bonusPts: number, activityTitle: string, claimType?: 'mood' | 'breath' | 'game') => {
    setStats((prev) => ({ ...prev, points: prev.points + bonusPts }));
    setLevelUpToast(`Claimed +${bonusPts} pts for ${activityTitle}!`);
    setTimeout(() => setLevelUpToast(null), 3500);
    if (claimType === 'mood') setMoodActivityClaimed(true);
    if (claimType === 'breath') setBreathSessionClaimed(true);
    if (claimType === 'game') setGameSessionClaimed(true);
  };

  // Helper formatting
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Level info based on tier gating
  const getLevelInfo = (pts: number) => {
    if (pts < 500) return { name: 'Health Novice', level: 1, next: 500, percent: Math.round((pts / 500) * 100) };
    if (pts < 1500) return { name: 'Pacing Pro', level: 2, next: 1500, percent: Math.round((pts / 1500) * 100) };
    if (!PLAN_LIMITS[userPlan].allTiers) {
      // Capped at Level 2 for Free Trial
      return { name: 'Pacing Pro (Trial Max)', level: 2, next: 1500, percent: 100 };
    }
    if (pts < 3000) return { name: 'Pro Master', level: 3, next: 3000, percent: Math.round((pts / 3000) * 100) };
    return { name: 'Wellness Legend', level: 4, next: 5000, percent: 100 };
  };

  const levelInfo = getLevelInfo(stats.points);
  const totalDuration =
    mode === 'FOCUS'
      ? settings.breakIntervalMins * 60
      : mode === 'LUNCH'
      ? (settings.lunchBreakMins || 45) * 60
      : (settings.breakDurationMins || 3) * 60;

  // SVG circular timer circumference calculations (radius = 70, circumference = 2 * PI * 70 = 439.82)
  const circleRadius = 70;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (circumference * timeLeft) / Math.max(totalDuration, 1);

  const isDark = settings.theme === 'dark';

  // License gate
  if (licenseStatus === 'gate') {
    return (
      <LicenseGate
        theme={settings.theme}
        onActivated={(_plan) => setLicenseStatus('unlocked')}
        onTrial={() => {
          localStorage.setItem(TRIAL_STARTED_KEY, new Date().toISOString());
          setLicenseStatus('unlocked');
        }}
      />
    );
  }

  return (
    <div
      className={`w-full h-screen flex flex-col font-['Inter',sans-serif] overflow-hidden select-none transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* ═══════════════════════════════════════════════
           TOP TITLE BAR (Mac Traffic Lights + Search + Plan Pill + Controls)
         ═══════════════════════════════════════════════ */}
      <header
        className={`titlebar-drag h-12 flex-shrink-0 flex items-center justify-between px-4 border-b transition-colors ${
          isDark
            ? 'bg-slate-900/90 border-slate-800/80 backdrop-blur-md'
            : 'bg-white/95 border-slate-200/80 shadow-xs'
        }`}
      >
        {/* Left: Window Control Dots */}
        <div className="flex items-center space-x-2.5 titlebar-nodrag">
          <button
            type="button"
            onClick={() => window.electronAPI?.closeWindow?.() || window.electronAPI?.hideWindow?.()}
            className="w-3 h-3 rounded-full bg-rose-500/80 hover:bg-rose-500 transition-colors shadow-xs cursor-pointer"
            title="Close / Hide"
          />
          <button
            type="button"
            onClick={() => window.electronAPI?.minimizeWindow?.()}
            className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-colors shadow-xs cursor-pointer"
            title="Minimize"
          />
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors shadow-xs cursor-pointer"
            title="Play / Pause Timer"
          />

          <span className={`text-xs font-bold tracking-tight ml-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            PausePulse
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
            v2.1
          </span>
        </div>

        {/* Center: Search / Session Info Pill */}
        <div className="titlebar-drag hidden md:flex items-center">
          <div
            className={`px-4 py-1 rounded-full text-xs font-medium flex items-center space-x-2 border ${
              isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>
              {mode === 'FOCUS' ? 'Deep Work Session' : mode === 'LUNCH' ? 'Lunch Break' : 'Resting Break'} —{' '}
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Right: Plan Badge Pill + Focus Score + Actions */}
        <div className="flex items-center space-x-2 titlebar-nodrag">
          {/* Plan Badge Pill (Click to open Upgrade Modal / Simulator) */}
          <button
            type="button"
            onClick={() => openUpgradeModal()}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              userPlan === 'team'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25'
                : userPlan === 'pro'
                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/25'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
            }`}
            title="Click to view plan features or simulate tiers"
          >
            {userPlan === 'team' ? (
              <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ) : userPlan === 'pro' ? (
              <Zap className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="uppercase text-[10px] tracking-wider">
              {userPlan === 'team' ? 'Team Plan' : userPlan === 'pro' ? 'Pro Monthly' : 'Free Trial'}
            </span>
            <ArrowUpRight className="w-3 h-3 opacity-60" />
          </button>

          {/* Focus Score pill */}
          <div
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl border ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] text-slate-400 font-medium">Focus Score:</span>
            <span className="text-xs font-extrabold text-cyan-400">94/100</span>
          </div>

          {/* Test Sound */}
          <button
            type="button"
            onClick={handleTriggerTestAlert}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark ? 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Test Alert Chime"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={handleToggleTheme}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark ? 'border-slate-800 text-slate-400 hover:text-amber-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Toggle Dark / Light Theme"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark ? 'border-slate-800 text-slate-400 hover:text-indigo-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Open Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════
           MAIN BODY: Left Sidebar + Right Content Area
         ═══════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT SIDEBAR ────────────────────────────── */}
        <aside
          className={`w-60 flex-shrink-0 flex flex-col justify-between p-3.5 border-r transition-colors ${
            isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-100/80 border-slate-200'
          }`}
        >
          {/* Nav List */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
              <span>Dashboard</span>
              <span className="text-[9px] text-indigo-400 font-mono lowercase">
                {userPlan} tier
              </span>
            </div>

            {[
              { id: 'TIMER', icon: Clock, label: 'Focus Timer', badge: isRunning ? 'Live' : undefined },
              { id: 'HYDRATION', icon: Droplets, label: 'Hydration', badge: `${stats.waterIntakeMl}ml` },
              {
                id: 'MOOD',
                icon: Smile,
                label: 'Mood Coach',
                badge: PLAN_LIMITS[userPlan].fullMoodCoach ? '6 Moods' : '2 Basic',
              },
              { id: 'BREATHING', icon: Heart, label: 'Breathing', badge: '3-Phase' },
              {
                id: 'GAMES',
                icon: Gamepad2,
                label: 'Stress Buster',
                badge: PLAN_LIMITS[userPlan].bubbleGame ? 'Mini Game' : '🔒 Pro',
              },
              {
                id: 'ANALYTICS',
                icon: BarChart3,
                label: 'Personal Analytics',
                badge: PLAN_LIMITS[userPlan].detailedAnalytics ? '7-Day' : '🔒 Pro',
              },
              { id: 'ACHIEVEMENTS', icon: Trophy, label: 'Achievements', badge: `${stats.points} pts` },
              {
                id: 'HR_PORTAL',
                icon: Crown,
                label: 'Corporate HR',
                badge: PLAN_LIMITS[userPlan].hrDashboard ? 'Team' : '🔒 Team',
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as ActiveNavTab)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/25 font-bold'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : tab.badge.includes('🔒')
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                          : isDark
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Card: Your Level Card (Exact match to Mockup!) */}
          <div className="space-y-2 pt-3 border-t border-slate-800/50">
            <div
              className={`p-3 rounded-2xl border transition-all ${
                isDark
                  ? 'bg-gradient-to-br from-indigo-950/40 to-cyan-950/30 border-indigo-500/30 shadow-sm'
                  : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1">
                <span>Your Level</span>
                {!PLAN_LIMITS[userPlan].allTiers && (
                  <span className="text-[9px] text-amber-400 font-bold">Trial Cap Lvl 2</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-black text-indigo-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-indigo-400" />
                  <span>{levelInfo.name}</span>
                </div>
                <div className="text-xs font-extrabold text-cyan-400 font-mono">
                  {stats.points.toLocaleString()} pts
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-700"
                  style={{ width: `${levelInfo.percent}%` }}
                />
              </div>
            </div>

            {/* Floating Level Up Toast Notification */}
            {levelUpToast && (
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 animate-in slide-in-from-bottom duration-300">
                <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{levelUpToast}</span>
              </div>
            )}
          </div>
        </aside>

        {/* ── RIGHT MAIN VIEW ─────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6 transition-colors">
          {/* TAB 1: FOCUS TIMER */}
          {activeTab === 'TIMER' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Header Row */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {mode === 'FOCUS' ? 'Focus Session' : mode === 'LUNCH' ? 'Lunch Break' : 'Resting Break'}
                  </h1>
                  <p className="text-xs text-slate-400">
                    {mode === 'FOCUS'
                      ? 'Deep work mode active — eliminate distractions'
                      : mode === 'LUNCH'
                      ? 'Step away for a nourishing meal'
                      : 'Rest your eyes and stretch your body'}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{isRunning ? 'Active' : 'Paused'}</span>
                  </div>

                  {/* Mode Selector Buttons */}
                  <div className={`p-1 rounded-xl border flex space-x-1 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-200 border-slate-300'}`}>
                    <button
                      type="button"
                      onClick={startFocusSession}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        mode === 'FOCUS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Focus
                    </button>
                    <button
                      type="button"
                      onClick={startBreakSession}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        mode === 'BREAK' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Break
                    </button>
                    <button
                      type="button"
                      onClick={handleStartLunchBreak}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        mode === 'LUNCH' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🍱 Lunch
                    </button>
                  </div>
                </div>
              </div>

              {/* Welcome Back Checkpoint Banner */}
              {showWelcomeBackBanner && stats.lastCheckpointNote && (
                <div
                  className={`p-3 rounded-2xl border flex items-center justify-between shadow-md transition-all ${
                    isDark ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-200' : 'bg-indigo-50 border-indigo-300 text-indigo-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Bookmark className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                        Welcome Back Note:
                      </span>
                      <p className="text-xs font-semibold text-white">"{stats.lastCheckpointNote}"</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowWelcomeBackBanner(false)}
                    className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* ── CENTER SVG CIRCULAR COUNTDOWN TIMER ───────── */}
              <div className="flex flex-col items-center justify-center py-6">
                <div className="relative inline-flex items-center justify-center mb-6">
                  <svg width="220" height="220" viewBox="0 0 160 160" className="transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r={circleRadius}
                      fill="none"
                      stroke={isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.2)'}
                      strokeWidth="8"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r={circleRadius}
                      fill="none"
                      stroke="url(#timerGrad)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-1000 ease-linear"
                    />
                    <defs>
                      <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#22d3ee" />
                      </linearGradient>
                    </defs>
                  </svg>

                  <div className="absolute text-center">
                    <div className={`text-4xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {formatTime(timeLeft)}
                    </div>
                    <div className="text-xs text-slate-400 font-semibold tracking-wider uppercase mt-1">
                      {mode === 'FOCUS'
                        ? 'remaining'
                        : mode === 'LUNCH'
                        ? 'lunch remaining'
                        : breakCompleted
                        ? '✅ break complete!'
                        : !isRunning
                        ? '▶ press start break'
                        : 'break remaining'}
                    </div>
                  </div>
                </div>

                {/* Main Action Controls */}
                <div className="flex items-center space-x-3 flex-wrap gap-y-2">

                  {/* ── FOCUS: Start button when not yet running ── */}
                  {mode === 'FOCUS' && !isRunning && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsRunning(true);
                        if (settings.soundEnabled) soundEngine.playTone(settings.selectedTone, settings.customSoundUrl);
                        window.electronAPI?.sendNotification('Focus Session Started! ⚡', 'Deep work mode active. Stay focused!');
                      }}
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center space-x-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start Focus ({settings.breakIntervalMins}m)</span>
                    </button>
                  )}

                  {/* ── FOCUS: Pause button when running ── */}
                  {mode === 'FOCUS' && isRunning && (
                    <button
                      type="button"
                      onClick={() => setIsRunning(false)}
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center space-x-2 cursor-pointer"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </button>
                  )}

                  {/* ── BREAK: Start button when not yet running ── */}
                  {mode === 'BREAK' && !isRunning && !breakCompleted && (
                    <button
                      type="button"
                      onClick={startBreakTimer}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center space-x-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start Break ({settings.breakDurationMins || 3}m)</span>
                    </button>
                  )}

                  {/* ── BREAK: Pause/Resume when running ── */}
                  {mode === 'BREAK' && isRunning && (
                    <button
                      type="button"
                      onClick={() => setIsRunning(false)}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center space-x-2 cursor-pointer"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Pause Break</span>
                    </button>
                  )}

                  {/* ── LUNCH: Start button when not yet running ── */}
                  {mode === 'LUNCH' && !isRunning && (
                    <button
                      type="button"
                      onClick={startLunchTimer}
                      className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-500/30 transition-all active:scale-95 flex items-center space-x-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start Lunch ({settings.lunchBreakMins || 45}m) 🍱</span>
                    </button>
                  )}

                  {/* ── LUNCH: Pause/Resume when running ── */}
                  {mode === 'LUNCH' && isRunning && (
                    <button
                      type="button"
                      onClick={() => setIsRunning(false)}
                      className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-500/30 transition-all active:scale-95 flex items-center space-x-2 cursor-pointer"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Pause Lunch</span>
                    </button>
                  )}

                  {/* ── Resume button when paused mid-session (not at start) ── */}
                  {!isRunning && mode === 'FOCUS' && timeLeft < settings.breakIntervalMins * 60 && (
                    <button
                      type="button"
                      onClick={() => setIsRunning(true)}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center space-x-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Resume</span>
                    </button>
                  )}

                  {/* ── Reset ── */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRunning(false);
                      setBreakCompleted(false);
                      setBreakClaimed(false);
                      setTimeLeft(
                        mode === 'FOCUS'
                          ? settings.breakIntervalMins * 60
                          : mode === 'LUNCH'
                          ? (settings.lunchBreakMins || 45) * 60
                          : (settings.breakDurationMins || 3) * 60
                      );
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer ${
                      isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </button>

                  {/* ── Claim Break (locked until complete, one-time) ── */}
                  {mode === 'BREAK' && (
                    <button
                      type="button"
                      disabled={!breakCompleted || breakClaimed}
                      onClick={() => {
                        if (!breakCompleted || breakClaimed) return;
                        setBreakClaimed(true);
                        setStats((prev) => ({ ...prev, breaksCompleted: prev.breaksCompleted + 1, points: prev.points + 50 }));
                        setLevelUpToast('Claimed +50 pts for completing break! 🎉');
                        setTimeout(() => setLevelUpToast(null), 3500);
                      }}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 flex items-center space-x-1.5 ${
                        breakClaimed
                          ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 cursor-not-allowed'
                          : breakCompleted
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30 cursor-pointer animate-pulse'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>
                        {breakClaimed ? 'Claimed ✓' : breakCompleted ? 'Claim Break (+50 pts)' : '🔒 Complete break to claim'}
                      </span>
                    </button>
                  )}

                  {/* ── Back to Focus (after break claimed) ── */}
                  {mode === 'BREAK' && breakClaimed && (
                    <button
                      type="button"
                      onClick={startFocusSession}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Back to Focus</span>
                    </button>
                  )}

                  {/* ── Checkpoint (Focus only) ── */}
                  {mode === 'FOCUS' && isRunning && (
                    <button
                      type="button"
                      onClick={() => setIsCheckpointOpen(true)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isDark ? 'bg-slate-900/60 hover:bg-slate-800 text-indigo-400 border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5 inline mr-1" />
                      <span>Checkpoint</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ── BOTTOM STATS ROW (Exact match to Mockup!) ── */}
              <div className="grid grid-cols-3 gap-3">
                <div
                  className={`rounded-2xl p-4 text-center border transition-all ${
                    isDark ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-cyan-50 border-cyan-200'
                  }`}
                >
                  <div className="text-2xl font-black text-cyan-400 font-mono">{stats.breaksCompleted}</div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">Sessions today</div>
                </div>

                <div
                  className={`rounded-2xl p-4 text-center border transition-all ${
                    isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'
                  }`}
                >
                  <div className="text-2xl font-black text-indigo-400 font-mono">
                    💧 {Math.round(stats.waterIntakeMl / 250)}/8
                  </div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">Water glasses</div>
                </div>

                <div
                  className={`rounded-2xl p-4 text-center border transition-all ${
                    isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <div className="text-2xl font-black text-amber-400 font-mono">🔥 {stats.streakDays}</div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">Day streak</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HYDRATION */}
          {activeTab === 'HYDRATION' && (
            <div className="max-w-xl mx-auto space-y-4">
              <HydrationCard
                currentMl={stats.waterIntakeMl}
                targetMl={stats.waterTargetMl}
                theme={settings.theme}
                onAddWater={handleAddWater}
              />
            </div>
          )}

          {/* TAB 3: MOOD COACH (With Plan Gating) */}
          {activeTab === 'MOOD' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                    <span>How are you feeling right now?</span>
                    {!PLAN_LIMITS[userPlan].fullMoodCoach && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        Free Trial: 2 Moods Unlocked
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400">Select your current mental/physical state for targeted micro-activities</p>
                </div>

                {!PLAN_LIMITS[userPlan].fullMoodCoach && (
                  <button
                    type="button"
                    onClick={() => openUpgradeModal('Full Mood Coach (All 6 Moods)')}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Unlock all 6 Moods (Pro)</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {MOOD_DATA.map((m) => {
                  const isLockedMood = m.proOnly && !PLAN_LIMITS[userPlan].fullMoodCoach;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        if (isLockedMood) {
                          openUpgradeModal(`Mood: ${m.label}`);
                          return;
                        }
                        setSelectedMood(m);
                        setGuidedTimerSecs(m.durationSecs);
                        setIsGuidedRunning(false);
                        setGuidedCompleted(false);
                        setMoodActivityClaimed(false); // reset claim for new mood
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                        selectedMood.id === m.id && !isLockedMood
                          ? 'bg-indigo-600/30 border-indigo-500 shadow-md shadow-indigo-500/20'
                          : isLockedMood
                          ? 'bg-slate-900/40 border-slate-800/80 opacity-70 hover:opacity-100 hover:border-indigo-500/50'
                          : isDark
                          ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {isLockedMood && (
                        <div className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Pro</span>
                        </div>
                      )}

                      <div className="text-2xl mb-1">{m.emoji}</div>
                      <div className="text-xs font-bold text-white">{m.label}</div>
                      <div className="text-[10px] text-slate-400">{m.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Targeted Recommendation Box */}
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      Recommended Micro-Activity
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5">{selectedMood.recommended}</h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-cyan-400 font-mono">{formatTime(guidedTimerSecs)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsGuidedRunning(!isGuidedRunning)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                  >
                    {isGuidedRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isGuidedRunning ? 'Pause Activity' : `Start ${selectedMood.durationSecs}s Exercise`}</span>
                  </button>

                  <button
                    type="button"
                    disabled={!guidedCompleted || moodActivityClaimed}
                    onClick={() => handleClaimBonus(30, selectedMood.recommended, 'mood')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      moodActivityClaimed
                        ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 cursor-not-allowed'
                        : guidedCompleted
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/30 cursor-pointer animate-pulse'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                    <span>{moodActivityClaimed ? 'Claimed ✓' : 'Claim +30 Bonus Pts'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BREATHING EXERCISE (3-Phase: Inhale -> Hold -> Exhale) */}
          {activeTab === 'BREATHING' && (
            <div className="max-w-md mx-auto text-center space-y-6 py-4">
              <div>
                <h2 className="text-lg font-black tracking-tight">3-Phase Guided Box Breathing</h2>
                <p className="text-xs text-slate-400">4s Inhale ➔ 4s Hold ➔ 4s Exhale (12s per cycle)</p>
              </div>

              {/* 3 Step Indicator Pills */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'INHALE', label: '1. Inhale (4s)', color: 'border-cyan-500 text-cyan-400 bg-cyan-500/20' },
                  { id: 'HOLD', label: '2. Hold (4s)', color: 'border-indigo-500 text-indigo-400 bg-indigo-500/20' },
                  { id: 'EXHALE', label: '3. Exhale (4s)', color: 'border-emerald-500 text-emerald-400 bg-emerald-500/20' },
                ].map((s) => (
                  <div
                    key={s.id}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                      breathPhase === s.id ? `${s.color} shadow-lg scale-105 font-black` : 'border-slate-800 text-slate-500 bg-slate-950/40'
                    }`}
                  >
                    {s.label}
                  </div>
                ))}
              </div>

              {/* Animated Breathing Circle */}
              <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                <div
                  className={`absolute inset-0 rounded-full border-4 transition-all duration-1000 ${
                    breathPhase === 'INHALE'
                      ? 'scale-110 bg-cyan-500/20 border-cyan-400 shadow-xl shadow-cyan-500/40'
                      : breathPhase === 'HOLD'
                      ? 'scale-110 bg-indigo-500/25 border-indigo-400 shadow-xl shadow-indigo-500/40'
                      : 'scale-75 bg-emerald-500/20 border-emerald-400 shadow-xl shadow-emerald-500/40'
                  }`}
                />
                <div className="text-center z-10">
                  <span className="text-5xl font-black font-mono text-white">{breathSecs}</span>
                  <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                    Cycle #{breathCycles + 1}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsBreathingActive(!isBreathingActive)}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  {isBreathingActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isBreathingActive ? 'Pause Breathing' : 'Start Guided Breathing'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsBreathingActive(false);
                    setBreathPhase('INHALE');
                    setBreathSecs(4);
                    setBreathCycles(0);
                    setBreathSessionClaimed(false); // allow new claim after reset
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                  Reset
                </button>

                <button
                  type="button"
                  disabled={breathCycles < 1 || breathSessionClaimed}
                  onClick={() => handleClaimBonus(30, '3-Phase Breathing', 'breath')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    breathSessionClaimed
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 cursor-not-allowed'
                      : breathCycles >= 1
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/30 cursor-pointer animate-pulse'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                  <span>{breathSessionClaimed ? 'Claimed ✓' : 'Claim +30 Pts'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: STRESS BUSTER MINI GAME (With Pro Plan Gating) */}
          {activeTab === 'GAMES' && (
            <div className="max-w-md mx-auto space-y-4 py-4 text-center relative">
              {!PLAN_LIMITS[userPlan].bubbleGame ? (
                <div className="p-8 rounded-3xl border border-indigo-500/30 bg-slate-900/90 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                    <Gamepad2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Stress Buster Game is a Pro Feature</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Pop bubbles to alleviate micro-stress and earn +30 bonus wellness points every break.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openUpgradeModal('Stress Buster Game')}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/25 cursor-pointer active:scale-95 transition-all"
                  >
                    Unlock Game with Pro ($4.99)
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-black tracking-tight">Bubble Pop Stress Buster</h2>
                      <p className="text-xs text-slate-400">Pop bubbles to relieve micro-stress & fatigue</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-400 font-mono">Score: {gameScore} pts</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
                    {bubbles.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => !b.popped && handlePopBubble(b.id)}
                        className={`w-14 h-14 rounded-full transition-all duration-300 flex items-center justify-center text-sm font-bold shadow-md cursor-pointer ${
                          b.popped ? 'scale-50 opacity-20 bg-slate-800 text-slate-600' : `${b.color} hover:scale-110 active:scale-90 text-white`
                        }`}
                      >
                        {b.popped ? '💥' : '🎈'}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetBubbleGame();
                        setGameSessionClaimed(false); // allow new claim after reset
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                    >
                      Reset Grid
                    </button>

                    <button
                      type="button"
                      disabled={gameScore < 50 || gameSessionClaimed}
                      onClick={() => handleClaimBonus(30, 'Stress Buster Game', 'game')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        gameSessionClaimed
                          ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 cursor-not-allowed'
                          : gameScore >= 50
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/30 cursor-pointer animate-pulse'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                      <span>{gameSessionClaimed ? 'Claimed ✓' : 'Claim +30 Pts'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 6: PERSONAL ANALYTICS (7-Day charts and peak hours) */}
          {activeTab === 'ANALYTICS' && (
            <DetailedAnalytics
              theme={settings.theme}
              userPlan={userPlan}
              onUpgradeClick={() => openUpgradeModal('7-Day Personal Analytics')}
            />
          )}

          {/* TAB 7: ACHIEVEMENTS & GAMIFICATION */}
          {activeTab === 'ACHIEVEMENTS' && (
            <div className="max-w-xl mx-auto space-y-4">
              <GamificationPoints
                points={stats.points}
                breaksCompleted={stats.breaksCompleted}
                activeMinutes={stats.activeMinutes}
                theme={settings.theme}
              />
            </div>
          )}

          {/* TAB 8: CORPORATE HR DASHBOARD & PORTAL */}
          {activeTab === 'HR_PORTAL' && (
            <div className="space-y-4">
              <AdminDashboard
                theme={settings.theme}
                userPlan={userPlan}
                onToggleTheme={handleToggleTheme}
                onBackToApp={() => setActiveTab('TIMER')}
                onUpgradeClick={() => openUpgradeModal('HR Corporate Portal & Seats')}
              />
            </div>
          )}
        </main>
      </div>

      {/* ═══════════════════════════════════════════════
           MODALS (Settings, Checkpoints & Upgrade Modal)
         ═══════════════════════════════════════════════ */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSaveSettings={handleSaveSettings}
      />

      <FocusCheckpointModal
        isOpen={isCheckpointOpen}
        theme={settings.theme}
        onSaveCheckpoint={handleSaveCheckpoint}
        onSkip={startBreakSession}
      />

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        theme={settings.theme}
        currentPlan={userPlan}
        targetFeature={upgradeTargetFeature}
        onClose={() => setIsUpgradeModalOpen(false)}
        onSelectPlan={handleSelectPlan}
      />
    </div>
  );
}
