import React, { useState } from 'react';
import { Palette, RotateCcw, Sparkles, ChevronDown, ChevronUp, Sliders } from 'lucide-react';
import { AppTheme } from '../types';

export interface SuitableColorPreset {
  id: string;
  name: string;
  hue: number;
  glow: number;
  saturation: number;
  hex: string;
  description: string;
}

// 8 scientifically curated color palettes for focus, mindfulness, and alertness
export const SUITABLE_COLOR_PRESETS: SuitableColorPreset[] = [
  {
    id: 'cosmic-violet',
    name: 'Cosmic Violet',
    hue: 0,
    glow: 1.0,
    saturation: 1.0,
    hex: '#8b5cf6',
    description: 'Deep focus, creativity & high mental clarity (Default)',
  },
  {
    id: 'electric-magenta',
    name: 'Neon Fuchsia',
    hue: 45,
    glow: 1.1,
    saturation: 1.1,
    hex: '#d946ef',
    description: 'Vibrant spirit, playfulness & mental stimulation',
  },
  {
    id: 'sunset-coral',
    name: 'Sunset Coral',
    hue: 90,
    glow: 1.05,
    saturation: 1.15,
    hex: '#ef4444',
    description: 'Warm drive, motivated energy & evening comfort',
  },
  {
    id: 'solar-amber',
    name: 'Solar Amber',
    hue: 140,
    glow: 1.1,
    saturation: 1.1,
    hex: '#f59e0b',
    description: 'Warm optimism, natural daylight & joyful vitality',
  },
  {
    id: 'aurora-lime',
    name: 'Aurora Lime',
    hue: 180,
    glow: 1.0,
    saturation: 1.0,
    hex: '#84cc16',
    description: 'Crisp renewal, eye refresh & light energy',
  },
  {
    id: 'emerald-zen',
    name: 'Emerald Zen',
    hue: 220,
    glow: 1.0,
    saturation: 1.05,
    hex: '#10b981',
    description: 'Stress alleviation, balanced calm & restorative pace',
  },
  {
    id: 'cyber-cyan',
    name: 'Cyber Cyan',
    hue: 270,
    glow: 1.05,
    saturation: 1.0,
    hex: '#06b6d4',
    description: 'Cool alertness, asthenopia relief & tranquil clarity',
  },
  {
    id: 'royal-sapphire',
    name: 'Royal Sapphire',
    hue: 315,
    glow: 1.0,
    saturation: 1.0,
    hex: '#3b82f6',
    description: 'Deep cognitive flow & distraction-free immersion',
  },
];

// Exact Rodrigues color rotation matching the Energy Orb GLSL shader
export function getOrbColorPreview(hueDeg: number, saturation = 1.0): string {
  const rad = (hueDeg * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);
  const invSqrt3 = 1 / Math.sqrt(3);
  const axis = [invSqrt3, invSqrt3, invSqrt3];

  const base = [0.48, 0.44, 1.0];
  const lum = 0.2126 * base[0] + 0.7152 * base[1] + 0.0722 * base[2];
  const satColor = [
    lum + (base[0] - lum) * saturation,
    lum + (base[1] - lum) * saturation,
    lum + (base[2] - lum) * saturation,
  ];

  const dot = axis[0] * satColor[0] + axis[1] * satColor[1] + axis[2] * satColor[2];
  const cross = [
    axis[1] * satColor[2] - axis[2] * satColor[1],
    axis[2] * satColor[0] - axis[0] * satColor[2],
    axis[0] * satColor[1] - axis[1] * satColor[0],
  ];

  const r = Math.min(255, Math.max(0, Math.round((satColor[0] * cosA + cross[0] * sinA + axis[0] * dot * (1 - cosA)) * 255)));
  const g = Math.min(255, Math.max(0, Math.round((satColor[1] * cosA + cross[1] * sinA + axis[1] * dot * (1 - cosA)) * 255)));
  const b = Math.min(255, Math.max(0, Math.round((satColor[2] * cosA + cross[2] * sinA + axis[2] * dot * (1 - cosA)) * 255)));

  return `rgb(${r}, ${g}, ${b})`;
}

// Computes dynamic theme styling matching the active Orb color
export function getDynamicThemeTokens(hueDeg: number, saturation = 1.0, isDark = true) {
  const rad = (hueDeg * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);
  const invSqrt3 = 1 / Math.sqrt(3);
  const axis = [invSqrt3, invSqrt3, invSqrt3];

  const base = [0.48, 0.44, 1.0];
  const lum = 0.2126 * base[0] + 0.7152 * base[1] + 0.0722 * base[2];
  const satColor = [
    lum + (base[0] - lum) * saturation,
    lum + (base[1] - lum) * saturation,
    lum + (base[2] - lum) * saturation,
  ];

  const dot = axis[0] * satColor[0] + axis[1] * satColor[1] + axis[2] * satColor[2];
  const cross = [
    axis[1] * satColor[2] - axis[2] * satColor[1],
    axis[2] * satColor[0] - axis[0] * satColor[2],
    axis[0] * satColor[1] - axis[1] * satColor[0],
  ];

  const r = Math.min(255, Math.max(0, Math.round((satColor[0] * cosA + cross[0] * sinA + axis[0] * dot * (1 - cosA)) * 255)));
  const g = Math.min(255, Math.max(0, Math.round((satColor[1] * cosA + cross[1] * sinA + axis[1] * dot * (1 - cosA)) * 255)));
  const b = Math.min(255, Math.max(0, Math.round((satColor[2] * cosA + cross[2] * sinA + axis[2] * dot * (1 - cosA)) * 255)));

  // Calculate perceived luminance to ensure WCAG compliant text contrast
  const perceivedLuminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const accentContrast = perceivedLuminance > 0.55 ? '#090812' : '#ffffff';

  // Lighter & darker harmonic variants for glowing timer ring gradients
  const rLighter = Math.min(255, Math.round(r + (255 - r) * 0.45));
  const gLighter = Math.min(255, Math.round(g + (255 - g) * 0.45));
  const bLighter = Math.min(255, Math.round(b + (255 - b) * 0.45));

  const rDeeper = Math.round(r * 0.7);
  const gDeeper = Math.round(g * 0.7);
  const bDeeper = Math.round(b * 0.7);

  if (isDark) {
    return {
      accent: `rgb(${r}, ${g}, ${b})`,
      accentContrast,
      accentGlow: `rgba(${r}, ${g}, ${b}, 0.55)`,
      border: `rgba(${r}, ${g}, ${b}, 0.28)`,
      focus: `rgb(${r}, ${g}, ${b})`,
      timerStart: `rgb(${rDeeper}, ${gDeeper}, ${bDeeper})`,
      timerMid: `rgb(${r}, ${g}, ${b})`,
      timerEnd: `rgb(${rLighter}, ${gLighter}, ${bLighter})`,
      surface: `rgba(${Math.round(r * 0.08 + 10)}, ${Math.round(g * 0.08 + 8)}, ${Math.round(b * 0.08 + 22)}, 0.82)`,
      surface2: `rgba(${Math.round(r * 0.14 + 16)}, ${Math.round(g * 0.14 + 14)}, ${Math.round(b * 0.14 + 32)}, 0.92)`,
      skyGradient: `radial-gradient(ellipse at 50% 25%, rgba(${r}, ${g}, ${b}, 0.22) 0%, rgba(9, 8, 18, 0.98) 75%)`,
    };
  } else {
    // Light theme: tone down brightness slightly for comfortable high-contrast text and borders
    const dr = Math.round(r * 0.85);
    const dg = Math.round(g * 0.85);
    const db = Math.round(b * 0.85);
    return {
      accent: `rgb(${dr}, ${dg}, ${db})`,
      accentContrast: '#ffffff',
      accentGlow: `rgba(${dr}, ${dg}, ${db}, 0.4)`,
      border: `rgba(${r}, ${g}, ${b}, 0.32)`,
      focus: `rgb(${dr}, ${dg}, ${db})`,
      timerStart: `rgb(${dr}, ${dg}, ${db})`,
      timerMid: `rgb(${r}, ${g}, ${b})`,
      timerEnd: `rgb(${rLighter}, ${gLighter}, ${bLighter})`,
      surface: `rgba(255, 255, 255, 0.92)`,
      surface2: `rgba(${Math.round(250 - (255 - r) * 0.06)}, ${Math.round(248 - (255 - g) * 0.06)}, ${Math.round(255 - (255 - b) * 0.06)}, 0.96)`,
      skyGradient: `linear-gradient(180deg, rgba(${r}, ${g}, ${b}, 0.12) 0%, #fae8ff 45%, #e0e7ff 100%)`,
    };
  }
}

interface BackgroundColorMixerProps {
  hue: number;
  saturation: number;
  glow: number;
  theme: AppTheme;
  onChange: (updates: { hue?: number; saturation?: number; glow?: number }) => void;
  onReset?: () => void;
  className?: string;
}

export const BackgroundColorMixer: React.FC<BackgroundColorMixerProps> = ({
  hue,
  saturation,
  glow,
  theme,
  onChange,
  onReset,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const currentColorRgb = getOrbColorPreview(hue, saturation);
  const matchingPreset = SUITABLE_COLOR_PRESETS.find(p => Math.abs(p.hue - hue) <= 10);
  const activeColorName = matchingPreset ? matchingPreset.name : `Custom (${Math.round(hue)}°)`;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = parseFloat(e.target.value);
    onChange({ hue: newHue });
  };

  const handleSelectPreset = (preset: SuitableColorPreset) => {
    onChange({
      hue: preset.hue,
      glow: preset.glow,
      saturation: preset.saturation,
    });
  };

  const handleResetToDefault = () => {
    if (onReset) {
      onReset();
    } else {
      onChange({ hue: 0, glow: 1.0, saturation: 1.0 });
    }
  };

  return (
    <div
      className={`w-full glass-panel rounded-2xl p-3 border border-[var(--border)] shadow-lg backdrop-blur-xl transition-all duration-300 ${className}`}
      style={{
        boxShadow: `0 8px 32px -8px ${currentColorRgb}33, 0 0 0 1px ${currentColorRgb}22`,
      }}
    >
      {/* ── Header Row ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 min-w-0">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 shadow-sm"
            style={{
              backgroundColor: `${currentColorRgb}25`,
              color: currentColorRgb,
              boxShadow: `0 0 12px ${currentColorRgb}66`,
            }}
          >
            <Palette className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center space-x-2 min-w-0">
            <span className="text-xs font-bold text-[var(--text)] tracking-tight">
              Orb Ambient Mixer
            </span>
            <span
              className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border transition-all duration-300 flex items-center gap-1 shrink-0"
              style={{
                backgroundColor: `${currentColorRgb}20`,
                borderColor: `${currentColorRgb}50`,
                color: currentColorRgb,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full inline-block animate-pulse"
                style={{ backgroundColor: currentColorRgb }}
              />
              {activeColorName}
            </span>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-1 shrink-0">
          {hue !== 0 && (
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-2 py-1 rounded-lg text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors flex items-center gap-1 cursor-pointer"
              title="Reset to Cosmic Violet default"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer ${
              showAdvanced ? 'bg-[var(--surface-2)] text-[var(--accent)]' : 'hover:bg-[var(--surface-2)]'
            }`}
            title="Fine-tune Glow & Saturation"
          >
            <Sliders className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse Mixer Bar' : 'Expand Mixer Bar'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Expandable Body ── */}
      {isExpanded && (
        <div className="mt-2.5 space-y-2.5 pt-2 border-t border-[var(--border)]/60 animate-in fade-in duration-200">
          {/* Preset Swatches Row */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-medium mb-1.5">
              <span>Curated Suitable Tones:</span>
              <span className="font-mono">{Math.round(hue)}°</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {SUITABLE_COLOR_PRESETS.map((preset) => {
                const isSelected = matchingPreset?.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`group relative p-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--surface-2)] shadow-xs scale-105 ring-1'
                        : 'hover:bg-[var(--surface-2)]/60 hover:scale-102 opacity-80 hover:opacity-100'
                    }`}
                    style={{
                      borderColor: isSelected ? preset.hex : 'transparent',
                      // @ts-ignore
                      '--tw-ring-color': isSelected ? `${preset.hex}80` : 'transparent',
                    }}
                    title={`${preset.name}: ${preset.description}`}
                  >
                    <div
                      className="w-5 h-5 rounded-full transition-transform duration-200 shadow-sm"
                      style={{
                        backgroundColor: preset.hex,
                        boxShadow: isSelected ? `0 0 10px ${preset.hex}` : `0 0 4px ${preset.hex}60`,
                      }}
                    />
                    <span className="text-[9px] font-bold text-[var(--text)] mt-1 truncate max-w-full text-center tracking-tighter">
                      {preset.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Continuous Spectrum Mixer Slider Bar */}
          <div className="pt-0.5">
            <div className="relative flex items-center">
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={hue}
                onChange={handleSliderChange}
                className="w-full h-3 rounded-full appearance-none cursor-pointer transition-all focus:outline-hidden"
                style={{
                  background:
                    'linear-gradient(to right, rgb(122,112,255) 0%, rgb(215,70,235) 12%, rgb(239,68,68) 25%, rgb(245,158,11) 39%, rgb(132,204,22) 50%, rgb(16,185,129) 61%, rgb(6,182,212) 75%, rgb(59,130,246) 88%, rgb(122,112,255) 100%)',
                  boxShadow: `0 0 12px ${currentColorRgb}44 inset`,
                }}
              />
            </div>
          </div>

          {/* Advanced Fine-Tuning: Glow & Saturation */}
          {showAdvanced && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]/40 text-[10px]">
              <div>
                <div className="flex justify-between text-[var(--text-muted)] font-bold mb-1">
                  <span>Orb Glow Intensity</span>
                  <span>{glow.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.8"
                  step="0.1"
                  value={glow}
                  onChange={(e) => onChange({ glow: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-[var(--surface-2)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[var(--text-muted)] font-bold mb-1">
                  <span>Color Saturation</span>
                  <span>{saturation.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1.8"
                  step="0.1"
                  value={saturation}
                  onChange={(e) => onChange({ saturation: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-[var(--surface-2)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
