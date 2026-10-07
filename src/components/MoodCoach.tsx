import React, { useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Sparkles,
  CheckCircle,
  Play,
  ChevronRight,
  LifeBuoy,
} from 'lucide-react';
import { AppTheme, CompletedActivityLog, UserPlan, PLAN_LIMITS } from '../types';
import { MOODS_CONFIG, ACTIVITIES_MAP, MoodItem, ActivityActionType } from '../config/moodActivities';
import { soundEngine } from '../utils/audio';

// Activity Components
import { DeskStretch } from './activities/DeskStretch';
import { EyeRest } from './activities/EyeRest';
import { Grounding54321 } from './activities/Grounding54321';
import { BrainDump } from './activities/BrainDump';
import { TaskTriage } from './activities/TaskTriage';
import { KudosNote } from './activities/KudosNote';
import { GratitudeNote } from './activities/GratitudeNote';
import { Energizer } from './activities/Energizer';
import { LongExhaleBreathe } from './activities/LongExhaleBreathe';
import { WalkTimer } from './activities/WalkTimer';

interface MoodCoachProps {
  theme: AppTheme;
  userPlan: UserPlan;
  soundEnabled: boolean;
  onClaimPoints: (pts: number, label: string) => void;
  onLogActivity: (log: Omit<CompletedActivityLog, 'id'>) => void;
  onNavigateTo: (tab: string, action?: string) => void;
  onAddWater: (ml: number) => void;
  eapHelplineUrl?: string;
  onOpenUpgrade: (feature: string) => void;
}

const COMPONENT_MAP: Record<string, React.FC<{ onComplete: (id: string) => void; theme: AppTheme }>> = {
  'desk-stretch': DeskStretch,
  'eye-rest': EyeRest,
  'grounding': Grounding54321,
  'brain-dump': BrainDump,
  'task-triage': TaskTriage,
  'kudos-note': KudosNote,
  'gratitude-note': GratitudeNote,
  'energizer': Energizer,
  'long-exhale': LongExhaleBreathe,
  'walk-timer': WalkTimer,
};

type ViewState =
  | { type: 'grid' }
  | { type: 'recommendations'; mood: MoodItem }
  | { type: 'activity'; moodId: string; activityId: string }
  | { type: 'eap' };

export const MoodCoach: React.FC<MoodCoachProps> = ({
  theme,
  userPlan,
  soundEnabled,
  onClaimPoints,
  onLogActivity,
  onNavigateTo,
  onAddWater,
  eapHelplineUrl,
  onOpenUpgrade,
}) => {
  const isDark = theme === 'dark';
  const [view, setView] = useState<ViewState>({ type: 'grid' });
  const [claimedActivities, setClaimedActivities] = useState<Set<string>>(new Set());
  const [eapOpen, setEapOpen] = useState(false);

  const hasFullAccess = PLAN_LIMITS[userPlan].fullMoodCoach;
  // First 3 moods are always free; rest require Pro
  const FREE_MOODS = ['anxious', 'physically-tired', 'feeling-good'];

  const handleSelectMood = (mood: MoodItem) => {
    const isFree = FREE_MOODS.includes(mood.id);
    if (!isFree && !hasFullAccess) {
      onOpenUpgrade('Full Mood Coach (9 Moods)');
      return;
    }
    setView({ type: 'recommendations', mood });
  };

  const handleStartActivity = (moodId: string, activityId: string) => {
    const activity = ACTIVITIES_MAP[activityId];
    if (!activity) return;

    if (activity.actionType === 'component' && activity.componentKey) {
      setView({ type: 'activity', moodId, activityId });
    } else if (activity.actionType === 'navigate_breathing') {
      onNavigateTo('BREATHING');
    } else if (activity.actionType === 'navigate_games') {
      onNavigateTo('GAMES');
    } else if (activity.actionType === 'navigate_timer') {
      onNavigateTo('TIMER', 'start_focus');
    } else if (activity.actionType === 'log_water') {
      onAddWater(250);
      // Claim points immediately for log water
      const key = `${moodId}-${activityId}`;
      if (!claimedActivities.has(key)) {
        setClaimedActivities(prev => new Set(prev).add(key));
        onClaimPoints(30, activity.title);
        onLogActivity({ moodId, activityId, activityTitle: activity.title, timestamp: Date.now() });
      }
    }
  };

  const handleActivityComplete = (moodId: string, activityId: string, completedId: string) => {
    const activity = ACTIVITIES_MAP[completedId];
    const key = `${moodId}-${completedId}`;
    if (!claimedActivities.has(key)) {
      setClaimedActivities(prev => new Set(prev).add(key));
      if (soundEnabled) soundEngine.playTone('zen');
      onClaimPoints(30, activity?.title ?? completedId);
      onLogActivity({ moodId, activityId: completedId, activityTitle: activity?.title ?? completedId, timestamp: Date.now() });
    }
  };

  // ─── ACTIVITY VIEW ────────────────────────────────────────────────
  if (view.type === 'activity') {
    const activity = ACTIVITIES_MAP[view.activityId];
    const ComponentKey = activity?.componentKey;
    const ActivityComp = ComponentKey ? COMPONENT_MAP[ComponentKey] : undefined;

    return (
      <div className="relative z-10 max-w-lg mx-auto space-y-4">
        <button
          type="button"
          onClick={() => {
            const prevMood = MOODS_CONFIG.find(m => m.id === view.moodId);
            setView(prevMood ? { type: 'recommendations', mood: prevMood } : { type: 'grid' });
          }}
          className="flex items-center space-x-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <div className="glass-panel p-1 rounded-3xl">
          {ActivityComp ? (
            <ActivityComp
              theme={theme}
              onComplete={(id) => handleActivityComplete(view.moodId, view.activityId, id)}
            />
          ) : (
            <div className="p-8 text-center text-[var(--text-muted)] text-sm">
              Activity not found.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── RECOMMENDATIONS VIEW ─────────────────────────────────────────
  if (view.type === 'recommendations') {
    const { mood } = view;
    const primary = ACTIVITIES_MAP[mood.primaryActivityId];
    const alternatives = mood.alternativeActivityIds.map(id => ACTIVITIES_MAP[id]).filter(Boolean);

    return (
      <div className="relative z-10 max-w-2xl mx-auto space-y-4">
        {/* Back */}
        <button
          type="button"
          onClick={() => setView({ type: 'grid' })}
          className="flex items-center space-x-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Moods</span>
        </button>

        {/* Selected Mood Chip */}
        <div className="flex items-center space-x-3 glass-panel p-3 rounded-2xl">
          <span className="text-2xl">{mood.emoji}</span>
          <div>
            <div className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">You selected</div>
            <div className="text-sm font-black text-[var(--text)]">{mood.title}</div>
          </div>
        </div>

        {/* Primary Recommendation */}
        {primary && (
          <div>
            <div className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Recommended for You
            </div>
            <div
              className="glass-panel p-4 rounded-2xl border-2"
              style={{ borderColor: 'var(--accent)', boxShadow: '0 0 20px -8px var(--accent)' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-black text-[var(--text)]">{primary.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full glass-pill text-[var(--text-muted)] font-mono">
                      {primary.durationLabel}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed pr-4">
                    {primary.reason}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartActivity(mood.id, primary.id)}
                  className="ml-3 flex-shrink-0 flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alternative Activities */}
        {alternatives.length > 0 && (
          <div>
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Also try
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {alternatives.map(alt => (
                <div
                  key={alt.id}
                  className="glass-panel p-3 rounded-xl flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[var(--text)]">{alt.title}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono">{alt.durationLabel}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartActivity(mood.id, alt.id)}
                    className="ml-2 flex items-center space-x-1 px-3 py-1.5 rounded-lg glass-pill text-xs font-bold text-[var(--text)] hover:bg-[var(--surface-2)] transition-all cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Start</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EAP link */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => setEapOpen(true)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] underline transition-colors cursor-pointer flex items-center gap-1 mx-auto"
          >
            <LifeBuoy className="w-3 h-3" />
            Need more support?
          </button>
        </div>

        {/* EAP Modal */}
        {eapOpen && (
          <EAPModal
            url={eapHelplineUrl}
            onClose={() => setEapOpen(false)}
          />
        )}
      </div>
    );
  }

  // ─── MOOD GRID VIEW ───────────────────────────────────────────────
  return (
    <div className="relative z-10 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight text-[var(--text)] flex items-center gap-2">
            How are you feeling right now?
            {!hasFullAccess && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30 font-semibold">
                3 Free · 9 on Pro
              </span>
            )}
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Select your current state for a targeted wellness activity
          </p>
        </div>
        {!hasFullAccess && (
          <button
            type="button"
            onClick={() => onOpenUpgrade('Full Mood Coach (9 Moods)')}
            className="text-xs font-bold text-[var(--accent)] hover:opacity-80 flex items-center gap-1 cursor-pointer transition-opacity"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Unlock All 9
          </button>
        )}
      </div>

      {/* 9-Mood Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {MOODS_CONFIG.map((mood) => {
          const isFree = FREE_MOODS.includes(mood.id);
          const isLocked = !isFree && !hasFullAccess;
          return (
            <button
              key={mood.id}
              type="button"
              onClick={() => handleSelectMood(mood)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative group ${
                isLocked
                  ? 'glass-pill opacity-70 hover:opacity-100'
                  : 'glass-panel hover:border-[var(--accent)]/60 hover:shadow-md'
              }`}
            >
              {isLocked && (
                <div className="absolute top-2 right-2 text-[9px] font-bold px-1.5 rounded-md bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  Pro
                </div>
              )}
              <div className="text-2xl mb-1.5">{mood.emoji}</div>
              <div className="text-xs font-bold text-[var(--text)] leading-tight">{mood.title}</div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-snug">{mood.subtitle}</div>
              {!isLocked && (
                <ChevronRight className="w-3 h-3 text-[var(--text-muted)] absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          );
        })}
      </div>

      {/* Need more support link */}
      <div className="pt-1 text-center">
        <button
          type="button"
          onClick={() => setEapOpen(true)}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] underline transition-colors cursor-pointer flex items-center gap-1 mx-auto"
        >
          <LifeBuoy className="w-3 h-3" />
          Need more support?
        </button>
      </div>

      {/* EAP Modal */}
      {eapOpen && (
        <EAPModal
          url={eapHelplineUrl}
          onClose={() => setEapOpen(false)}
        />
      )}
    </div>
  );
};

// ─── EAP SUPPORT MODAL ────────────────────────────────────────────────────────
const EAPModal: React.FC<{ url?: string; onClose: () => void }> = ({ url, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
    <div className="glass-panel p-6 rounded-3xl max-w-sm w-full shadow-2xl border border-[var(--border)] space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto">
        <LifeBuoy className="w-6 h-6" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-sm font-bold text-[var(--text)]">Need More Support?</h3>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          If you're experiencing persistent stress, burnout, or mental health challenges,
          please reach out to a professional. You deserve support.
        </p>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-bold shadow-lg transition-all mt-2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Helpline / EAP
          </a>
        ) : (
          <div className="text-[10px] text-[var(--text-muted)] italic mt-1">
            Your EAP/helpline URL can be configured in Settings.
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-full py-2.5 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
      >
        Close
      </button>
    </div>
  </div>
);
