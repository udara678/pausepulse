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
  Utensils,
} from 'lucide-react';
import { UserStats, Settings, TimerMode, AppTheme, UserPlan, PLAN_LIMITS, AllTimersState, ModeTimerState } from './types';
import { soundEngine } from './utils/audio';
import { SettingsModal } from './components/SettingsModal';
import { FocusCheckpointModal } from './components/FocusCheckpointModal';
import { HydrationCard } from './components/HydrationCard';
import { GamificationPoints } from './components/GamificationPoints';
import { AdminDashboard } from './components/AdminDashboard';
import { LicenseGate } from './components/LicenseGate';
import { UpgradeModal } from './components/UpgradeModal';
import { DetailedAnalytics } from './components/DetailedAnalytics';
import { MoodCoach } from './components/MoodCoach';
import { CompletedActivityLog } from './types';
import { GlobeCollection } from '@designcodeio/threeui';
import '@designcodeio/threeui/style.css';

const TRIAL_STARTED_KEY = 'pausepulse_trial_started';
const LICENSE_KEY_STORE = 'pausepulse_license';
const USER_PLAN_STORE = 'pausepulse_user_plan';
const TIMERS_STORAGE_KEY = 'pausepulse_independent_timers_v1';

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
  reduceMotion: false,
};

function getInitialTimers(settings: Settings): AllTimersState {
  const defaults: AllTimersState = {
    FOCUS: {
      durationSec: settings.breakIntervalMins * 60,
      endTimestamp: null,
      remainingSec: settings.breakIntervalMins * 60,
      status: 'idle',
    },
    BREAK: {
      durationSec: (settings.breakDurationMins || 3) * 60,
      endTimestamp: null,
      remainingSec: (settings.breakDurationMins || 3) * 60,
      status: 'idle',
    },
    LUNCH: {
      durationSec: (settings.lunchBreakMins || 45) * 60,
      endTimestamp: null,
      remainingSec: (settings.lunchBreakMins || 45) * 60,
      status: 'idle',
    },
  };

  try {
    const saved = localStorage.getItem(TIMERS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as AllTimersState;
      const now = Date.now();
      (['FOCUS', 'BREAK', 'LUNCH'] as TimerMode[]).forEach((m) => {
        if (parsed[m]) {
          let rem = parsed[m].remainingSec;
          let stat = parsed[m].status;
          let endT = parsed[m].endTimestamp;

          if (stat === 'running' && endT) {
            const diff = Math.ceil((endT - now) / 1000);
            if (diff > 0) {
              rem = diff;
            } else {
              rem = 0;
              stat = 'idle';
              endT = null;
            }
          }

          defaults[m] = {
            durationSec: parsed[m].durationSec || defaults[m].durationSec,
            endTimestamp: endT ?? null,
            remainingSec: typeof rem === 'number' ? rem : defaults[m].durationSec,
            status: stat || 'idle',
          };
        }
      });
    }
  } catch (e) {
    console.error('Failed to parse saved timers:', e);
  }

  return defaults;
}

type ActiveNavTab = 'TIMER' | 'HYDRATION' | 'MOOD' | 'BREATHING' | 'GAMES' | 'ANALYTICS' | 'ACHIEVEMENTS' | 'HR_PORTAL';

interface TabErrorBoundaryProps {
  children: React.ReactNode;
  onReset: () => void;
}

interface TabErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class TabErrorBoundary extends React.Component<TabErrorBoundaryProps, TabErrorBoundaryState> {
  constructor(props: TabErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): TabErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Tab render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-md mx-auto my-12 rounded-3xl border border-rose-500/30 bg-purple-950/40 backdrop-blur-xl text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-xl font-bold">
            ⚠️
          </div>
          <h3 className="text-base font-bold text-white">Temporary Render Error</h3>
          <p className="text-xs text-rose-300/80 font-mono">
            {this.state.error?.message || 'Component failed to mount'}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onReset();
            }}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-500/25 cursor-pointer"
          >
            Return to Focus Timer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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

  // Independent timers state for each mode: { durationSec, endTimestamp, remainingSec, status }
  const [timers, setTimers] = useState<AllTimersState>(() => getInitialTimers(settings));
  const [displayedMode, setDisplayedMode] = useState<TimerMode>('FOCUS');
  const [breakCompleted, setBreakCompleted] = useState<boolean>(false);
  const [breakClaimed, setBreakClaimed] = useState<boolean>(false);
  const [confirmSwitch, setConfirmSwitch] = useState<{
    currentMode: TimerMode;
    newMode: TimerMode;
  } | null>(null);

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

  // Live timer tick: computes remaining time from Date.now() and endTimestamp
  useEffect(() => {
    const interval = setInterval(() => {
      const runningMode = (['FOCUS', 'BREAK', 'LUNCH'] as TimerMode[]).find(
        (m) => timers[m].status === 'running' && timers[m].endTimestamp !== null
      );

      if (!runningMode) return;

      const now = Date.now();
      const currentTimer = timers[runningMode];
      if (!currentTimer.endTimestamp) return;

      const remaining = Math.max(0, Math.ceil((currentTimer.endTimestamp - now) / 1000));

      if (remaining <= 0) {
        handleTimerCompleted(runningMode);
      } else if (remaining !== currentTimer.remainingSec) {
        setTimers((prev) => {
          const next = {
            ...prev,
            [runningMode]: {
              ...prev[runningMode],
              remainingSec: remaining,
            },
          };
          try {
            localStorage.setItem(TIMERS_STORAGE_KEY, JSON.stringify(next));
          } catch {}
          return next;
        });
      }
    }, 250);

    return () => clearInterval(interval);
  }, [timers]);

  const handleTimerCompleted = (completedMode: TimerMode) => {
    soundEngine.playTone(settings.selectedTone, settings.customSoundUrl);

    setTimers((prev) => {
      const next: AllTimersState = {
        ...prev,
        [completedMode]: {
          ...prev[completedMode],
          status: 'idle',
          endTimestamp: null,
          remainingSec: 0,
        },
      };
      try {
        localStorage.setItem(TIMERS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    if (completedMode === 'FOCUS') {
      setIsCheckpointOpen(true);
      window.electronAPI?.sendNotification?.('Focus Session Complete! 🎯', 'Great job! Time for a well-deserved break.');
      setStats((prev) => ({
        ...prev,
        points: prev.points + 25,
        activeMinutes: prev.activeMinutes + Math.round(timers.FOCUS.durationSec / 60),
      }));
    } else if (completedMode === 'BREAK') {
      setBreakCompleted(true);
      window.electronAPI?.sendNotification?.('Break Finished! 🎉', 'Ready to dive back into focused work?');
      setStats((prev) => ({
        ...prev,
        breaksCompleted: prev.breaksCompleted + 1,
      }));
    } else if (completedMode === 'LUNCH') {
      window.electronAPI?.sendNotification?.('Lunch Break Finished! 🍽️', 'Hope you had a great meal! Welcome back.');
    }
  };

  const startModeDirectly = (modeToStart: TimerMode) => {
    const now = Date.now();
    setTimers((prev) => {
      const target = prev[modeToStart];
      const remaining = target.remainingSec > 0 ? target.remainingSec : target.durationSec;
      const endTimestamp = now + remaining * 1000;

      const next: AllTimersState = {
        ...prev,
        [modeToStart]: {
          ...target,
          status: 'running',
          remainingSec: remaining,
          endTimestamp,
        },
      };
      try {
        localStorage.setItem(TIMERS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    if (modeToStart === 'FOCUS') {
      soundEngine.playTone(settings.selectedTone, settings.customSoundUrl);
      window.electronAPI?.sendNotification?.('Focus Session Started! ⚡', 'Deep work mode active. Stay focused!');
      if (stats.lastCheckpointNote) setShowWelcomeBackBanner(true);
    } else if (modeToStart === 'BREAK') {
      soundEngine.playTone(settings.selectedTone, settings.customSoundUrl);
      window.electronAPI?.sendNotification?.('Break Time Started! 🧘', `Take a ${Math.round(timers.BREAK.durationSec / 60)}-minute break now!`);
      setBreakCompleted(false);
      setBreakClaimed(false);
    } else if (modeToStart === 'LUNCH') {
      soundEngine.playTone(settings.selectedTone, settings.customSoundUrl);
      window.electronAPI?.sendNotification?.('Lunch Break Started 🍽️', `Enjoy your ${Math.round(timers.LUNCH.durationSec / 60)}-minute meal break!`);
    }
  };

  const handleStartTimer = (modeToStart: TimerMode) => {
    // If another mode is currently running, prompt confirmation dialog
    const currentlyRunning = (['FOCUS', 'BREAK', 'LUNCH'] as TimerMode[]).find(
      (m) => m !== modeToStart && timers[m].status === 'running'
    );

    if (currentlyRunning) {
      setConfirmSwitch({
        currentMode: currentlyRunning,
        newMode: modeToStart,
      });
      return;
    }

    startModeDirectly(modeToStart);
  };

  const handleConfirmSwitch = () => {
    if (!confirmSwitch) return;
    const { currentMode, newMode } = confirmSwitch;
    const now = Date.now();

    setTimers((prev) => {
      // 1. Pause current
      const curr = prev[currentMode];
      const currRemaining = curr.endTimestamp
        ? Math.max(0, Math.ceil((curr.endTimestamp - now) / 1000))
        : curr.remainingSec;

      // 2. Start new
      const target = prev[newMode];
      const newRemaining = target.remainingSec > 0 ? target.remainingSec : target.durationSec;
      const newEnd = now + newRemaining * 1000;

      const next: AllTimersState = {
        ...prev,
        [currentMode]: {
          ...curr,
          status: 'paused',
          endTimestamp: null,
          remainingSec: currRemaining,
        },
        [newMode]: {
          ...target,
          status: 'running',
          remainingSec: newRemaining,
          endTimestamp: newEnd,
        },
      };
      try {
        localStorage.setItem(TIMERS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    if (newMode === 'BREAK') {
      setBreakCompleted(false);
      setBreakClaimed(false);
    }

    setConfirmSwitch(null);
  };

  const handleCancelSwitch = () => {
    setConfirmSwitch(null);
  };

  const handlePauseTimer = (modeToPause: TimerMode) => {
    const now = Date.now();
    setTimers((prev) => {
      const current = prev[modeToPause];
      const remaining = current.endTimestamp
        ? Math.max(0, Math.ceil((current.endTimestamp - now) / 1000))
        : current.remainingSec;

      const next: AllTimersState = {
        ...prev,
        [modeToPause]: {
          ...current,
          status: 'paused',
          endTimestamp: null,
          remainingSec: remaining,
        },
      };
      try {
        localStorage.setItem(TIMERS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleResetTimer = (modeToReset: TimerMode) => {
    setTimers((prev) => {
      const current = prev[modeToReset];
      const next: AllTimersState = {
        ...prev,
        [modeToReset]: {
          ...current,
          status: 'idle',
          endTimestamp: null,
          remainingSec: current.durationSec,
        },
      };
      try {
        localStorage.setItem(TIMERS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    if (modeToReset === 'BREAK') {
      setBreakCompleted(false);
      setBreakClaimed(false);
    }
  };

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

  const handleSaveCheckpoint = (note: string) => {
    setStats((prev) => ({
      ...prev,
      points: prev.points + 10,
      lastCheckpointNote: note,
    }));
    try {
      localStorage.setItem('pausepulse_checkpoint_note', note);
    } catch {}
    setIsCheckpointOpen(false);
    setDisplayedMode('BREAK');
  };

  const handleAddWater = (amountMl: number) => {
    if (settings.soundEnabled) soundEngine.playTone('splash');
    setStats((prev) => ({
      ...prev,
      waterIntakeMl: prev.waterIntakeMl + amountMl,
      points: prev.points + 20,
    }));
    window.electronAPI?.sendNotification?.(
      'Hydration Logged! 💧',
      `Awesome! Logged ${amountMl}ml of water (+20 points)`
    );
  };

  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('pausepulse_settings', JSON.stringify(newSettings));
    } catch {}

    setTimers((prev) => {
      const newFocusDur = newSettings.breakIntervalMins * 60;
      const newBreakDur = (newSettings.breakDurationMins || 3) * 60;
      const newLunchDur = (newSettings.lunchBreakMins || 45) * 60;

      const next: AllTimersState = {
        FOCUS: {
          ...prev.FOCUS,
          durationSec: newFocusDur,
          remainingSec: prev.FOCUS.status === 'idle' ? newFocusDur : prev.FOCUS.remainingSec,
        },
        BREAK: {
          ...prev.BREAK,
          durationSec: newBreakDur,
          remainingSec: prev.BREAK.status === 'idle' ? newBreakDur : prev.BREAK.remainingSec,
        },
        LUNCH: {
          ...prev.LUNCH,
          durationSec: newLunchDur,
          remainingSec: prev.LUNCH.status === 'idle' ? newLunchDur : prev.LUNCH.remainingSec,
        },
      };
      try {
        localStorage.setItem(TIMERS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleToggleTheme = () => {
    const nextTheme: AppTheme = settings.theme === 'dark' ? 'light' : 'dark';
    const updated = { ...settings, theme: nextTheme };
    setSettings(updated);
    try {
      localStorage.setItem('pausepulse_settings', JSON.stringify(updated));
    } catch {}
  };

  const handleTriggerTestAlert = () => {
    if (settings.soundEnabled) soundEngine.playTone(settings.selectedTone, settings.customSoundUrl);
    window.electronAPI?.sendNotification?.(
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

  const handleLogActivity = (log: Omit<CompletedActivityLog, 'id'>) => {
    try {
      const existing = localStorage.getItem('pausepulse_activity_history');
      const list: CompletedActivityLog[] = existing ? JSON.parse(existing) : [];
      const newEntry: CompletedActivityLog = {
        id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        ...log,
      };
      list.unshift(newEntry);
      // Keep last 100 entries
      localStorage.setItem('pausepulse_activity_history', JSON.stringify(list.slice(0, 100)));
    } catch (e) {
      console.error('Failed to save activity log:', e);
    }
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
      return { name: 'Pacing Pro (Trial Max)', level: 2, next: 1500, percent: 100 };
    }
    if (pts < 3000) return { name: 'Pro Master', level: 3, next: 3000, percent: Math.round((pts / 3000) * 100) };
    return { name: 'Wellness Legend', level: 4, next: 5000, percent: 100 };
  };

  const levelInfo = getLevelInfo(stats.points);

  const runningMode = (['FOCUS', 'BREAK', 'LUNCH'] as TimerMode[]).find(
    (m) => timers[m].status === 'running'
  );
  const isAnyRunning = !!runningMode;
  const activeTopMode = runningMode || displayedMode;
  const activeTopTimer = timers[activeTopMode];

  const currentDisplayTimer = timers[displayedMode];
  const currentDuration = currentDisplayTimer.durationSec;
  const currentRemaining = currentDisplayTimer.remainingSec;

  // SVG circular timer circumference calculations
  const circleRadius = 70;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (circumference * currentRemaining) / Math.max(currentDuration, 1);

  const isDark = settings.theme === 'dark';
  const isReducedMotion = settings.reduceMotion || (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

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
      data-theme={settings.theme}
      className="relative w-full h-screen flex flex-col font-['Inter',sans-serif] overflow-hidden select-none bg-[var(--bg)] text-[var(--text)] transition-colors duration-300"
    >
      {/* ═══════════════════════════════════════════════
           TOP TITLE BAR (Mac Traffic Lights + Mode Info Pill + Controls)
         ═══════════════════════════════════════════════ */}
      <header className="titlebar-drag relative z-20 h-12 flex-shrink-0 flex items-center justify-between px-4 border-b border-[var(--border)] glass-panel transition-colors">
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
            onClick={() => {
              if (isAnyRunning && runningMode) {
                handlePauseTimer(runningMode);
              } else {
                handleStartTimer(displayedMode);
              }
            }}
            className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors shadow-xs cursor-pointer"
            title={isAnyRunning ? 'Pause Running Timer' : `Start ${displayedMode} Timer`}
          />

          <span className="text-xs font-bold tracking-tight ml-2 text-[var(--text)]">
            PausePulse
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--border)]">
            v2.1
          </span>
        </div>

        {/* Center: Live Running Timer Pill */}
        <div className="titlebar-drag hidden md:flex items-center">
          <div className="px-4 py-1 rounded-full text-xs font-medium flex items-center space-x-2 border glass-pill">
            <div className={`w-2 h-2 rounded-full ${isAnyRunning ? 'bg-[var(--success)] animate-pulse' : 'bg-[var(--warning)]'}`} />
            <span className="text-[var(--text)] font-mono">
              {activeTopMode === 'FOCUS' ? 'Deep Work' : activeTopMode === 'LUNCH' ? 'Lunch Break' : 'Resting Break'} —{' '}
              {formatTime(activeTopTimer.remainingSec)}
            </span>
            {isAnyRunning && (
              <span className="text-[10px] text-[var(--accent)] font-semibold uppercase tracking-wider ml-1">
                (Running)
              </span>
            )}
          </div>
        </div>

        {/* Right: Plan Badge Pill + Action Controls */}
        <div className="flex items-center space-x-2 titlebar-nodrag">
          {/* Plan Badge Pill */}
          <button
            type="button"
            onClick={() => openUpgradeModal()}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              userPlan === 'team'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 hover:bg-amber-500/25'
                : userPlan === 'pro'
                ? 'bg-[var(--accent)]/15 border-[var(--border)] text-[var(--accent)] hover:bg-[var(--accent)]/25'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/25'
            }`}
            title="Click to view plan features or simulate tiers"
          >
            {userPlan === 'team' ? (
              <Crown className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            ) : userPlan === 'pro' ? (
              <Zap className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <span className="uppercase text-[10px] tracking-wider">
              {userPlan === 'team' ? 'Team Plan' : userPlan === 'pro' ? 'Pro Monthly' : 'Free Trial'}
            </span>
            <ArrowUpRight className="w-3 h-3 opacity-60" />
          </button>

          {/* Test Sound Alert */}
          <button
            type="button"
            onClick={handleTriggerTestAlert}
            className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
            title="Test Alert Chime"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={handleToggleTheme}
            className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--warning)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
            title="Toggle Dark / Light Theme"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-[var(--accent)]" />}
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
            title="Open Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════
           MAIN BODY: Left Sidebar + Right Content View
         ═══════════════════════════════════════════════ */}
      <div className="relative z-10 flex-1 flex overflow-hidden">
        {/* ── LEFT SIDEBAR ────────────────────────────── */}
        <aside className="w-60 flex-shrink-0 flex flex-col justify-between p-3.5 border-r border-[var(--border)] glass-panel transition-colors">
          {/* Nav List */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
              <span>Dashboard</span>
              <span className="text-[9px] text-[var(--accent)] font-mono lowercase">
                {userPlan} tier
              </span>
            </div>

            {[
              { id: 'TIMER', icon: Clock, label: 'Focus Timer', badge: isAnyRunning ? 'Live' : undefined },
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
                      ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-md font-bold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--accent-contrast)]' : 'text-[var(--text-muted)]'}`} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : tab.badge.includes('🔒')
                          ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
                          : 'glass-pill text-[var(--text-muted)]'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Card: Your Level Card */}
          <div className="space-y-2 pt-3 border-t border-[var(--border)]">
            <div className="p-3 rounded-2xl border border-[var(--border)] glass-pill shadow-sm">
              <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-semibold mb-1">
                <span>Your Level</span>
                {!PLAN_LIMITS[userPlan].allTiers && (
                  <span className="text-[9px] text-[var(--warning)] font-bold">Trial Cap Lvl 2</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-black text-[var(--accent)] flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>{levelInfo.name}</span>
                </div>
                <div className="text-xs font-extrabold text-[var(--hydration)] font-mono">
                  {stats.points.toLocaleString()} pts
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--hydration)] transition-all duration-700"
                  style={{ width: `${levelInfo.percent}%` }}
                />
              </div>
            </div>

            {/* Floating Level Up Toast Notification */}
            {levelUpToast && (
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 animate-in slide-in-from-bottom duration-300">
                <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{levelUpToast}</span>
              </div>
            )}
          </div>
        </aside>

        {/* ── RIGHT MAIN VIEW ─────────────────────────── */}
        <main className="relative flex-1 min-h-0 flex flex-col overflow-y-auto p-6 transition-colors bg-transparent">
          {/* ═══════════════════════════════════════════════
               THREEUI ENERGY ORB 3D BACKGROUND (Centered inside main)
             ═══════════════════════════════════════════════ */}
          <div className="shader-frame absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <GlobeCollection
              variant="energy-orb"
              speed={isReducedMotion ? 0.00 : isBreathingActive ? 1.40 : 1.00}
              scale={1.00}
              smokeScale={1.00}
              smokeStrength={1.00}
              smokeSpeed={isReducedMotion ? 0.00 : 1.00}
              hue={0}
              saturation={1.00}
              glow={1.00}
              starDensity={1.00}
              starSpeed={isReducedMotion ? 0.00 : 1.00}
              starSize={1.00}
              brightness={isDark ? 1.00 : 0.85}
              opacity={isDark ? 0.95 : 0.65}
            />
          </div>

          <TabErrorBoundary key={activeTab} onReset={() => setActiveTab('TIMER')}>
            {/* TAB 1: FOCUS TIMER */}
            {activeTab === 'TIMER' && (
              <div className="relative z-10 flex-1 flex flex-col justify-between items-center w-full max-w-2xl mx-auto py-2 my-auto">
                {/* Header Row / Mode Selector */}
                <div className="w-full flex items-center justify-between glass-panel p-3.5 rounded-2xl mb-auto">
                  <div>
                    <h1 className="text-lg font-black tracking-tight text-[var(--text)]">
                      {displayedMode === 'FOCUS' ? 'Focus Session' : displayedMode === 'LUNCH' ? 'Lunch Break' : 'Resting Break'}
                    </h1>
                    <p className="text-xs text-[var(--text-muted)]">
                      {displayedMode === 'FOCUS'
                        ? 'Deep work mode active — eliminate distractions'
                        : displayedMode === 'LUNCH'
                        ? 'Step away for a nourishing meal'
                        : 'Rest your eyes and stretch your body'}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full glass-pill text-xs font-bold">
                      <div className={`w-2 h-2 rounded-full ${timers[displayedMode].status === 'running' ? 'bg-[var(--success)] animate-pulse' : 'bg-[var(--warning)]'}`} />
                      <span className="text-[var(--text)]">
                        {timers[displayedMode].status === 'running' ? 'Active' : timers[displayedMode].status === 'paused' ? 'Paused' : 'Ready'}
                      </span>
                    </div>

                    {/* Mode Selector Buttons — Switching only changes displayedMode, never resets */}
                    <div className="p-1 rounded-xl glass-pill flex space-x-1">
                      <button
                        type="button"
                        onClick={() => setDisplayedMode('FOCUS')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          displayedMode === 'FOCUS' ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                        }`}
                      >
                        Focus
                      </button>
                      <button
                        type="button"
                        onClick={() => setDisplayedMode('BREAK')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          displayedMode === 'BREAK' ? 'bg-[var(--break)] text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                        }`}
                      >
                        Break
                      </button>
                      <button
                        type="button"
                        onClick={() => setDisplayedMode('LUNCH')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                          displayedMode === 'LUNCH' ? 'bg-[var(--lunch)] text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                        }`}
                      >
                        <Utensils className="w-3 h-3 inline mr-1" />
                        <span>Lunch</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Welcome Back Checkpoint Banner */}
                {showWelcomeBackBanner && stats.lastCheckpointNote && (
                  <div className="w-full my-3 p-3 rounded-2xl glass-panel border border-[var(--border)] flex items-center justify-between shadow-md transition-all">
                    <div className="flex items-center space-x-2.5">
                      <Bookmark className="w-4 h-4 text-[var(--accent)] shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider">
                          Welcome Back Note:
                        </span>
                        <p className="text-xs font-semibold text-[var(--text)]">"{stats.lastCheckpointNote}"</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowWelcomeBackBanner(false)}
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* ── CENTER SVG CIRCULAR COUNTDOWN TIMER (Centered directly on planet) ── */}
                <div className="flex flex-col items-center justify-center my-auto py-4">
                  <div className="relative inline-flex items-center justify-center mb-6">
                    <svg width="220" height="220" viewBox="0 0 160 160" className="transform -rotate-90">
                      {/* Outer glow ring */}
                      <circle
                        cx="80"
                        cy="80"
                        r={circleRadius + 4}
                        fill="none"
                        stroke="var(--border)"
                        strokeWidth="2"
                      />
                      {/* Track ring */}
                      <circle
                        cx="80"
                        cy="80"
                        r={circleRadius}
                        fill="none"
                        stroke="var(--border)"
                        strokeWidth="8"
                      />
                      {/* Progress arc */}
                      <circle
                        cx="80"
                        cy="80"
                        r={circleRadius}
                        fill="none"
                        stroke="url(#timerGradLavender)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-1000 ease-linear"
                      />
                      <defs>
                        <linearGradient id="timerGradLavender" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="60%" stopColor="#c084fc" />
                          <stop offset="100%" stopColor="#e879f9" />
                        </linearGradient>
                      </defs>
                    </svg>

                    <div className="absolute text-center px-4 py-2 rounded-2xl glass-panel shadow-xl">
                      <div className="text-4xl font-black font-mono tracking-tight text-[var(--text)] drop-shadow-lg">
                        {formatTime(currentRemaining)}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] font-semibold tracking-wider uppercase mt-1">
                        {displayedMode === 'FOCUS'
                          ? 'remaining'
                          : displayedMode === 'LUNCH'
                          ? 'lunch remaining'
                          : breakCompleted
                          ? '✅ break complete!'
                          : timers.BREAK.status !== 'running'
                          ? '▶ press start break'
                          : 'break remaining'}
                      </div>
                    </div>
                  </div>

                  {/* Main Action Controls */}
                  <div className="flex items-center space-x-3 flex-wrap gap-y-2 justify-center">
                    {/* ── Start / Resume button when not running ── */}
                    {timers[displayedMode].status !== 'running' && (
                      <button
                        type="button"
                        onClick={() => handleStartTimer(displayedMode)}
                        className="px-6 py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-bold shadow-lg shadow-purple-500/30 transition-all active:scale-95 flex items-center space-x-2 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>
                          {timers[displayedMode].status === 'paused'
                            ? 'Resume'
                            : displayedMode === 'FOCUS'
                            ? `Start Focus (${Math.round(timers.FOCUS.durationSec / 60)}m)`
                            : displayedMode === 'BREAK'
                            ? `Start Break (${Math.round(timers.BREAK.durationSec / 60)}m)`
                            : `Start Lunch (${Math.round(timers.LUNCH.durationSec / 60)}m)`}
                        </span>
                      </button>
                    )}

                    {/* ── Pause button when running ── */}
                    {timers[displayedMode].status === 'running' && (
                      <button
                        type="button"
                        onClick={() => handlePauseTimer(displayedMode)}
                        className="px-6 py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-bold shadow-lg shadow-purple-500/30 transition-all active:scale-95 flex items-center space-x-2 cursor-pointer"
                      >
                        <Pause className="w-4 h-4" />
                        <span>Pause {displayedMode === 'FOCUS' ? 'Focus' : displayedMode === 'BREAK' ? 'Break' : 'Lunch'}</span>
                      </button>
                    )}

                    {/* ── Reset button (only resets currently displayed mode) ── */}
                    <button
                      type="button"
                      onClick={() => handleResetTimer(displayedMode)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold glass-pill text-[var(--text)] hover:bg-[var(--surface)] transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Reset</span>
                    </button>

                    {/* ── Claim Break (locked until complete, one-time) ── */}
                    {displayedMode === 'BREAK' && (
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
                            ? 'glass-pill text-[var(--success)] border border-[var(--success)]/40 cursor-not-allowed'
                            : breakCompleted
                            ? 'bg-[var(--success)] hover:opacity-90 text-white shadow-emerald-500/30 cursor-pointer animate-pulse'
                            : 'glass-pill text-[var(--text-muted)] cursor-not-allowed opacity-60'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>
                          {breakClaimed ? 'Claimed ✓' : breakCompleted ? 'Claim Break (+50 pts)' : '🔒 Complete break to claim'}
                        </span>
                      </button>
                    )}

                    {/* ── Back to Focus (after break claimed) ── */}
                    {displayedMode === 'BREAK' && breakClaimed && (
                      <button
                        type="button"
                        onClick={() => {
                          setDisplayedMode('FOCUS');
                          handleStartTimer('FOCUS');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-bold shadow-lg shadow-purple-500/30 transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Back to Focus</span>
                      </button>
                    )}

                    {/* ── Checkpoint (Focus only) ── */}
                    {displayedMode === 'FOCUS' && timers.FOCUS.status === 'running' && (
                      <button
                        type="button"
                        onClick={() => setIsCheckpointOpen(true)}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold glass-pill text-[var(--accent)] hover:bg-[var(--surface)] transition-all cursor-pointer"
                      >
                        <Bookmark className="w-3.5 h-3.5 inline mr-1" />
                        <span>Checkpoint</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* ── BOTTOM STATS ROW ── */}
                <div className="w-full grid grid-cols-3 gap-3 mt-auto">
                  <div className="glass-panel rounded-2xl p-4 text-center">
                    <div className="text-2xl font-black text-[var(--hydration)] font-mono">{stats.breaksCompleted}</div>
                    <div className="text-xs text-[var(--text-muted)] font-medium mt-0.5">Sessions today</div>
                  </div>

                  <div className="glass-panel rounded-2xl p-4 text-center">
                    <div className="text-2xl font-black text-[var(--accent)] font-mono">
                      💧 {Math.round(stats.waterIntakeMl / 250)}/8
                    </div>
                    <div className="text-xs text-[var(--text-muted)] font-medium mt-0.5">Water glasses</div>
                  </div>

                  <div className="glass-panel rounded-2xl p-4 text-center">
                    <div className="text-2xl font-black text-[var(--warning)] font-mono">🔥 {stats.streakDays}</div>
                    <div className="text-xs text-[var(--text-muted)] font-medium mt-0.5">Day streak</div>
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

          {/* TAB 3: UPGRADED MOOD COACH */}
          {activeTab === 'MOOD' && (
            <MoodCoach
              theme={settings.theme}
              userPlan={userPlan}
              soundEnabled={settings.soundEnabled}
              onClaimPoints={(pts, label) => handleClaimBonus(pts, label, 'mood')}
              onLogActivity={handleLogActivity}
              onNavigateTo={(tab, action) => {
                setActiveTab(tab as any);
                if (tab === 'TIMER' && action === 'start_focus') {
                  handleStartTimer('FOCUS');
                }
              }}
              onAddWater={handleAddWater}
              eapHelplineUrl={settings.eapHelplineUrl}
              onOpenUpgrade={openUpgradeModal}
            />
          )}

          {/* TAB 4: BREATHING EXERCISE (3-Phase: Inhale -> Hold -> Exhale) */}
          {activeTab === 'BREATHING' && (
            <div className="relative z-10 max-w-md mx-auto text-center space-y-6 py-6 glass-panel p-6 rounded-3xl">
              <div>
                <h2 className="text-lg font-black tracking-tight text-[var(--text)]">3-Phase Guided Breathing</h2>
                <p className="text-xs text-[var(--text-muted)]">4s Inhale ➔ 4s Hold ➔ 4s Exhale (12s per cycle)</p>
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
                      breathPhase === s.id ? `${s.color} shadow-lg scale-105 font-black` : 'border-[var(--border)] text-[var(--text-muted)] glass-pill'
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
                  <span className="text-5xl font-black font-mono text-[var(--text)]">{breathSecs}</span>
                  <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase mt-1">
                    Cycle #{breathCycles + 1}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsBreathingActive(!isBreathingActive)}
                  className="px-6 py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-bold shadow-lg shadow-purple-500/30 transition-all cursor-pointer flex items-center space-x-1.5"
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
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-[var(--border)] glass-pill text-[var(--text)] hover:bg-[var(--surface-2)] transition-all cursor-pointer"
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
                      ? 'glass-pill text-[var(--success)] border border-[var(--success)]/40 cursor-not-allowed'
                      : breathCycles >= 1
                      ? 'bg-[var(--success)] hover:opacity-90 text-white shadow-md shadow-emerald-500/30 cursor-pointer animate-pulse'
                      : 'glass-pill text-[var(--text-muted)] cursor-not-allowed opacity-60'
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
            <div className="relative z-10 max-w-md mx-auto space-y-4 py-4 text-center">
              {!PLAN_LIMITS[userPlan].bubbleGame ? (
                <div className="p-8 rounded-3xl border border-[var(--border)] glass-panel text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/20 border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--accent)]">
                    <Gamepad2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[var(--text)]">Stress Buster Game is a Pro Feature</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Pop bubbles to alleviate micro-stress and earn +30 bonus wellness points every break.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openUpgradeModal('Stress Buster Game')}
                    className="px-6 py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-bold shadow-md shadow-purple-500/25 cursor-pointer active:scale-95 transition-all"
                  >
                    Unlock Game with Pro ($4.99)
                  </button>
                </div>
              ) : (
                <div className="glass-panel p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-black tracking-tight text-[var(--text)]">Bubble Pop Stress Buster</h2>
                      <p className="text-xs text-[var(--text-muted)]">Pop bubbles to relieve micro-stress & fatigue</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[var(--warning)] font-mono">Score: {gameScore} pts</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 p-4 rounded-2xl glass-pill border border-[var(--border)]">
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
                      className="px-4 py-2 rounded-xl glass-pill border border-[var(--border)] text-[var(--text)] text-xs font-semibold cursor-pointer hover:bg-[var(--surface-2)]"
                    >
                      Reset Grid
                    </button>

                    <button
                      type="button"
                      disabled={gameScore < 50 || gameSessionClaimed}
                      onClick={() => handleClaimBonus(30, 'Stress Buster Game', 'game')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        gameSessionClaimed
                          ? 'glass-pill text-[var(--success)] border border-[var(--success)]/40 cursor-not-allowed'
                          : gameScore >= 50
                          ? 'bg-[var(--success)] hover:opacity-90 text-white shadow-md shadow-emerald-500/30 cursor-pointer animate-pulse'
                          : 'glass-pill text-[var(--text-muted)] cursor-not-allowed opacity-60'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                      <span>{gameSessionClaimed ? 'Claimed ✓' : 'Claim +30 Pts'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PERSONAL ANALYTICS (7-Day charts and peak hours) */}
          {activeTab === 'ANALYTICS' && (
            <div className="relative z-10 space-y-4">
              <DetailedAnalytics
                theme={settings.theme}
                userPlan={userPlan}
                onUpgradeClick={() => openUpgradeModal('7-Day Personal Analytics')}
              />
            </div>
          )}

          {/* TAB 7: ACHIEVEMENTS & GAMIFICATION */}
          {activeTab === 'ACHIEVEMENTS' && (
            <div className="relative z-10 max-w-xl mx-auto space-y-4">
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
            <div className="relative z-10 space-y-4">
              <AdminDashboard
                theme={settings.theme}
                userPlan={userPlan}
                onToggleTheme={handleToggleTheme}
                onBackToApp={() => setActiveTab('TIMER')}
                onUpgradeClick={() => openUpgradeModal('HR Corporate Portal & Seats')}
              />
            </div>
          )}
          </TabErrorBoundary>
        </main>
      </div>

      {/* ═══════════════════════════════════════════════
           CONFIRMATION DIALOG: Switch Active Mode
         ═══════════════════════════════════════════════ */}
      {confirmSwitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4 border border-[var(--border)]">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/20 border border-[var(--accent)]/30 text-[var(--accent)] flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-[var(--text)]">Switch Active Timer?</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Pause {confirmSwitch.currentMode === 'FOCUS' ? 'Focus' : confirmSwitch.currentMode === 'BREAK' ? 'Break' : 'Lunch'} and start {confirmSwitch.newMode === 'FOCUS' ? 'Focus' : confirmSwitch.newMode === 'BREAK' ? 'Break' : 'Lunch'}?
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={handleCancelSwitch}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSwitch}
                className="flex-1 py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-bold shadow-lg transition-all cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

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
        onSkip={() => {
          setIsCheckpointOpen(false);
          setDisplayedMode('BREAK');
          handleStartTimer('BREAK');
        }}
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
