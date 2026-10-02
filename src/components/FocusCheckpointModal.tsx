import React, { useState } from 'react';
import { Bookmark, Sparkles, Check, ArrowRight } from 'lucide-react';
import { AppTheme } from '../types';

interface FocusCheckpointModalProps {
  isOpen: boolean;
  theme: AppTheme;
  onSaveCheckpoint: (note: string) => void;
  onSkip: () => void;
}

export const FocusCheckpointModal: React.FC<FocusCheckpointModalProps> = ({
  isOpen,
  theme,
  onSaveCheckpoint,
  onSkip,
}) => {
  const [note, setNote] = useState<string>('');
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCheckpoint(note.trim() || 'Paused work session');
    setNote('');
  };

  const handleQuickTag = (tag: string) => {
    setNote(tag);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-sm rounded-2xl p-4 shadow-2xl border space-y-4 ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-tight flex items-center gap-1.5">
              Focus Checkpoint <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">+10 pts</span>
            </h2>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Where are you leaving off before your break?</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            placeholder="e.g., Finished user authentication logic, left off at line 140..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className={`w-full rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500 border transition-all resize-none ${
              isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
            autoFocus
          />

          {/* Quick Tags */}
          <div className="space-y-1">
            <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Quick Suggestions:</span>
            <div className="flex flex-wrap gap-1">
              {['Finished feature UI', 'Debugging API bug', 'Writing documentation', 'Code review'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleQuickTag(tag)}
                  className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                    note === tag
                      ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                      : isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className={`flex items-center justify-between pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={onSkip}
              className={`text-xs underline transition-colors cursor-pointer ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Skip Checkpoint
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Start Break</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
