import React, { useState, useEffect } from 'react';
import { ShieldCheck, Key, Loader, CheckCircle, XCircle, Sparkles, ExternalLink } from 'lucide-react';
import { AppTheme } from '../types';

interface LicenseGateProps {
  theme: AppTheme;
  onActivated: (plan: string) => void;
  onTrial: () => void;
}

const API_BASE = 'http://localhost:5000/api/v1';
const LICENSE_KEY = 'pausepulse_license';
const TRIAL_STARTED_KEY = 'pausepulse_trial_started';
const TRIAL_DAYS = 7;

export const LicenseGate: React.FC<LicenseGateProps> = ({ theme, onActivated, onTrial }) => {
  const [keyInput, setKeyInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    // Check if already activated
    const savedKey = localStorage.getItem(LICENSE_KEY);
    if (savedKey) {
      verifyKey(savedKey, true);
      return;
    }

    // Check trial
    const trialStart = localStorage.getItem(TRIAL_STARTED_KEY);
    if (trialStart) {
      const startDate = new Date(trialStart);
      const now = new Date();
      const daysUsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysLeft = TRIAL_DAYS - daysUsed;
      if (daysLeft > 0) {
        setTrialDaysLeft(daysLeft);
      }
    }
  }, []);

  const verifyKey = async (key: string, silent = false) => {
    if (!silent) setStatus('checking');

    try {
      const res = await fetch(`${API_BASE}/license/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });

      const data = await res.json();

      if (data.activated) {
        localStorage.setItem(LICENSE_KEY, key);
        setStatus('success');
        setTimeout(() => onActivated(data.plan), 1200);
      } else {
        if (!silent) {
          setStatus('error');
          setErrorMsg(data.error || 'Invalid license key. Please check and try again.');
        }
      }
    } catch {
      if (!silent) {
        setStatus('error');
        setErrorMsg('Cannot connect to activation server. Check your internet connection.');
      }
    }
  };

  const handleActivate = () => {
    const trimmed = keyInput.trim().toUpperCase();
    if (!trimmed) {
      setStatus('error');
      setErrorMsg('Please enter your license key.');
      return;
    }
    verifyKey(trimmed);
  };

  const handleStartTrial = () => {
    if (!localStorage.getItem(TRIAL_STARTED_KEY)) {
      localStorage.setItem(TRIAL_STARTED_KEY, new Date().toISOString());
    }
    onTrial();
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${
        isDark ? 'bg-slate-950' : 'bg-slate-100'
      }`}
    >
      <div
        className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl border space-y-5 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7 text-indigo-400" />
          </div>
          <h1 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Activate PausePulse
          </h1>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Enter your license key to unlock all Pro features
          </p>
        </div>

        {/* License Key Input */}
        <div className="space-y-2">
          <label className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            License Key
          </label>
          <div className="relative">
            <Key className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value.toUpperCase());
                setStatus('idle');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
              placeholder="PP-XXXXXXXXXXXXXXXX"
              className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-xs font-mono border focus:outline-none focus:border-indigo-500 transition-all ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              } ${status === 'error' ? 'border-rose-500' : ''}`}
              autoFocus
            />
          </div>

          {/* Status Messages */}
          {status === 'error' && (
            <div className="flex items-center gap-1.5 text-rose-400 text-[11px]">
              <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {status === 'success' && (
            <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>License activated! Loading PausePulse Pro…</span>
            </div>
          )}
        </div>

        {/* Activate Button */}
        <button
          type="button"
          onClick={handleActivate}
          disabled={status === 'checking' || status === 'success'}
          className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
        >
          {status === 'checking' ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Verifying…</span>
            </>
          ) : status === 'success' ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Activated!</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Activate License</span>
            </>
          )}
        </button>

        <div className={`border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`} />

        {/* Trial / Buy Options */}
        <div className="space-y-2 text-center">
          {trialDaysLeft !== null ? (
            <button
              type="button"
              onClick={handleStartTrial}
              className={`w-full py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDark
                  ? 'border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  : 'border-slate-300 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Continue Trial ({trialDaysLeft} days left)
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartTrial}
              className={`w-full py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDark
                  ? 'border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  : 'border-slate-300 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Start 7-Day Free Trial
            </button>
          )}

          <a
            href="https://pausepulse.app/#pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            Get a license — from $4.99/mo
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
