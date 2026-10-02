import React, { useState, useEffect } from 'react';
import { X, Volume2, VolumeX, ShieldAlert, Sliders, BellOff, Check, Music, Upload, Play, Sun, Moon, Utensils, Coffee } from 'lucide-react';
import { Settings, SoundTone } from '../types';
import { soundEngine } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  settings: Settings;
  onClose: () => void;
  onSaveSettings: (newSettings: Settings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSaveSettings,
}) => {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [customMinsInput, setCustomMinsInput] = useState<string>('');
  const [customBreakMinsInput, setCustomBreakMinsInput] = useState<string>('');
  const [customMlInput, setCustomMlInput] = useState<string>('');

  useEffect(() => {
    setLocalSettings(settings);
    setCustomMinsInput(settings.breakIntervalMins.toString());
    setCustomBreakMinsInput((settings.breakDurationMins || 3).toString());
    setCustomMlInput(settings.waterTargetMl.toString());
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const isDark = localSettings.theme === 'dark';

  const handleApplyCustomMins = () => {
    const mins = parseInt(customMinsInput, 10);
    if (!isNaN(mins) && mins > 0) {
      setLocalSettings((prev) => ({ ...prev, breakIntervalMins: mins }));
    }
  };

  const handleApplyCustomBreakMins = () => {
    const bmins = parseInt(customBreakMinsInput, 10);
    if (!isNaN(bmins) && bmins > 0) {
      setLocalSettings((prev) => ({ ...prev, breakDurationMins: bmins }));
    }
  };

  const handleApplyCustomMl = () => {
    const ml = parseInt(customMlInput, 10);
    if (!isNaN(ml) && ml > 0) {
      setLocalSettings((prev) => ({ ...prev, waterTargetMl: ml }));
    }
  };

  const handleSave = () => {
    const mins = parseInt(customMinsInput, 10);
    const bmins = parseInt(customBreakMinsInput, 10);
    const ml = parseInt(customMlInput, 10);

    const updated: Settings = {
      ...localSettings,
      breakIntervalMins: !isNaN(mins) && mins > 0 ? mins : localSettings.breakIntervalMins,
      breakDurationMins: !isNaN(bmins) && bmins > 0 ? bmins : localSettings.breakDurationMins,
      waterTargetMl: !isNaN(ml) && ml > 0 ? ml : localSettings.waterTargetMl,
    };

    onSaveSettings(updated);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLocalSettings({
        ...localSettings,
        selectedTone: 'custom',
        customSoundUrl: url,
        customSoundName: file.name,
      });
    }
  };

  const handleTestSound = () => {
    soundEngine.playTone(localSettings.selectedTone, localSettings.customSoundUrl);
  };

  const handleResetDefaults = () => {
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
    };
    setLocalSettings(defaults);
    setCustomMinsInput('25');
    setCustomMlInput('2000');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-b ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-indigo-500" />
            <h2 className="text-xs font-bold tracking-tight">PausePulse Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Theme Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold block">App Theme</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, theme: 'dark' })}
                className={`flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  localSettings.theme === 'dark'
                    ? 'bg-slate-950 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dark Mode</span>
              </button>

              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, theme: 'light' })}
                className={`flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  localSettings.theme === 'light'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-md shadow-indigo-500/10 font-bold'
                    : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light Mode</span>
              </button>
            </div>
          </div>

          {/* Custom Focus Session Duration with Apply Button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold">Focus Session Duration (Mins)</label>
              <span className="text-[11px] font-mono text-indigo-500 font-bold">{localSettings.breakIntervalMins} mins</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-1.5">
              {[15, 20, 25, 45].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    setLocalSettings({ ...localSettings, breakIntervalMins: mins });
                    setCustomMinsInput(mins.toString());
                  }}
                  className={`py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    localSettings.breakIntervalMins === mins
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                      : isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>

            {/* Custom Focus Mins Input with Explicit Set Button */}
            <div className="flex items-center space-x-1.5">
              <input
                type="number"
                placeholder="Custom minutes (e.g. 50)"
                value={customMinsInput}
                onChange={(e) => setCustomMinsInput(e.target.value)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono border ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
              <button
                type="button"
                onClick={handleApplyCustomMins}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Set Mins
              </button>
            </div>
          </div>

          {/* Dedicated Lunch Break Duration */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold flex items-center gap-1">
                <Utensils className="w-3.5 h-3.5 text-amber-500" /> Dedicated Lunch Break (Mins)
              </label>
              <span className="text-[11px] font-mono text-amber-500 font-bold">{localSettings.lunchBreakMins || 45} mins</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[30, 45, 60].map((lmins) => (
                <button
                  key={lmins}
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, lunchBreakMins: lmins })}
                  className={`py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    (localSettings.lunchBreakMins || 45) === lmins
                      ? 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-500/20 font-bold'
                      : isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  🍱 {lmins}m Lunch
                </button>
              ))}
            </div>
          </div>

          {/* Micro / Rest Break Duration with Presets & Manual Custom Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold flex items-center gap-1">
                <Coffee className="w-3.5 h-3.5 text-emerald-500" /> Rest Break Duration (Mins)
              </label>
              <span className="text-[11px] font-mono text-emerald-500 font-bold">{localSettings.breakDurationMins || 3} mins</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-1.5">
              {[2, 3, 5, 10].map((bmins) => (
                <button
                  key={bmins}
                  type="button"
                  onClick={() => {
                    setLocalSettings({ ...localSettings, breakDurationMins: bmins });
                    setCustomBreakMinsInput(bmins.toString());
                  }}
                  className={`py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    (localSettings.breakDurationMins || 3) === bmins
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-500/20 font-bold'
                      : isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {bmins}m Break
                </button>
              ))}
            </div>

            {/* Custom Break Mins Input with Explicit Set Button */}
            <div className="flex items-center space-x-1.5">
              <input
                type="number"
                placeholder="Custom break mins (e.g. 7)"
                value={customBreakMinsInput}
                onChange={(e) => setCustomBreakMinsInput(e.target.value)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 font-mono border ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
              <button
                type="button"
                onClick={handleApplyCustomBreakMins}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Set Break
              </button>
            </div>
          </div>

          {/* Custom Daily Hydration Target with Apply Button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold">Daily Hydration Target (ml)</label>
              <span className="text-[11px] font-mono text-cyan-500 font-bold">{localSettings.waterTargetMl} ml</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mb-1.5">
              {[1500, 2000, 2500].map((ml) => (
                <button
                  key={ml}
                  type="button"
                  onClick={() => {
                    setLocalSettings({ ...localSettings, waterTargetMl: ml });
                    setCustomMlInput(ml.toString());
                  }}
                  className={`py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    localSettings.waterTargetMl === ml
                      ? 'bg-cyan-600 border-cyan-500 text-white shadow-md shadow-cyan-500/20'
                      : isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {ml} ml
                </button>
              ))}
            </div>

            {/* Custom Hydration Input with Explicit Set Button */}
            <div className="flex items-center space-x-1.5">
              <input
                type="number"
                placeholder="Custom target ml (e.g. 3000)"
                value={customMlInput}
                onChange={(e) => setCustomMlInput(e.target.value)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500 font-mono border ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
              <button
                type="button"
                onClick={handleApplyCustomMl}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Set Target
              </button>
            </div>
          </div>

          {/* Sound Tone Selection */}
          <div className={`space-y-2 pt-2 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-cyan-500" />
                <span>Alert Sound Tone</span>
              </label>
              <button
                type="button"
                onClick={handleTestSound}
                className="flex items-center space-x-1 px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3 fill-indigo-400" />
                <span>Test Tone</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'chime', name: 'Gentle Chime' },
                { id: 'splash', name: 'Water Splash' },
                { id: 'zen', name: 'Zen Bowl' },
                { id: 'digital', name: 'Digital Beep' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, selectedTone: t.id as SoundTone })}
                  className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-left transition-all cursor-pointer ${
                    localSettings.selectedTone === t.id
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-400 font-semibold'
                      : isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            {/* Upload Custom Audio File */}
            <div className="pt-1">
              <label
                className={`flex items-center justify-between p-2 rounded-xl border border-dashed hover:border-indigo-500/60 cursor-pointer transition-colors ${
                  isDark ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <Upload className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="truncate max-w-[200px]">
                    {localSettings.customSoundName || 'Upload custom sound (.mp3, .wav)'}
                  </span>
                </div>
                <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Toggles */}
          <div className={`space-y-2 pt-2 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
            {/* Audio Toggle */}
            <div
              className={`flex items-center justify-between p-2.5 rounded-xl border ${
                isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                {localSettings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-cyan-500" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                <div>
                  <div className="text-xs font-semibold">Sound Effects</div>
                  <div className="text-[10px] text-slate-400">Play audio chime on alerts</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={localSettings.soundEnabled}
                onChange={(e) => setLocalSettings({ ...localSettings, soundEnabled: e.target.checked })}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>

            {/* Meeting Auto Mute */}
            <div
              className={`flex items-center justify-between p-2.5 rounded-xl border ${
                isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <BellOff className="w-4 h-4 text-indigo-500" />
                <div>
                  <div className="text-xs font-semibold">Meeting Auto-Mute</div>
                  <div className="text-[10px] text-slate-400">Suppress popups during Zoom/Teams</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={localSettings.autoMuteInMeetings}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, autoMuteInMeetings: e.target.checked })
                }
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>

            {/* Strict Mode */}
            <div
              className={`flex items-center justify-between p-2.5 rounded-xl border ${
                isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <div>
                  <div className="text-xs font-semibold">Strict Ergonomic Mode</div>
                  <div className="text-[10px] text-slate-400">Force break completion prompt</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={localSettings.strictMode}
                onChange={(e) => setLocalSettings({ ...localSettings, strictMode: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-t ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-xs text-slate-400 hover:text-slate-600 underline transition-colors cursor-pointer"
          >
            Reset Defaults
          </button>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
