import React, { useState, useRef } from 'react';
import {
  Sliders,
  Palette,
  Sun,
  Moon,
  Clock,
  Coffee,
  Utensils,
  Droplets,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  ShieldAlert,
  CheckCircle,
  Activity,
  Heart,
  ExternalLink,
  Sparkles,
  Upload,
  Music,
  Trash2,
} from 'lucide-react';
import { Settings, AppTheme, SoundTone } from '../types';
import { soundEngine } from '../utils/audio';
import { BackgroundColorMixer, SUITABLE_COLOR_PRESETS, getOrbColorPreview } from './BackgroundColorMixer';

interface SettingsTabProps {
  settings: Settings;
  orbConfig: { hue: number; saturation: number; glow: number };
  onSaveSettings: (newSettings: Settings) => void;
  onOrbConfigChange: (updates: { hue?: number; saturation?: number; glow?: number }) => void;
  onOrbReset: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  orbConfig,
  onSaveSettings,
  onOrbConfigChange,
  onOrbReset,
}) => {
  const isDark = settings.theme === 'dark';
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  // Trigger brief visual save confirmation
  const triggerSaved = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const updated = { ...settings, [key]: value };
    onSaveSettings(updated);
    triggerSaved();
  };

  const handleTestSound = () => {
    soundEngine.playTone(settings.selectedTone, settings.customSoundUrl);
  };

  const handleResetAllDefaults = () => {
    const defaults: Settings = {
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
      orbHue: 0,
      orbSaturation: 1.0,
      orbGlow: 1.0,
    };
    onSaveSettings(defaults);
    onOrbReset();
    triggerSaved();
  };

  const currentColorRgb = getOrbColorPreview(orbConfig.hue, orbConfig.saturation);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const updated = {
        ...settings,
        selectedTone: 'custom' as SoundTone,
        customSoundUrl: dataUrl,
        customSoundName: file.name,
      };
      onSaveSettings(updated);
      triggerSaved();
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomAudio = () => {
    const updated = {
      ...settings,
      selectedTone: 'chime' as SoundTone,
      customSoundUrl: undefined,
      customSoundName: undefined,
    };
    onSaveSettings(updated);
    triggerSaved();
  };

  return (
    <div className="relative z-10 max-w-3xl mx-auto space-y-5 pb-10">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between glass-panel p-4 rounded-3xl border border-[var(--border)] shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] flex items-center justify-center shadow-xs">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-[var(--text)] flex items-center gap-2">
              Settings & Customization
              {savedFeedback && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 animate-in fade-in">
                  <CheckCircle className="w-3 h-3" /> Saved
                </span>
              )}
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              Customize pacing timers, ambient background animation & sound chimes
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetAllDefaults}
          className="px-3 py-1.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors flex items-center gap-1.5 cursor-pointer"
          title="Restore factory default settings"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset Defaults</span>
        </button>
      </div>

      {/* ── SECTION 1: 3D BACKGROUND ANIMATION & COLOR MIXER ── */}
      <div className="glass-panel p-5 rounded-3xl border border-[var(--border)] space-y-4 shadow-md bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center shadow-xs"
              style={{
                backgroundColor: `${currentColorRgb}25`,
                color: currentColorRgb,
              }}
            >
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[var(--text)]">Background Animation Color Mixer</h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Tune the 3D energy orb shader color, saturation, and ambient luminosity (interacts live with the background)
              </p>
            </div>
          </div>
        </div>

        {/* Embedded Full Color Mixer */}
        <BackgroundColorMixer
          hue={orbConfig.hue}
          saturation={orbConfig.saturation}
          glow={orbConfig.glow}
          theme={settings.theme}
          onChange={onOrbConfigChange}
          onReset={onOrbReset}
          className="shadow-none border-[var(--border)]/70"
        />
      </div>

      {/* ── SECTION 2: APP APPEARANCE & THEME ── */}
      <div className="glass-panel p-5 rounded-3xl border border-[var(--border)] space-y-4 shadow-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shadow-xs">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-[var(--text)]">App Theme & Performance</h2>
            <p className="text-[11px] text-[var(--text-muted)]">
              Switch visual mode and reduce motion for energy saving
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Dark Mode Card */}
          <button
            type="button"
            onClick={() => updateSetting('theme', 'dark')}
            className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-950/80 border-[var(--accent)] ring-1 ring-[var(--accent)] shadow-md shadow-purple-500/20'
                : 'glass-pill hover:bg-[var(--surface-2)]'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--text)]">Dark Cosmic</div>
                <div className="text-[10px] text-[var(--text-muted)]">OLED-friendly dark palette</div>
              </div>
            </div>
            {isDark && <CheckCircle className="w-4 h-4 text-[var(--accent)]" />}
          </button>

          {/* Light Mode Card */}
          <button
            type="button"
            onClick={() => updateSetting('theme', 'light')}
            className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              !isDark
                ? 'bg-white border-purple-500 ring-1 ring-purple-500 shadow-md shadow-purple-500/20'
                : 'glass-pill hover:bg-[var(--surface-2)]'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--text)]">Crisp Daylight</div>
                <div className="text-[10px] text-[var(--text-muted)]">High contrast light theme</div>
              </div>
            </div>
            {!isDark && <CheckCircle className="w-4 h-4 text-[var(--accent)]" />}
          </button>
        </div>

        {/* Reduce Motion Toggle */}
        <div className="flex items-center justify-between p-3 rounded-2xl glass-pill border border-[var(--border)]">
          <div className="flex items-center space-x-2.5">
            <Activity className="w-4 h-4 text-[var(--accent)]" />
            <div>
              <div className="text-xs font-bold text-[var(--text)]">Reduce 3D Motion</div>
              <div className="text-[10px] text-[var(--text-muted)]">
                Stops background orb and particle floating for maximum battery life
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.reduceMotion || false}
            onChange={(e) => updateSetting('reduceMotion', e.target.checked)}
            className="w-4 h-4 accent-[var(--accent)] rounded cursor-pointer"
          />
        </div>
      </div>

      {/* ── SECTION 3: ERGONOMIC PACING TIMERS ── */}
      <div className="glass-panel p-5 rounded-3xl border border-[var(--border)] space-y-4 shadow-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shadow-xs">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-[var(--text)]">Pacing & Break Durations</h2>
            <p className="text-[11px] text-[var(--text-muted)]">
              Tailor your Pomodoro work sprint, restorative micro-break, and lunch duration
            </p>
          </div>
        </div>

        {/* Focus Sprint Duration */}
        <div className="space-y-3 p-3.5 rounded-2xl glass-pill border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[var(--accent)]" /> Focus Session Duration
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="180"
                value={settings.breakIntervalMins}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val > 0) updateSetting('breakIntervalMins', val);
                }}
                className="w-16 px-2 py-0.5 text-xs font-mono font-bold text-center rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--accent)] focus:outline-none focus:border-[var(--accent)]"
              />
              <span className="text-xs text-[var(--text-muted)] font-semibold">min</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[15, 20, 25, 45].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => updateSetting('breakIntervalMins', mins)}
                className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  settings.breakIntervalMins === mins
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)] shadow-xs'
                    : 'glass-panel text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Rest Break Duration */}
        <div className="space-y-3 p-3.5 rounded-2xl glass-pill border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-emerald-400" /> Rest Break Duration
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="60"
                value={settings.breakDurationMins || 3}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val > 0) updateSetting('breakDurationMins', val);
                }}
                className="w-16 px-2 py-0.5 text-xs font-mono font-bold text-center rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-xs text-[var(--text-muted)] font-semibold">min</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[2, 3, 5, 10].map((bmins) => (
              <button
                key={bmins}
                type="button"
                onClick={() => updateSetting('breakDurationMins', bmins)}
                className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  (settings.breakDurationMins || 3) === bmins
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                    : 'glass-panel text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {bmins}m Break
              </button>
            ))}
          </div>
        </div>

        {/* Lunch Break Duration */}
        <div className="space-y-3 p-3.5 rounded-2xl glass-pill border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-amber-400" /> Dedicated Lunch Duration
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="5"
                max="180"
                value={settings.lunchBreakMins || 45}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val > 0) updateSetting('lunchBreakMins', val);
                }}
                className="w-16 px-2 py-0.5 text-xs font-mono font-bold text-center rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-amber-400 focus:outline-none focus:border-amber-500"
              />
              <span className="text-xs text-[var(--text-muted)] font-semibold">min</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[30, 45, 60].map((lmins) => (
              <button
                key={lmins}
                type="button"
                onClick={() => updateSetting('lunchBreakMins', lmins)}
                className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  (settings.lunchBreakMins || 45) === lmins
                    ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                    : 'glass-panel text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <Utensils className="w-3 h-3" />
                <span>{lmins}m Lunch</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 4: HYDRATION & SOUND ALERTS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Hydration Goal */}
        <div className="glass-panel p-5 rounded-3xl border border-[var(--border)] space-y-3 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Droplets className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-black text-[var(--text)] whitespace-nowrap">Daily Hydration Goal</h3>
              </div>
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <input
                  type="number"
                  min="250"
                  max="10000"
                  step="50"
                  value={settings.waterTargetMl}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val > 0) updateSetting('waterTargetMl', val);
                  }}
                  className="w-20 px-2 py-0.5 text-xs font-mono font-bold text-center rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-cyan-400 focus:outline-none focus:border-cyan-500"
                />
                <span className="text-xs text-[var(--text-muted)] font-semibold">ml</span>
              </div>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mb-3">
              Target fluid intake to sustain cognitive energy
            </p>

            <div className="grid grid-cols-3 gap-1.5">
              {[1500, 2000, 2500].map((ml) => (
                <button
                  key={ml}
                  type="button"
                  onClick={() => updateSetting('waterTargetMl', ml)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    settings.waterTargetMl === ml
                      ? 'bg-cyan-600 text-white border-cyan-500 shadow-xs'
                      : 'glass-pill text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {ml} ml
                </button>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-cyan-400/90 font-mono text-center pt-2">
            ≈ {Math.round(settings.waterTargetMl / 250)} standard glasses
          </div>
        </div>

        {/* Audio Alerts */}
        <div className="glass-panel p-5 rounded-3xl border border-[var(--border)] space-y-3 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Volume2 className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-black text-[var(--text)]">Audio Chime Alerts</h3>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mb-3">
              Gentle acoustic notification when sessions complete
            </p>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2 rounded-xl glass-pill">
                <span className="text-xs font-bold text-[var(--text)]">Sound Enabled</span>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => updateSetting('soundEnabled', e.target.checked)}
                  className="w-4 h-4 accent-[var(--accent)] rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={settings.selectedTone}
                  onChange={(e) => updateSetting('selectedTone', e.target.value as SoundTone)}
                  className="flex-1 rounded-xl px-3 py-1.5 text-xs font-semibold glass-pill border border-[var(--border)] text-[var(--text)] focus:outline-hidden cursor-pointer"
                >
                  <option value="chime">Gentle Chime</option>
                  <option value="zen">Zen Singing Bowl</option>
                  <option value="bell">Soft Bell</option>
                  <option value="marimba">Warm Marimba</option>
                  <option value="splash">Gentle Splash</option>
                  {settings.customSoundUrl && (
                    <option value="custom">🎵 {settings.customSoundName || 'Custom Audio'}</option>
                  )}
                </select>

                <button
                  type="button"
                  onClick={handleTestSound}
                  className="px-3 py-1.5 rounded-xl bg-[var(--accent)]/20 hover:bg-[var(--accent)]/30 border border-[var(--accent)]/40 text-[var(--accent)] text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Test selected alert tone"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Test</span>
                </button>
              </div>

              {/* Upload music from device */}
              <div className="pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {!settings.customSoundUrl ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-xl border border-dashed border-[var(--border)] hover:border-[var(--accent)] bg-[var(--surface-2)]/60 hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Upload className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Upload Alert Music from Device</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/30">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Music className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                      <span className="text-[11px] font-bold text-[var(--text)] truncate">
                        {settings.customSoundName || 'Custom Audio'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold text-[var(--accent)] hover:bg-[var(--accent)]/20 cursor-pointer"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveCustomAudio}
                        className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                        title="Remove custom audio"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 5: STRICT MODE & WELLNESS SUPPORT ── */}
      <div className="glass-panel p-5 rounded-3xl border border-[var(--border)] space-y-4 shadow-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shadow-xs">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-[var(--text)]">Discipline & Employee Wellness</h2>
            <p className="text-[11px] text-[var(--text-muted)]">
              Anti-cheat screen lock and mental health support links
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          {/* Strict Mode */}
          <div className="flex items-center justify-between p-3 rounded-2xl glass-pill border border-[var(--border)]">
            <div>
              <div className="text-xs font-bold text-[var(--text)]">Anti-Cheat Strict Break Lock</div>
              <div className="text-[10px] text-[var(--text-muted)]">
                Locks break window to prevent skipping rest periods
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.strictMode}
              onChange={(e) => updateSetting('strictMode', e.target.checked)}
              className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
            />
          </div>

          {/* EAP Helpline URL */}
          <div className="p-3 rounded-2xl glass-pill border border-[var(--border)] space-y-1.5">
            <label className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              Employee Assistance Helpline / EAP Portal URL
            </label>
            <input
              type="url"
              placeholder="https://company-eap-helpline.org"
              value={settings.eapHelplineUrl || ''}
              onChange={(e) => updateSetting('eapHelplineUrl', e.target.value)}
              className="w-full rounded-xl px-3 py-1.5 text-xs font-mono glass-panel border border-[var(--border)] text-[var(--text)] focus:outline-hidden focus:border-[var(--accent)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
