import React, { useState, useEffect } from 'react';
import { X, Heart, Sparkles, Trophy, Gamepad2, Play, Pause, RefreshCcw, CheckCircle, Smile, ArrowRight, Timer, RotateCcw } from 'lucide-react';
import { AppTheme } from '../types';
import { soundEngine } from '../utils/audio';

interface BreakActivitiesModalProps {
  isOpen: boolean;
  theme: AppTheme;
  onClose: () => void;
  onClaimBonus: (bonusPts: number, activityName: string) => void;
}

export type MoodType = 'ANXIOUS' | 'TIRED' | 'BLOCKED' | 'ISOLATED' | 'OVERLOADED' | 'BORED';

interface Recommendation {
  id: string;
  title: string;
  desc: string;
  durationSecs: number;
  actionType?: 'BREATHING' | 'GAME' | 'GUIDED_TIMER';
}

interface MoodOption {
  id: MoodType;
  emoji: string;
  label: string;
  recommendations: Recommendation[];
}

const MOOD_OPTIONS: MoodOption[] = [
  {
    id: 'ANXIOUS',
    emoji: '😰',
    label: 'Feeling Anxious / Stressed',
    recommendations: [
      { id: 'rec_box', title: 'Guided Breathing (Inhale - Hold - Exhale)', desc: '4s Inhale, 4s Hold, 4s Exhale', durationSecs: 60, actionType: 'BREATHING' },
      { id: 'rec_mind', title: 'Mindfulness 60s Pause', desc: 'Close eyes & focus on 3 quiet deep breaths', durationSecs: 60, actionType: 'GUIDED_TIMER' },
      { id: 'rec_walk1', title: 'Quiet 2-Min Walk', desc: 'Step away from screen for a 2-minute quiet walk', durationSecs: 120, actionType: 'GUIDED_TIMER' },
    ],
  },
  {
    id: 'TIRED',
    emoji: '🥱',
    label: 'Feeling Physically Tired',
    recommendations: [
      { id: 'rec_stretch', title: '60s Ergonomic Body Stretch', desc: 'Roll shoulders, stretch neck & wrists', durationSecs: 60, actionType: 'GUIDED_TIMER' },
      { id: 'rec_water', title: 'Hydration Refresh', desc: 'Drink 250ml of cool fresh water', durationSecs: 30, actionType: 'GUIDED_TIMER' },
      { id: 'rec_circ', title: '2-Min Circulation Walk', desc: 'Walk around office or room to boost blood flow', durationSecs: 120, actionType: 'GUIDED_TIMER' },
    ],
  },
  {
    id: 'BLOCKED',
    emoji: '🤯',
    label: 'Feeling Mentally Blocked',
    recommendations: [
      { id: 'rec_window', title: 'Window / Outdoor Gaze (2 Mins)', desc: 'Look out window at a distant object', durationSecs: 120, actionType: 'GUIDED_TIMER' },
      { id: 'rec_music', title: '60s Calm Music Interlude', desc: 'Listen to 60 seconds of relaxing audio', durationSecs: 60, actionType: 'GUIDED_TIMER' },
      { id: 'rec_chat', title: 'Short Teammate Catch-up', desc: 'Have a brief 1-minute chat with a colleague', durationSecs: 60, actionType: 'GUIDED_TIMER' },
    ],
  },
  {
    id: 'ISOLATED',
    emoji: '🤝',
    label: 'Feeling Isolated / Distant',
    recommendations: [
      { id: 'rec_pantry', title: '2-Min Pantry Refresh', desc: 'Grab a tea, coffee or water at the pantry', durationSecs: 120, actionType: 'GUIDED_TIMER' },
      { id: 'rec_pos', title: 'Positive Colleague Chat', desc: 'Say hi or share a positive word with a teammate', durationSecs: 60, actionType: 'GUIDED_TIMER' },
    ],
  },
  {
    id: 'OVERLOADED',
    emoji: '🌪️',
    label: 'Feeling Overloaded / Overwhelmed',
    recommendations: [
      { id: 'rec_detox', title: '60s Digital Detox Minute', desc: 'Close all tabs & rest eyes for 60 seconds', durationSecs: 60, actionType: 'GUIDED_TIMER' },
      { id: 'rec_task', title: 'Priority Task Focus Reset', desc: 'Pick 1 tiny task to complete first', durationSecs: 45, actionType: 'GUIDED_TIMER' },
    ],
  },
  {
    id: 'BORED',
    emoji: '🥱',
    label: 'Feeling Bored / Unmotivated',
    recommendations: [
      { id: 'rec_game', title: 'Stress Buster Bubble Game', desc: 'Quick 30-second interactive bubble pop game', durationSecs: 30, actionType: 'GAME' },
      { id: 'rec_seat', title: 'Location Shift Break', desc: 'Move to a standing desk or new seat', durationSecs: 60, actionType: 'GUIDED_TIMER' },
    ],
  },
];

export const BreakActivitiesModal: React.FC<BreakActivitiesModalProps> = ({
  isOpen,
  theme,
  onClose,
  onClaimBonus,
}) => {
  const [activeTab, setActiveTab] = useState<'MOOD' | 'BREATHING' | 'GAME' | 'TIMED_ACTIVITY'>('MOOD');
  const [selectedMood, setSelectedMood] = useState<MoodType>('ANXIOUS');
  const [activeRecommendation, setActiveRecommendation] = useState<Recommendation | null>(null);

  const isDark = theme === 'dark';

  // 3-Phase Breathing State Machine: INHALE (4s) -> HOLD (4s) -> EXHALE (4s)
  const [breathPhase, setBreathPhase] = useState<'INHALE' | 'HOLD' | 'EXHALE'>('INHALE');
  const [breathSecs, setBreathSecs] = useState<number>(4);
  const [breathCycles, setBreathCycles] = useState<number>(0);
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);

  // Guided Activity Timer States
  const [activityTimeLeft, setActivityTimeLeft] = useState<number>(60);
  const [isActivityRunning, setIsActivityRunning] = useState<boolean>(false);
  const [activityCompleted, setActivityCompleted] = useState<boolean>(false);

  // Bubble Pop Game States
  const [bubbles, setBubbles] = useState<Array<{ id: number; popped: boolean; color: string }>>([]);
  const [popScore, setPopScore] = useState<number>(0);
  const [claimedBonus, setClaimedBonus] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setIsBreathingActive(false);
      setBreathCycles(0);
      setBreathPhase('INHALE');
      setBreathSecs(4);
      setClaimedBonus(false);
      setActivityCompleted(false);
      resetBubbleGame();
    }
  }, [isOpen]);

  // Breathing 3-Phase Countdown Engine: INHALE (4s) -> HOLD (4s) -> EXHALE (4s)
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isBreathingActive && isOpen && activeTab === 'BREATHING') {
      timer = setInterval(() => {
        setBreathSecs((prev) => {
          if (prev > 1) {
            return prev - 1;
          }

          // When seconds reach 1, transition to next phase
          if (breathPhase === 'INHALE') {
            setBreathPhase('HOLD');
            soundEngine.playTone('chime');
            return 4;
          } else if (breathPhase === 'HOLD') {
            setBreathPhase('EXHALE');
            soundEngine.playTone('chime');
            return 4;
          } else {
            // EXHALE finished! Complete 1 full cycle
            setBreathPhase('INHALE');
            setBreathCycles((c) => c + 1);
            soundEngine.playTone('zen');
            return 4;
          }
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isBreathingActive, isOpen, activeTab, breathPhase]);

  // Guided Activity Timer Engine
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isActivityRunning && isOpen && activeTab === 'TIMED_ACTIVITY' && activityTimeLeft > 0) {
      timer = setInterval(() => {
        setActivityTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (activityTimeLeft === 0 && isActivityRunning && activeTab === 'TIMED_ACTIVITY') {
      setIsActivityRunning(false);
      setActivityCompleted(true);
      soundEngine.playTone('zen');
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActivityRunning, activityTimeLeft, isOpen, activeTab]);

  const handleStartGuidedActivity = (rec: Recommendation) => {
    setActiveRecommendation(rec);
    setActivityTimeLeft(rec.durationSecs);
    setIsActivityRunning(true);
    setActivityCompleted(false);
    setActiveTab('TIMED_ACTIVITY');
    soundEngine.playTone('chime');
  };

  const resetBubbleGame = () => {
    const colors = ['bg-cyan-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
    const newBubbles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      popped: false,
      color: colors[i % colors.length],
    }));
    setBubbles(newBubbles);
    setPopScore(0);
  };

  const handlePopBubble = (id: number) => {
    setBubbles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, popped: true } : b))
    );
    setPopScore((s) => s + 10);
    soundEngine.playTone('splash');
  };

  const handleClaimBonus = (activity: string) => {
    onClaimBonus(30, activity);
    setClaimedBonus(true);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  // 3-Phase Display Info
  const getPhaseText = () => {
    switch (breathPhase) {
      case 'INHALE':
        return { step: 1, title: '4s Inhale 🌬️', desc: 'Slowly breathe in deeply', color: 'text-cyan-400', activeId: 'INHALE' };
      case 'HOLD':
        return { step: 2, title: '4s Hold ⏸️', desc: 'Hold breath gently inside', color: 'text-indigo-400', activeId: 'HOLD' };
      case 'EXHALE':
        return { step: 3, title: '4s Exhale 😮‍💨', desc: 'Slowly release all air & tension', color: 'text-emerald-400', activeId: 'EXHALE' };
    }
  };

  const phaseInfo = getPhaseText();
  const currentMoodObj = MOOD_OPTIONS.find((m) => m.id === selectedMood) || MOOD_OPTIONS[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-sm rounded-2xl p-4 shadow-2xl border space-y-3 flex flex-col max-h-[92vh] ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header Navigation Tabs */}
        <div className={`flex items-center justify-between border-b pb-2.5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex space-x-1">
            <button
              type="button"
              onClick={() => setActiveTab('MOOD')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'MOOD'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : isDark ? 'bg-slate-950/40 text-slate-400 hover:text-slate-200' : 'bg-slate-100 text-slate-600 hover:text-slate-800'
              }`}
            >
              <Smile className="w-3.5 h-3.5" />
              <span>Mood Coach</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('BREATHING')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'BREATHING'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : isDark ? 'bg-slate-950/40 text-slate-400 hover:text-slate-200' : 'bg-slate-100 text-slate-600 hover:text-slate-800'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Breathing</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('GAME')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'GAME'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : isDark ? 'bg-slate-950/40 text-slate-400 hover:text-slate-200' : 'bg-slate-100 text-slate-600 hover:text-slate-800'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Game</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab 1: Mood Coach */}
        {activeTab === 'MOOD' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
            <div className="space-y-1">
              <label className={`text-xs font-bold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>How are you feeling right now?</label>
              <div className="grid grid-cols-2 gap-1.5">
                {MOOD_OPTIONS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMood(m.id)}
                    className={`flex items-center space-x-1.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedMood === m.id
                        ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold shadow-sm'
                        : isDark
                        ? 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-base">{m.emoji}</span>
                    <span className="text-[11px] truncate">{m.label.split(' ')[1] || m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Targeted Recommendations List */}
            <div className="space-y-2 pt-1 border-t border-slate-800">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                {currentMoodObj.emoji} Recommended for {currentMoodObj.label}:
              </span>

              <div className="space-y-1.5">
                {currentMoodObj.recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className={`text-xs font-bold flex items-center gap-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        <span>{rec.title}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{rec.desc}</div>
                    </div>

                    {rec.actionType === 'BREATHING' ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab('BREATHING')}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold flex items-center gap-1 hover:bg-cyan-500/30 transition-colors cursor-pointer"
                      >
                        Start <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : rec.actionType === 'GAME' ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab('GAME')}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-500/30 transition-colors cursor-pointer"
                      >
                        Play <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartGuidedActivity(rec)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                      >
                        <Timer className="w-3 h-3 text-emerald-400" />
                        <span>Start {rec.durationSecs}s</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 3-Step Breathing (4s Inhale -> 4s Hold -> 4s Exhale) */}
        {activeTab === 'BREATHING' && (
          <div className="flex-1 flex flex-col items-center justify-between space-y-3 py-1">
            {/* 3 Step Indicator Cards */}
            <div className="grid grid-cols-3 gap-1.5 w-full text-center">
              {[
                { id: 'INHALE', label: '1. 4s Inhale 🌬️', color: 'border-cyan-500 text-cyan-400 bg-cyan-500/20' },
                { id: 'HOLD', label: '2. 4s Hold ⏸️', color: 'border-indigo-500 text-indigo-400 bg-indigo-500/20' },
                { id: 'EXHALE', label: '3. 4s Exhale 😮‍💨', color: 'border-emerald-500 text-emerald-400 bg-emerald-500/20' },
              ].map((step) => (
                <div
                  key={step.id}
                  className={`py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    breathPhase === step.id
                      ? `${step.color} shadow-lg scale-105 font-extrabold animate-pulse`
                      : 'border-slate-800 text-slate-500 bg-slate-950/40'
                  }`}
                >
                  {step.label}
                </div>
              ))}
            </div>

            <div className="text-center space-y-0.5">
              <div className={`text-base font-extrabold font-mono tracking-wide ${phaseInfo.color}`}>
                {phaseInfo.title}
              </div>
              <p className="text-[11px] text-slate-400">{phaseInfo.desc}</p>
            </div>

            {/* Breathing Visual Circle */}
            <div className="relative w-32 h-32 flex items-center justify-center">
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
                <span className={`text-4xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-800'}`}>{breathSecs}</span>
                <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                  12s Cycle #{breathCycles + 1}
                </div>
              </div>
            </div>

            {/* Control & Bonus Claim */}
            <div className={`flex items-center space-x-2 w-full pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setIsBreathingActive(!isBreathingActive)}
                className={`p-2.5 rounded-xl transition-colors cursor-pointer ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
              >
                {isBreathingActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                type="button"
                disabled={breathCycles < 1 || claimedBonus}
                onClick={() => handleClaimBonus('Guided Breathing (Inhale-Hold-Exhale)')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  claimedBonus
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : breathCycles >= 1
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-md shadow-emerald-500/30 animate-pulse cursor-pointer'
                    : 'bg-slate-950/60 text-slate-500 border border-slate-800 cursor-not-allowed'
                }`}
              >
                {claimedBonus ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Claimed +30 Bonus Pts!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{breathCycles >= 1 ? 'Claim +30 Bonus Pts!' : 'Complete 1 Cycle (12s) to Claim'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Timed Guided Activity */}
        {activeTab === 'TIMED_ACTIVITY' && activeRecommendation && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-2">
            <div className="text-center space-y-1">
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold uppercase tracking-wider">
                Guided Activity Timer
              </span>
              <h3 className="text-base font-extrabold text-white">{activeRecommendation.title}</h3>
              <p className="text-[11px] text-slate-400">{activeRecommendation.desc}</p>
            </div>

            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="6" className="text-slate-800" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-emerald-500 transition-all duration-1000"
                  fill="transparent"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * activityTimeLeft) / activeRecommendation.durationSecs}
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black font-mono text-white">{formatTime(activityTimeLeft)}</span>
                <span className="text-[10px] text-slate-400 font-medium">{activityCompleted ? 'Complete!' : 'In Progress'}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsActivityRunning(!isActivityRunning)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              >
                {isActivityRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivityTimeLeft(activeRecommendation.durationSecs);
                  setIsActivityRunning(true);
                  setActivityCompleted(false);
                }}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                title="Restart Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={!activityCompleted || claimedBonus}
                onClick={() => handleClaimBonus(activeRecommendation.title)}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  claimedBonus
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : activityCompleted
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-md shadow-emerald-500/30 animate-bounce cursor-pointer'
                    : 'bg-slate-950/60 text-slate-500 border border-slate-800 cursor-not-allowed'
                }`}
              >
                {claimedBonus ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Bonus Claimed (+30 pts)!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{activityCompleted ? 'Claim +30 Bonus Pts!' : 'Complete Timer to Claim Bonus'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Bubble Pop Game */}
        {activeTab === 'GAME' && (
          <div className="flex-1 flex flex-col justify-between space-y-3 py-1">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold flex items-center gap-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> Stress Score: {popScore} pts
              </span>
              <button
                type="button"
                onClick={resetBubbleGame}
                className={`text-[11px] flex items-center gap-1 transition-colors cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <RefreshCcw className="w-3 h-3" /> Reset Grid
              </button>
            </div>

            <div className={`grid grid-cols-4 gap-2.5 p-3 rounded-2xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              {bubbles.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => !b.popped && handlePopBubble(b.id)}
                  className={`w-12 h-12 rounded-full transition-all duration-300 flex items-center justify-center text-xs font-bold shadow-md cursor-pointer ${
                    b.popped
                      ? 'scale-50 opacity-20 bg-slate-800 text-slate-600'
                      : `${b.color} hover:scale-110 active:scale-90 text-white shadow-cyan-500/20`
                  }`}
                >
                  {b.popped ? '💥' : '🎈'}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={popScore < 50 || claimedBonus}
              onClick={() => handleClaimBonus('Stress Buster Game')}
              className={`w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                claimedBonus
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : popScore >= 50
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-md shadow-emerald-500/30 animate-pulse cursor-pointer'
                  : 'bg-slate-950/60 text-slate-500 border border-slate-800 cursor-not-allowed'
              }`}
            >
              {claimedBonus ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Bonus Claimed (+30 pts)!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{popScore >= 50 ? 'Claim +30 Bonus Pts!' : 'Pop 5 Bubbles to Claim Bonus'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
