import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HydrationCard } from './components/HydrationCard';
import { BreakTimerCard } from './components/BreakTimerCard';
import { GamificationPoints } from './components/GamificationPoints';
import { SettingsModal } from './components/SettingsModal';
import { AdminDashboard } from './components/AdminDashboard';
import { FocusCheckpointModal } from './components/FocusCheckpointModal';
import { BreakActivitiesModal } from './components/BreakActivitiesModal';
import { Shield, Bell, LayoutDashboard, Bookmark, X, Utensils } from 'lucide-react';
import { UserStats, Settings, TimerMode, AppTheme } from './types';
import { soundEngine } from './utils/audio';

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

export default function App() {
  const [view, setView] = useState<'APP' | 'ADMIN'>('APP');

  // Load settings from localStorage
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
  const [isBreakActivitiesOpen, setIsBreakActivitiesOpen] = useState<boolean>(false);
  const [showWelcomeBackBanner, setShowWelcomeBackBanner] = useState<boolean>(false);

  const [stats, setStats] = useState<UserStats>(() => {
    const cachedNote = localStorage.getItem('pausepulse_checkpoint_note') || undefined;
    return {
      points: 180,
      streakDays: 4,
      waterIntakeMl: 750,
      waterTargetMl: settings.waterTargetMl,
      breaksCompleted: 3,
      breaksTarget: 6,
      activeMinutes: 135,
      lastCheckpointNote: cachedNote,
    };
  });

  const [mode, setMode] = useState<TimerMode>('FOCUS');
  const [timeLeft, setTimeLeft] = useState<number>(settings.breakIntervalMins * 60);
  const [isRunning, setIsRunning] = useState<boolean>(true);

  // Sync settings target
  useEffect(() => {
    setStats((prev) => ({ ...prev, waterTargetMl: settings.waterTargetMl }));
  }, [settings.waterTargetMl]);

  // Save settings to localStorage
  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('pausepulse_settings', JSON.stringify(newSettings));
    } catch {
      // Fallback
    }
    setMode('FOCUS');
    setTimeLeft(newSettings.breakIntervalMins * 60);
    setIsRunning(true);
  };

  // Toggle Theme
  const handleToggleTheme = () => {
    const nextTheme: AppTheme = settings.theme === 'dark' ? 'light' : 'dark';
    const updated = { ...settings, theme: nextTheme };
    setSettings(updated);
    try {
      localStorage.setItem('pausepulse_settings', JSON.stringify(updated));
    } catch {
      // Fallback
    }
  };

  // Timer countdown effect for FOCUS -> BREAK -> LUNCH cycles
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (mode === 'FOCUS') {
        // Trigger Pre-Break Focus Checkpoint Modal
        setIsCheckpointOpen(true);
        setIsRunning(false);

        if (settings.soundEnabled) {
          soundEngine.playTone(settings.selectedTone, settings.customSoundUrl);
        }
      } else if (mode === 'LUNCH') {
        // Lunch Break complete! Return to FOCUS Mode
        startFocusSession();
        window.electronAPI?.sendNotification(
          'Lunch Break Finished! 🍱',
          'Hope you had a great meal! Welcome back to your focus session.'
        );
      } else {
        // BREAK session complete! Return to FOCUS Mode
        startFocusSession();
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, settings]);

  const startBreakSession = () => {
    setIsCheckpointOpen(false);
    setMode('BREAK');
    setTimeLeft((settings.breakDurationMins || 3) * 60);
    setIsRunning(true);

    window.electronAPI?.sendNotification(
      'Break Time Started! 🧘',
      `Focus completed! Take a ${settings.breakDurationMins || 3}-minute break now and claim +50 points!`
    );
  };

  const handleStartLunchBreak = () => {
    setMode('LUNCH');
    setTimeLeft((settings.lunchBreakMins || 45) * 60);
    setIsRunning(true);

    if (settings.soundEnabled) {
      soundEngine.playTone('chime');
    }

    window.electronAPI?.sendNotification(
      'Lunch Break Started 🍱',
      `Enjoy your ${settings.lunchBreakMins || 45}-minute meal break!`
    );
  };

  const startFocusSession = () => {
    setMode('FOCUS');
    setTimeLeft(settings.breakIntervalMins * 60);
    setIsRunning(true);

    if (stats.lastCheckpointNote) {
      setShowWelcomeBackBanner(true);
    }

    if (settings.soundEnabled) {
      soundEngine.playTone(settings.selectedTone, settings.customSoundUrl);
    }

    window.electronAPI?.sendNotification(
      'Back to Focus Session! ⚡',
      'Welcome back to your focus session.'
    );
  };

  // Handlers
  const handleSaveCheckpoint = (note: string) => {
    setStats((prev) => ({
      ...prev,
      points: prev.points + 10,
      lastCheckpointNote: note,
    }));
    try {
      localStorage.setItem('pausepulse_checkpoint_note', note);
    } catch {
      // Fallback
    }
    startBreakSession();
  };

  const handleSkipCheckpoint = () => {
    startBreakSession();
  };

  const handleAddWater = (amountMl: number) => {
    if (settings.soundEnabled) {
      soundEngine.playTone('splash');
    }

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

  const handleToggleTimer = () => setIsRunning(!isRunning);

  const handleResetTimer = () => {
    setIsRunning(false);
    setMode('FOCUS');
    setTimeLeft(settings.breakIntervalMins * 60);
  };

  const handleCompleteBreak = () => {
    if (mode !== 'BREAK') return;

    if (settings.soundEnabled) {
      soundEngine.playTone(settings.selectedTone, settings.customSoundUrl);
    }

    setStats((prev) => ({
      ...prev,
      breaksCompleted: prev.breaksCompleted + 1,
      points: prev.points + 50,
    }));

    startFocusSession();
  };

  const handleClaimBonusActivity = (bonusPts: number, activityName: string) => {
    setStats((prev) => ({
      ...prev,
      points: prev.points + bonusPts,
    }));
    window.electronAPI?.sendNotification(
      `Bonus Claimed! 🎉 (+${bonusPts} pts)`,
      `Completed ${activityName} activity during break!`
    );
  };

  const handleTriggerTestAlert = () => {
    if (settings.soundEnabled) {
      soundEngine.playTone(settings.selectedTone, settings.customSoundUrl);
    }
    window.electronAPI?.sendNotification(
      'PausePulse Alert Test',
      'Time to take a short break and drink 250ml of water! 💧'
    );
  };

  const isDark = settings.theme === 'dark';

  if (view === 'ADMIN') {
    return (
      <AdminDashboard
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
        onBackToApp={() => setView('APP')}
      />
    );
  }

  return (
    <div
      className={`w-full h-screen flex flex-col font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden border rounded-xl relative transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100 border-slate-800/80' : 'bg-slate-100 text-slate-900 border-slate-300'
      }`}
    >
      {/* Header */}
      <Header
        points={stats.points}
        streakDays={stats.streakDays}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {/* Welcome Back Checkpoint Banner */}
        {showWelcomeBackBanner && stats.lastCheckpointNote && (
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between shadow-md transition-all animate-in fade-in duration-300 ${
              isDark ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-200' : 'bg-indigo-50 border-indigo-300 text-indigo-900'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Bookmark className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Welcome Back Checkpoint:</span>
                <p className="text-xs font-semibold text-white truncate max-w-[240px]">
                  "{stats.lastCheckpointNote}"
                </p>
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

        {/* Switch to HR Admin View Banner */}
        <div
          onClick={() => setView('ADMIN')}
          className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-md shadow-indigo-500/20 cursor-pointer transition-all active:scale-[0.98]"
        >
          <div className="flex items-center space-x-2">
            <LayoutDashboard className="w-4 h-4 text-white" />
            <span className="text-xs font-bold">Open HR Admin Dashboard & Corporate Portal</span>
          </div>
          <span className="text-[10px] font-extrabold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
            View Portal ➔
          </span>
        </div>

        {/* Break Timer Card */}
        <BreakTimerCard
          timeLeftSeconds={timeLeft}
          isRunning={isRunning}
          mode={mode}
          theme={settings.theme}
          lunchBreakMins={settings.lunchBreakMins || 45}
          onToggleTimer={handleToggleTimer}
          onResetTimer={handleResetTimer}
          onCompleteBreak={handleCompleteBreak}
          onOpenBreakActivities={() => setIsBreakActivitiesOpen(true)}
          onStartLunchBreak={handleStartLunchBreak}
        />

        {/* Hydration Card */}
        <HydrationCard
          currentMl={stats.waterIntakeMl}
          targetMl={stats.waterTargetMl}
          theme={settings.theme}
          onAddWater={handleAddWater}
        />

        {/* Gamification Stats */}
        <GamificationPoints
          points={stats.points}
          breaksCompleted={stats.breaksCompleted}
          activeMinutes={stats.activeMinutes}
          theme={settings.theme}
        />

        {/* Quick Test Alert Action */}
        <div
          className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
            isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200/80 shadow-sm'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-indigo-500 animate-pulse" />
            <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Test Desktop Notification
            </span>
          </div>
          <button
            type="button"
            onClick={handleTriggerTestAlert}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            Trigger Alert
          </button>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSaveSettings={handleSaveSettings}
      />

      {/* Focus Checkpoint Modal */}
      <FocusCheckpointModal
        isOpen={isCheckpointOpen}
        theme={settings.theme}
        onSaveCheckpoint={handleSaveCheckpoint}
        onSkip={handleSkipCheckpoint}
      />

      {/* Break Activities Modal */}
      <BreakActivitiesModal
        isOpen={isBreakActivitiesOpen}
        theme={settings.theme}
        onClose={() => setIsBreakActivitiesOpen(false)}
        onClaimBonus={handleClaimBonusActivity}
      />

      {/* Footer Privacy Guarantee */}
      <footer
        className={`p-2.5 border-t text-center flex items-center justify-center space-x-1.5 text-[10px] ${
          isDark ? 'bg-slate-950 border-slate-900 text-slate-500' : 'bg-slate-200/60 border-slate-300 text-slate-600'
        }`}
      >
        <Shield className="w-3.5 h-3.5 text-emerald-500" />
        <span>PausePulse Privacy • Checkpoints, Box Breathing & Lunch Mode</span>
      </footer>
    </div>
  );
}
