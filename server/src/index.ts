import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import syncRoutes from './routes/sync';
import leaderboardRoutes from './routes/leaderboard';
import hrRoutes from './routes/hr';
import billingRoutes from './routes/billing';
import stripeRoutes from './routes/stripe';
import licenseRoutes from './routes/license';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// ⚠️ Stripe webhook must use raw body BEFORE express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// REST API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/sync', syncRoutes);
app.use('/api/v1/leaderboard', leaderboardRoutes);
app.use('/api/v1/hr', hrRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/license', licenseRoutes);
app.use('/api/stripe', stripeRoutes);


// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'online',
    service: 'PausePulse Cloud Backend API',
    timestamp: new Date().toISOString(),
  });
});

// Admin Web Page with Guaranteed Direct CSS Theme Toggle (http://localhost:5000/admin)
app.get('/admin', (_req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PausePulse HR Corporate Admin Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; transition: background-color 0.3s ease, color 0.3s ease; }
    .theme-card, .theme-panel { transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease; }
  </style>
</head>
<body id="body-root" class="p-6 min-h-screen">
  <div class="max-w-4xl mx-auto space-y-6">

    <!-- Header -->
    <div class="flex items-center justify-between pb-4 border-b border-slate-800" id="header-border">
      <div>
        <div class="flex items-center space-x-2">
          <span class="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30">PAUSEPULSE ENTERPRISE</span>
        </div>
        <h1 class="text-2xl font-extrabold tracking-tight mt-1" id="title-text">Acme Corp - HR Wellness Dashboard</h1>
        <p class="text-xs text-slate-400" id="subtitle-text">Anonymized Employee Health Compliance & Reward Portal</p>
      </div>

      <div class="flex items-center space-x-2">
        <!-- Theme Toggle Button -->
        <button id="theme-btn" onclick="toggleTheme()" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer">
          🌙 Dark Mode
        </button>
        <button onclick="fetchData()" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer">
          🔄 Refresh
        </button>
      </div>
    </div>

    <!-- Overview Banner -->
    <div id="banner-card" class="bg-gradient-to-r from-indigo-900/60 to-slate-900 border border-indigo-500/30 p-6 rounded-2xl flex items-center justify-between shadow-xl">
      <div>
        <span class="text-xs text-indigo-400 font-bold uppercase tracking-wider">Overall Workplace Health</span>
        <div class="text-3xl font-black mt-1" id="company-name">Acme Technologies Ltd</div>
        <p class="text-xs text-slate-400 mt-1">25 Total Seats • 18 Active Employees</p>
      </div>
      <div class="text-right">
        <div id="wellness-score" class="text-4xl font-black text-emerald-400 font-mono">88%</div>
        <span class="text-xs text-slate-400 font-semibold">Team Break Compliance</span>
      </div>
    </div>

    <!-- Key Metrics Grid -->
    <div class="grid grid-cols-3 gap-4">
      <div class="theme-card p-4 rounded-2xl border">
        <div class="text-xs text-slate-400 font-medium">Active Seats License</div>
        <div id="active-seats" class="text-2xl font-extrabold font-mono mt-1">18 / 25</div>
        <div class="text-[11px] text-emerald-400 font-semibold mt-1">✓ Active B2B Subscription</div>
      </div>

      <div class="theme-card p-4 rounded-2xl border">
        <div class="text-xs text-slate-400 font-medium">Daily Hydration Average</div>
        <div id="avg-hydration" class="text-2xl font-extrabold text-cyan-400 font-mono mt-1">1,950 ml</div>
        <div class="text-[11px] text-slate-400 mt-1">Per Employee / Day</div>
      </div>

      <div class="theme-card p-4 rounded-2xl border">
        <div class="text-xs text-slate-400 font-medium">Total Micro-Breaks Taken</div>
        <div id="total-breaks" class="text-2xl font-extrabold text-indigo-400 font-mono mt-1">1,240</div>
        <div class="text-[11px] text-slate-400 mt-1">This Month</div>
      </div>
    </div>

    <!-- Rewards Panel -->
    <div class="theme-panel p-5 rounded-2xl space-y-4 border">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold flex items-center gap-2">
          🏆 Active Company Employee Rewards
        </h3>
        <span class="text-xs text-amber-500 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
          Managed by HR Admin
        </span>
      </div>

      <div id="rewards-list" class="space-y-2">
        <!-- Dynamic Rewards -->
      </div>
    </div>

    <!-- API JSON Link -->
    <div class="text-center pt-4 text-xs text-slate-500 border-t border-slate-800/80">
      REST API Endpoint: <a href="/api/v1/hr/dashboard" target="_blank" class="text-indigo-400 underline">/api/v1/hr/dashboard</a>
    </div>

  </div>

  <script>
    let currentTheme = localStorage.getItem('pausepulse_admin_theme') || 'dark';

    function applyTheme() {
      const isLight = currentTheme === 'light';
      const body = document.getElementById('body-root');
      const btn = document.getElementById('theme-btn');
      const headerBorder = document.getElementById('header-border');
      const companyName = document.getElementById('company-name');
      const subtitleText = document.getElementById('subtitle-text');

      if (isLight) {
        body.style.backgroundColor = '#f8fafc';
        body.style.color = '#0f172a';
        btn.innerHTML = '☀️ Light Mode';
        btn.style.backgroundColor = '#ffffff';
        btn.style.borderColor = '#cbd5e1';
        btn.style.color = '#0f172a';
        headerBorder.style.borderColor = '#e2e8f0';
        companyName.style.color = '#ffffff';
        subtitleText.style.color = '#64748b';

        document.querySelectorAll('.theme-card, .theme-panel').forEach(el => {
          el.style.backgroundColor = '#ffffff';
          el.style.borderColor = '#e2e8f0';
          el.style.color = '#0f172a';
          el.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1)';
        });
      } else {
        body.style.backgroundColor = '#020617';
        body.style.color = '#f8fafc';
        btn.innerHTML = '🌙 Dark Mode';
        btn.style.backgroundColor = '#1e293b';
        btn.style.borderColor = '#334155';
        btn.style.color = '#f8fafc';
        headerBorder.style.borderColor = '#1e293b';
        companyName.style.color = '#ffffff';
        subtitleText.style.color = '#94a3b8';

        document.querySelectorAll('.theme-card, .theme-panel').forEach(el => {
          el.style.backgroundColor = '#0f172a';
          el.style.borderColor = '#1e293b';
          el.style.color = '#f8fafc';
          el.style.boxShadow = 'none';
        });
      }
    }

    function toggleTheme() {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('pausepulse_admin_theme', currentTheme);
      applyTheme();
      fetchData();
    }

    async function fetchData() {
      try {
        const res = await fetch('/api/v1/hr/dashboard');
        const data = await res.json();
        
        document.getElementById('wellness-score').innerText = data.teamWellnessScore + '%';
        document.getElementById('active-seats').innerText = data.activeSeats + ' / ' + data.totalSeats;
        document.getElementById('avg-hydration').innerText = data.monthlyHydrationAvgMl + ' ml';
        document.getElementById('total-breaks').innerText = data.anonymizedStats.totalBreaksCompletedThisMonth;

        const list = document.getElementById('rewards-list');
        const isLight = currentTheme === 'light';
        list.innerHTML = data.rewardsActive.map(r => \`
          <div class="flex items-center justify-between p-3 rounded-xl border" style="background-color: \${isLight ? '#f8fafc' : '#020617'}; border-color: \${isLight ? '#e2e8f0' : '#1e293b'}">
            <div>
              <div class="text-xs font-bold" style="color: \${isLight ? '#0f172a' : '#ffffff'}">\${r.title}</div>
              <div class="text-[10px] text-slate-400">Type: \${r.type}</div>
            </div>
            <span class="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              \${r.pointsRequired} pts
            </span>
          </div>
        \`).join('');
      } catch (err) {
        console.error(err);
      }
    }

    applyTheme();
    fetchData();
  </script>
</body>
</html>
  `);
});

// Root Redirect to /admin
app.get('/', (_req, res) => {
  res.redirect('/admin');
});

app.listen(PORT, () => {
  console.log(`⚡ PausePulse Backend API Server running on http://localhost:${PORT}`);
  console.log(`📊 Admin Web Dashboard UI available at http://localhost:${PORT}/admin`);
});
