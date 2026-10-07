export interface UserStats {
  points: number;
  streakDays: number;
  waterIntakeMl: number;
  waterTargetMl: number;
  breaksCompleted: number;
  breaksTarget: number;
  activeMinutes: number;
  lastCheckpointNote?: string;
  lastCheckpointTime?: string;
}

export type SoundTone = 'chime' | 'splash' | 'zen' | 'digital' | 'custom';
export type AppTheme = 'dark' | 'light';
export type TimerMode = 'FOCUS' | 'BREAK' | 'LUNCH';
export type UserPlan = 'trial' | 'pro' | 'team';

export interface PlanFeatureLimits {
  customTimer: boolean;
  fullMoodCoach: boolean;
  allTiers: boolean;
  detailedAnalytics: boolean;
  bubbleGame: boolean;
  hrDashboard: boolean;
  exportReports: boolean;
}

export const PLAN_LIMITS: Record<UserPlan, PlanFeatureLimits> = {
  trial: {
    customTimer: false,
    fullMoodCoach: false,
    allTiers: false,
    detailedAnalytics: false,
    bubbleGame: false,
    hrDashboard: false,
    exportReports: false,
  },
  pro: {
    customTimer: true,
    fullMoodCoach: true,
    allTiers: true,
    detailedAnalytics: true,
    bubbleGame: true,
    hrDashboard: false,
    exportReports: false,
  },
  team: {
    customTimer: true,
    fullMoodCoach: true,
    allTiers: true,
    detailedAnalytics: true,
    bubbleGame: true,
    hrDashboard: true,
    exportReports: true,
  },
};

export type TimerStatus = 'idle' | 'running' | 'paused';

export interface ModeTimerState {
  durationSec: number;
  endTimestamp: number | null;
  remainingSec: number;
  status: TimerStatus;
}

export type AllTimersState = Record<TimerMode, ModeTimerState>;

export interface Settings {
  hydrationIntervalMins: number;
  breakIntervalMins: number;      // Focus session duration (e.g., 25 mins)
  breakDurationMins: number;      // Active break duration (e.g., 3 mins)
  lunchBreakMins: number;         // Dedicated Lunch break duration (e.g., 45 mins)
  eyeRestIntervalMins: number;
  soundEnabled: boolean;
  strictMode: boolean;
  autoMuteInMeetings: boolean;
  waterTargetMl: number;
  selectedTone: SoundTone;
  theme: AppTheme;
  reduceMotion: boolean;          // Pauses 3D planet animation
  customSoundUrl?: string;
  customSoundName?: string;
  eapHelplineUrl?: string;        // Configurable Employee Assistance / Helpline URL
}

export interface CompletedActivityLog {
  id: string;
  moodId: string;
  activityId: string;
  activityTitle: string;
  timestamp: number;
}

declare global {
  interface Window {
    electronAPI?: {
      getIdleTime: () => Promise<number>;
      sendNotification: (title: string, body: string, icon?: string) => Promise<boolean>;
      minimizeWindow: () => void;
      hideWindow: () => void;
      closeWindow: () => void;
      onIdleStateChange: (callback: (data: { idleTime: number; isIdle: boolean }) => void) => void;
    };
  }
}
