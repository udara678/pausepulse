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
  customSoundUrl?: string;
  customSoundName?: string;
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
