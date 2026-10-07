import React, { useState, useEffect } from 'react';
import { X, Sliders, Check, Music, Play, Sun, Moon, Utensils, Coffee, ShieldAlert, Activity } from 'lucide-react';
import { Settings } from '../types';
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
      reduceMotion: false,
    };
    setLocalSettings(defaults);
    setCustomMinsInput('25');
    setCustomBreakMinsInput('3');
    setCustomMlInput('2000');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border ${
          isDark
            ? 'bg-slate-900 border-purple-500/25 text-slate-100'
            : 'bg-white border-purple-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-b ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-purple-500" />
            <h2 className="text-xs font-bold tracking-tight">PausePulse Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Theme Selector (High-Contrast in Both Themes) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold block">App Theme</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, theme: 'dark' })}
                className={`flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  localSettings.theme === 'dark'
                    ? 'bg-slate-950 border-purple-500 text-purple-300 shadow-md shadow-purple-500/20 font-bold ring-1 ring-purple-500'
                    : isDark
                    ? 'bg-slate-950/60 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-purple-400" />
                <span>Dark Mode</span>
              </button>

              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, theme: 'light' })}
                className={`flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  localSettings.theme === 'light'
                    ? 'bg-purple-50 border-purple-600 text-purple-950 shadow-md shadow-purple-500/20 font-bold ring-1 ring-purple-600'
                    : isDark
                    ? 'bg-slate-950/60 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light Mode</span>
              </button>
            </div>
          </div>

          {/* Reduce Motion Setting */}
          <div
            className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <div>
                <div className="text-xs font-semibold">Reduce Motion</div>
                <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Pause 3D planet and ambient motion
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.reduceMotion || false}
              onChange={(e) => setLocalSettings({ ...localSettings, reduceMotion: e.target.checked })}
              className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
            />
          </div>

          {/* Custom Focus Session Duration */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold">Focus Session Duration (Mins)</label>
              <span className="text-[11px] font-mono text-purple-500 font-bold">{customMinsInput || localSettings.breakIntervalMins} mins</span>
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
                    customMinsInput === mins.toString() || (!customMinsInput && localSettings.breakIntervalMins === mins)
                      ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-500/20'
                      : isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                      : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>

            <input
              type="number"
              placeholder="Custom minutes (e.g. 50)"
              value={customMinsInput}
              onChange={(e) => {
                setCustomMinsInput(e.target.value);
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val > 0) {
                  setLocalSettings((prev) => ({ ...prev, breakIntervalMins: val }));
                }
              }}
              className={`w-full rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-purple-500 font-mono border ${
                isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
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
                  className={`py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    (localSettings.lunchBreakMins || 45) === lmins
                      ? 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-500/20 font-bold'
                      : isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                      : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Utensils className="w-3 h-3" />
                  <span>{lmins}m Lunch</span>
                </button>
              ))}
            </div>
          </div>

          {/* Micro / Rest Break Duration with Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold flex items-center gap-1">
                <Coffee className="w-3.5 h-3.5 text-emerald-500" /> Rest Break Duration (Mins)
              </label>
              <span className="text-[11px] font-mono text-emerald-500 font-bold">{customBreakMinsInput || localSettings.breakDurationMins || 3} mins</span>
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
                    customBreakMinsInput === bmins.toString() || (!customBreakMinsInput && (localSettings.breakDurationMins || 3) === bmins)
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-500/20 font-bold'
                      : isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                      : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {bmins}m Break
                </button>
              ))}
            </div>

            <input
              type="number"
              placeholder="Custom break mins (e.g. 7)"
              value={customBreakMinsInput}
              onChange={(e) => {
                setCustomBreakMinsInput(e.target.value);
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val > 0) {
                  setLocalSettings((prev) => ({ ...prev, breakDurationMins: val }));
                }
              }}
              className={`w-full rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 font-mono border ${
                isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Custom Daily Hydration Target */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold">Daily Hydration Target (ml)</label>
              <span className="text-[11px] font-mono text-cyan-500 font-bold">{customMlInput || localSettings.waterTargetMl} ml</span>
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
                    customMlInput === ml.toString() || (!customMlInput && localSettings.waterTargetMl === ml)
                      ? 'bg-cyan-600 border-cyan-500 text-white shadow-md shadow-cyan-500/20'
                      : isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                      : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {ml} ml
                </button>
              ))}
            </div>

            <input
              type="number"
              placeholder="Custom target ml (e.g. 3000)"
              value={customMlInput}
              onChange={(e) => {
                setCustomMlInput(e.target.value);
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val > 0) {
                  setLocalSettings((prev) => ({ ...prev, waterTargetMl: val }));
                }
              }}
              className={`w-full rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500 font-mono border ${
                isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Sound Tone Selection */}
          <div className={`space-y-2 pt-2 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-purple-400" />
                <span>Alert Sound Tone</span>
              </label>
              <button
                type="button"
                onClick={handleTestSound}
                className="flex items-center space-x-1 px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3 fill-purple-400" />
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
                  onClick={() => setLocalSettings({ ...localSettings, selectedTone: t.id as any })}
                  className={`p-2 rounded-xl text-xs font-semibold border flex items-center justify-between transition-all cursor-pointer ${
                    localSettings.selectedTone === t.id
                      ? 'bg-purple-600/30 border-purple-500 text-purple-300 font-bold'
                      : isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{t.name}</span>
                  {localSettings.selectedTone === t.id && <Check className="w-3 h-3 text-purple-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Strict Mode Toggle */}
          <div
            className={`flex items-center justify-between p-2.5 rounded-xl border ${
              isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <div>
                <div className="text-xs font-semibold">Strict Ergonomic Mode</div>
                <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Force break completion prompt
                </div>
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

        {/* Footer Actions */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-t ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={handleResetDefaults}
            className={`text-xs underline transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Reset Defaults
          </button>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-1 px-4 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-500/25 transition-all active:scale-95 cursor-pointer"
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
