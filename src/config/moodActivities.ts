export type ActivityActionType =
  | 'component'
  | 'navigate_timer'
  | 'navigate_breathing'
  | 'navigate_games'
  | 'log_water';

export interface MoodActivityConfig {
  id: string;
  title: string;
  durationLabel: string;
  durationSec: number;
  reason: string;
  actionType: ActivityActionType;
  componentKey?: string;
  iconName?: string;
}

export interface MoodItem {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  primaryActivityId: string;
  alternativeActivityIds: string[];
}

export const ACTIVITIES_MAP: Record<string, MoodActivityConfig> = {
  '3-phase-breathing': {
    id: '3-phase-breathing',
    title: '3-Phase Breathing',
    durationLabel: '1 min',
    durationSec: 60,
    reason: 'Downregulates the sympathetic nervous system via 4s Inhale - 4s Hold - 4s Exhale rhythm.',
    actionType: 'navigate_breathing',
  },
  'grounding-54321': {
    id: 'grounding-54321',
    title: 'Grounding 5-4-3-2-1',
    durationLabel: '2 mins',
    durationSec: 120,
    reason: 'Breaks acute panic and spirals by anchoring cognitive attention to your immediate sensory environment.',
    actionType: 'component',
    componentKey: 'grounding',
  },
  'bubble-pop': {
    id: 'bubble-pop',
    title: 'Bubble Pop',
    durationLabel: '1 min',
    durationSec: 60,
    reason: 'Provides playful tactile tactile micro-stress dissipation and rapid dopamine replenishment.',
    actionType: 'navigate_games',
  },
  'desk-stretch': {
    id: 'desk-stretch',
    title: 'Desk Stretch',
    durationLabel: '2 mins',
    durationSec: 120,
    reason: 'Decompresses cervical spine, opens tight pectoral muscles, and restores postural circulation.',
    actionType: 'component',
    componentKey: 'desk-stretch',
  },
  'eye-rest-20-20-20': {
    id: 'eye-rest-20-20-20',
    title: 'Eye Rest 20-20-20',
    durationLabel: '20s',
    durationSec: 20,
    reason: 'Relaxes ciliary spasm and reduces asthenopia (ocular strain) by shifting optical focal depth.',
    actionType: 'component',
    componentKey: 'eye-rest',
  },
  'log-water': {
    id: 'log-water',
    title: 'Log Water',
    durationLabel: 'Quick',
    durationSec: 15,
    reason: 'Cellular rehydration prevents mild dehydration drop in cognitive stamina and executive focus.',
    actionType: 'log_water',
  },
  'brain-dump': {
    id: 'brain-dump',
    title: 'Brain Dump',
    durationLabel: '2 mins',
    durationSec: 120,
    reason: 'Frees working memory RAM by offloading racing thoughts and debugging loops into a private sandbox.',
    actionType: 'component',
    componentKey: 'brain-dump',
  },
  'walk-timer': {
    id: 'walk-timer',
    title: 'Walk Timer',
    durationLabel: '3 mins',
    durationSec: 180,
    reason: 'Optic flow from bilateral forward walking stimulates spontaneous problem-solving and creative divergence.',
    actionType: 'component',
    componentKey: 'walk-timer',
  },
  'kudos-note': {
    id: 'kudos-note',
    title: 'Kudos Note',
    durationLabel: '2 mins',
    durationSec: 120,
    reason: 'Writing authentic recognition triggers oxytocin release, curing isolation and deepening professional rapport.',
    actionType: 'component',
    componentKey: 'kudos-note',
  },
  'gratitude-note': {
    id: 'gratitude-note',
    title: 'Gratitude Note',
    durationLabel: '2 mins',
    durationSec: 120,
    reason: 'Neurochemically reinforces psychological safety and counteracts negativity bias during high-pressure sprints.',
    actionType: 'component',
    componentKey: 'gratitude-note',
  },
  'task-triage': {
    id: 'task-triage',
    title: 'Task Triage',
    durationLabel: '2 mins',
    durationSec: 120,
    reason: 'Cuts cognitive paralysis by sorting ambiguous noise and surfacing a single atomic next action.',
    actionType: 'component',
    componentKey: 'task-triage',
  },
  'energizer': {
    id: 'energizer',
    title: 'Energizer',
    durationLabel: '60s',
    durationSec: 60,
    reason: 'Surges oxygenated blood to the brain via high-velocity movement to dismantle midday sluggishness.',
    actionType: 'component',
    componentKey: 'energizer',
  },
  'long-exhale-breathing': {
    id: 'long-exhale-breathing',
    title: 'Long-Exhale Breathing',
    durationLabel: '1 min',
    durationSec: 60,
    reason: 'Extending the exhale (4s in, 6s out) engages the vagus nerve brake, neutralizing frustration and adrenaline.',
    actionType: 'component',
    componentKey: 'long-exhale',
  },
  'start-focus-session': {
    id: 'start-focus-session',
    title: 'Start Focus Session',
    durationLabel: '25 mins',
    durationSec: 1500,
    reason: 'Capitalizes on positive affect and cognitive readiness to smoothly enter the optimal flow state.',
    actionType: 'navigate_timer',
  },
};

export const MOODS_CONFIG: MoodItem[] = [
  {
    id: 'anxious',
    emoji: '😰',
    title: 'Anxious / Stressed',
    subtitle: 'High mental tension & nervous energy',
    primaryActivityId: '3-phase-breathing',
    alternativeActivityIds: ['grounding-54321', 'bubble-pop'],
  },
  {
    id: 'physically-tired',
    emoji: '🥱',
    title: 'Physically Tired',
    subtitle: 'Heavy limbs, posture slouch & fatigue',
    primaryActivityId: 'desk-stretch',
    alternativeActivityIds: ['eye-rest-20-20-20', 'log-water'],
  },
  {
    id: 'mentally-blocked',
    emoji: '🤯',
    title: 'Mentally Blocked',
    subtitle: 'Stuck on problem or cognitive loop',
    primaryActivityId: 'brain-dump',
    alternativeActivityIds: ['walk-timer'],
  },
  {
    id: 'isolated',
    emoji: '🤝',
    title: 'Isolated / Distant',
    subtitle: 'Solo deep work gap & feeling disconnected',
    primaryActivityId: 'kudos-note',
    alternativeActivityIds: ['gratitude-note'],
  },
  {
    id: 'overwhelmed',
    emoji: '🌪️',
    title: 'Overwhelmed',
    subtitle: 'Too many tabs, deadlines & scattered focus',
    primaryActivityId: 'task-triage',
    alternativeActivityIds: ['3-phase-breathing'],
  },
  {
    id: 'bored',
    emoji: '😴',
    title: 'Bored / Lethargic',
    subtitle: 'Low dopamine & dragging through tasks',
    primaryActivityId: 'energizer',
    alternativeActivityIds: ['bubble-pop'],
  },
  {
    id: 'frustrated',
    emoji: '😤',
    title: 'Frustrated / Irritated',
    subtitle: 'Blockers, debugging friction & agitated mood',
    primaryActivityId: 'long-exhale-breathing',
    alternativeActivityIds: ['brain-dump'],
  },
  {
    id: 'eye-strain',
    emoji: '👁️',
    title: 'Eye Strain / Headache',
    subtitle: 'Screen glare, burning eyes & tension headache',
    primaryActivityId: 'eye-rest-20-20-20',
    alternativeActivityIds: ['log-water'],
  },
  {
    id: 'feeling-good',
    emoji: '✨',
    title: 'Feeling Good',
    subtitle: 'High clarity, energized & ready to create',
    primaryActivityId: 'start-focus-session',
    alternativeActivityIds: ['log-water'],
  },
];
