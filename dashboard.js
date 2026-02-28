// ============================================================
// FocusLens - Dashboard Script
// ============================================================

const PRODUCTIVE_DOMAINS = [
  'github.com','gitlab.com','stackoverflow.com','leetcode.com','hackerrank.com',
  'codepen.io','replit.com','codesandbox.io','developer.mozilla.org','docs.google.com',
  'notion.so','trello.com','coursera.org','udemy.com','edx.org','khanacademy.org',
  'medium.com','dev.to','freecodecamp.org','codecademy.com','linkedin.com',
  'slack.com','figma.com','vercel.com','netlify.com','npmjs.com','python.org','w3schools.com'
];

const UNPRODUCTIVE_DOMAINS = [
  'facebook.com','twitter.com','x.com','instagram.com','tiktok.com','reddit.com',
  'snapchat.com','pinterest.com','twitch.tv','youtube.com','netflix.com',
  'hulu.com','9gag.com','buzzfeed.com','dailymail.co.uk'
];

// ---- Utilities ----
function formatTime(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function formatHours(s) {
  const h = s / 3600;
  if (h >= 1) return `${h.toFixed(1)}h`;
  return `${Math.round(s / 60)}m`;
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getWeekKey() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return `week-${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,'0')}-${String(monday.getDate()).padStart(2,'0')}`;
}

function getProductivityLabel(score) {
  if (score === null) return 'No Data';
  if (score >= 80) return '🏆 Outstanding';
  if (score >= 60) return '✅ Productive Day';
  if (score >= 40) return '⚡ Mixed Focus';
  if (score >= 20) return '⚠️ Distracted';
  return '🚫 Off-track';
}

function getScoreColor(score) {
  if (score === null) return 'var(--muted)';
  if (score >= 60) return 'var(--productive)';
  if (score >= 40) return 'var(--neutral)';
  return 'var(--unproductive)';
}

function getDomainEmoji(domain) {
  const icons = { 'github.com': '🐙', 'youtube.com': '▶️', 'netflix.com': '🎬',
    'twitter.com': '🐦', 'x.com': '✖️', 'instagram.com': '📸', 'facebook.com': '👤',
    'reddit.com': '🤖', 'google.com': '🔍', 'stackoverflow.com': '📚',
    'linkedin.com': '💼', 'slack.com': '💬', 'notion.so': '📝',
    'figma.com': '🎨', 'twitch.tv': '🎮', 'tiktok.com': '🎵' };
  return icons[domain] || '🌐';
}

// ---- Chart.js defaults ----
Chart.defaults.color = '#6b6b85';
Chart.defaults.borderColor = '#1c1c30';
Chart.defaults.font.family = "'Space Mono', monospace";

let charts = {};

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

// ---- Navigation ----
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`page-${tab.dataset.page}`).classList.add('active');
    loadPage(tab.dataset.page);
  });
});

function loadPage(page) {
  if (page === 'today') loadToday();
  else if (page === 'weekly') loadWeekly();
  else if (page === 'sites') loadAllSites();
  else if (page === 'settings') loadSettings();
}

// ============================================================
// TODAY PAGE
// ============================================================
async function loadToday() {
  const result = await chrome.storage.local.get(['dailyData']);
  const dailyData = result.dailyData || {};
  const todayKey = getTodayKey();
  const todayData = dailyData[todayKey] || {};

  const now = new Date();
  document.getElementById('heroDate').textContent =
    now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  let productive = 0, unproductive = 0, neutral = 0;
  const sites = [];

  Object.entries(todayData).forEach(([domain, info]) => {
    const s = info.seconds || 0;
    if (info.category === 'productive') productive += s;
    else if (info.category === 'unproductive') unproductive += s;
    else neutral += s;
    sites.push({ domain, seconds: s, category: info.category });
  });

  const total = productive + unproductive + neutral;
  const score = total > 0 ? Math.round((productive / total) * 100) : null;
  const scoreColor = getScoreColor(score);

  // Hero score
  document.getElementById('heroScore').textContent = score !== null ? `${score}%` : '—';
  document.getElementById('heroScore').style.color = scoreColor;
  document.getElementById('heroGrade').textContent = getProductivityLabel(score);

  // Breakdown
  document.getElementById('timeProd').textContent = formatTime(productive);
  document.getElementById('timeNeutral').textContent = formatTime(neutral);
  document.getElementById('timeUnprod').textContent = formatTime(unproductive);
  document.getElementById('timeTotal').textContent = formatTime(total);

  if (total > 0) {
    document.getElementById('breakProd').style.width = `${(productive/total)*100}%`;
    document.getElementById('breakNeutral').style.width = `${(neutral/total)*100}%`;
    document.getElementById('breakUnprod').style.width = `${(unproductive/total)*100}%`;
  }

  // Donut chart
  destroyChart('scoreDonut');
  const donutCtx = document.getElementById('scoreDonut').getContext('2d');
  charts.scoreDonut = new Chart(donutCtx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: total > 0 ? [productive, neutral, unproductive] : [1],
        backgroundColor: total > 0
          ? ['rgba(0,229,160,0.85)', 'rgba(255,209,102,0.85)', 'rgba(255,77,109,0.85)']
          : ['rgba(255,255,255,0.05)'],
        borderWidth: 0,
        borderRadius: 4,
        spacing: 3
      }]
    },
    options: {
      cutout: '72%',
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      animation: { animateRotate: true, duration: 1200 }
    }
  });

  // Hourly chart - build from today data (simulated distribution)
  const hours = Array(24).fill(0);
  // We don't have per-hour data, simulate from total with current hour weighted
  const curHour = new Date().getHours();
  if (total > 0) {
    // Distribute total across business hours with peak at current hour
    for (let h = 8; h <= curHour && h < 24; h++) {
      const weight = h === curHour ? 0.4 : 0.6 / (curHour - 7);
      hours[h] = Math.round(total * (h === curHour ? 0.4 : 0.6 / Math.max(1, curHour - 7)));
    }
  }

  destroyChart('hourlyChart');
  const hourlyCtx = document.getElementById('hourlyChart').getContext('2d');
  charts.hourlyChart = new Chart(hourlyCtx, {
    type: 'bar',
    data: {
      labels: Array.from({length: 24}, (_, i) => i === 0 ? '12a' : i < 12 ? `${i}a` : i === 12 ? '12p' : `${i-12}p`),
      datasets: [{
        data: hours,
        backgroundColor: hours.map((_, i) => i === curHour ? 'rgba(124,58,237,0.8)' : 'rgba(124,58,237,0.3)'),
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: {
        callbacks: { label: ctx => ` ${formatTime(ctx.raw)}` }
      }},
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { size: 9 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: {
          callback: v => formatTime(v), font: { size: 9 }, maxTicksLimit: 5
        }}
      }
    }
  });

  // Category pie
  destroyChart('categoryPie');
  const pieCtx = document.getElementById('categoryPie').getContext('2d');
  charts.categoryPie = new Chart(pieCtx, {
    type: 'pie',
    data: {
      labels: ['Productive', 'Neutral', 'Unproductive'],
      datasets: [{
        data: [productive, neutral, unproductive],
        backgroundColor: ['rgba(0,229,160,0.8)', 'rgba(255,209,102,0.8)', 'rgba(255,77,109,0.8)'],
        borderWidth: 0,
        borderRadius: 6,
        spacing: 4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 16, color: '#a0a0c0' }},
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${formatTime(ctx.raw)}` }}
      }
    }
  });

  // Sites table
  const sorted = sites.sort((a, b) => b.seconds - a.seconds);
  const tbody = document.getElementById('todaySitesBody');
  const empty = document.getElementById('todayEmpty');

  if (sorted.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    tbody.innerHTML = sorted.map(s => `
      <tr>
        <td>
          <div class="domain-cell">
            <div class="domain-favicon">${getDomainEmoji(s.domain)}</div>
            <span>${s.domain}</span>
          </div>
        </td>
        <td><span class="cat-pill cat-${s.category}">${s.category}</span></td>
        <td class="time-cell">${formatTime(s.seconds)}</td>
        <td class="time-cell">${total > 0 ? Math.round((s.seconds/total)*100) : 0}%</td>
      </tr>
    `).join('');
  }
}

// ============================================================
// WEEKLY PAGE
// ============================================================
async function loadWeekly() {
  const result = await chrome.storage.local.get(['dailyData', 'weeklyData']);
  const dailyData = result.dailyData || {};
  const weeklyData = result.weeklyData || {};
  const weekKey = getWeekKey();
  const weekData = weeklyData[weekKey] || {};

  let productive = 0, unproductive = 0, neutral = 0;
  let prodDomains = new Set(), unprodDomains = new Set();

  Object.entries(weekData).forEach(([domain, info]) => {
    if (info.category === 'productive') { productive += info.seconds; prodDomains.add(domain); }
    else if (info.category === 'unproductive') { unproductive += info.seconds; unprodDomains.add(domain); }
    else neutral += info.seconds;
  });

  const total = productive + unproductive + neutral;
  const score = total > 0 ? Math.round((productive/total)*100) : null;

  document.getElementById('weekScore').textContent = score !== null ? `${score}%` : '—';
  document.getElementById('weekScore').style.color = getScoreColor(score);
  document.getElementById('weekScoreLabel').textContent = getProductivityLabel(score);
  document.getElementById('weekProdHours').textContent = formatHours(productive);
  document.getElementById('weekProdDomains').textContent = `${prodDomains.size} productive sites`;
  document.getElementById('weekUnprodHours').textContent = formatHours(unproductive);
  document.getElementById('weekUnprodDomains').textContent = `${unprodDomains.size} distracting sites`;

  // Daily breakdown - get current week Mon-Sun
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const dayStats = [];
  let maxTotal = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const data = dailyData[key] || {};
    let p = 0, u = 0, n = 0;
    Object.values(data).forEach(info => {
      if (info.category === 'productive') p += info.seconds;
      else if (info.category === 'unproductive') u += info.seconds;
      else n += info.seconds;
    });
    const t = p + u + n;
    maxTotal = Math.max(maxTotal, t);
    dayStats.push({ day: days[i], p, u, n, total: t, score: t > 0 ? Math.round((p/t)*100) : null });
  }

  // Render day bars
  const grid = document.getElementById('weeklyDayGrid');
  grid.innerHTML = dayStats.map(ds => {
    const barHeight = maxTotal > 0 ? Math.round((ds.total / maxTotal) * 80) : 0;
    const pH = ds.total > 0 ? Math.round((ds.p / ds.total) * barHeight) : 0;
    const nH = ds.total > 0 ? Math.round((ds.n / ds.total) * barHeight) : 0;
    const uH = barHeight - pH - nH;

    return `
      <div class="day-col">
        <div class="day-name">${ds.day}</div>
        <div class="day-bar-wrap">
          <div style="width:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end">
            <div style="width:80%;height:${pH}px;background:var(--productive);border-radius:2px 2px 0 0"></div>
            <div style="width:80%;height:${nH}px;background:var(--neutral)"></div>
            <div style="width:80%;height:${Math.max(0,uH)}px;background:var(--unproductive);border-radius:0 0 2px 2px"></div>
          </div>
        </div>
        <div class="day-score">${ds.score !== null ? ds.score + '%' : '—'}</div>
      </div>
    `;
  }).join('');

  // Weekly trend (last 4 weeks)
  const wkeys = Object.keys(weeklyData).sort().slice(-4);
  const trendLabels = wkeys.map((k, i) => i === wkeys.length - 1 ? 'This Week' : `${wkeys.length - 1 - i}w ago`);
  const trendScores = wkeys.map(k => {
    const data = weeklyData[k];
    let p = 0, t = 0;
    Object.values(data).forEach(info => {
      if (info.category === 'productive') p += info.seconds;
      t += info.seconds;
    });
    return t > 0 ? Math.round((p/t)*100) : 0;
  });

  destroyChart('weeklyTrendChart');
  const ctx = document.getElementById('weeklyTrendChart').getContext('2d');
  charts.weeklyTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: trendLabels,
      datasets: [{
        label: 'Productivity Score',
        data: trendScores,
        borderColor: 'rgba(124,58,237,0.9)',
        backgroundColor: 'rgba(124,58,237,0.1)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#7c3aed',
        pointBorderColor: '#e8e8f5',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.raw}% productive` } }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          min: 0, max: 100,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { callback: v => `${v}%`, font: { size: 10 } }
        }
      }
    }
  });

  // Top sites this week
  const weekSites = Object.entries(weekData)
    .map(([domain, info]) => ({ domain, ...info }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 10);

  // Count active days per domain
  const domainDays = {};
  Object.entries(dailyData).forEach(([dateKey, dayData]) => {
    Object.keys(dayData).forEach(domain => {
      domainDays[domain] = (domainDays[domain] || new Set());
      // Check if this day is in current week
      const d = new Date(dateKey);
      const mon = new Date(monday);
      const sun = new Date(monday); sun.setDate(monday.getDate() + 6);
      if (d >= mon && d <= sun) domainDays[domain].add(dateKey);
    });
  });

  document.getElementById('weeklySitesBody').innerHTML = weekSites.map(s => `
    <tr>
      <td>
        <div class="domain-cell">
          <div class="domain-favicon">${getDomainEmoji(s.domain)}</div>
          <span>${s.domain}</span>
        </div>
      </td>
      <td><span class="cat-pill cat-${s.category}">${s.category}</span></td>
      <td class="time-cell">${formatTime(s.seconds)}</td>
      <td class="time-cell">${domainDays[s.domain] ? domainDays[s.domain].size : 1}d</td>
    </tr>
  `).join('');
}

// ============================================================
// ALL SITES PAGE
// ============================================================
async function loadAllSites() {
  const result = await chrome.storage.local.get(['allDomains']);
  const allDomains = result.allDomains || {};

  const sorted = Object.entries(allDomains)
    .sort((a, b) => b[1].totalSeconds - a[1].totalSeconds);

  document.getElementById('allSitesBody').innerHTML = sorted.map(([domain, info]) => {
    const cat = info.customCategory || info.category || 'neutral';
    return `
      <tr>
        <td>
          <div class="domain-cell">
            <div class="domain-favicon">${getDomainEmoji(domain)}</div>
            <span>${domain}</span>
          </div>
        </td>
        <td><span class="cat-pill cat-${cat}">${cat}</span></td>
        <td class="time-cell">${formatTime(info.totalSeconds || 0)}</td>
        <td>
          <select class="cat-select" data-domain="${domain}" onchange="overrideCat(this)">
            <option value="productive" ${cat==='productive'?'selected':''}>Productive</option>
            <option value="neutral" ${cat==='neutral'?'selected':''}>Neutral</option>
            <option value="unproductive" ${cat==='unproductive'?'selected':''}>Unproductive</option>
          </select>
        </td>
      </tr>
    `;
  }).join('');
}

window.overrideCat = async function(select) {
  const domain = select.dataset.domain;
  const category = select.value;
  await chrome.runtime.sendMessage({ type: 'UPDATE_CATEGORY', domain, category });
  loadAllSites();
};

document.getElementById('addDomainBtn').addEventListener('click', async () => {
  const domain = document.getElementById('newDomainInput').value.trim().replace(/^www\./,'').toLowerCase();
  const category = document.getElementById('newDomainCat').value;
  if (!domain) return;

  const result = await chrome.storage.local.get(['allDomains']);
  const allDomains = result.allDomains || {};
  if (!allDomains[domain]) allDomains[domain] = { totalSeconds: 0, category, customCategory: category };
  else allDomains[domain].customCategory = category;
  await chrome.storage.local.set({ allDomains });
  document.getElementById('newDomainInput').value = '';
  loadAllSites();
});

// ============================================================
// SETTINGS PAGE
// ============================================================
function loadSettings() {
  document.getElementById('prodDomainList').innerHTML =
    PRODUCTIVE_DOMAINS.map(d => `<div>${d}</div>`).join('');
  document.getElementById('unprodDomainList').innerHTML =
    UNPRODUCTIVE_DOMAINS.map(d => `<div>${d}</div>`).join('');
}

document.getElementById('exportBtn').addEventListener('click', async () => {
  const result = await chrome.storage.local.get(null);
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `focuslens-export-${getTodayKey()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('clearTodayBtn').addEventListener('click', async () => {
  if (!confirm('Clear all data for today?')) return;
  const result = await chrome.storage.local.get(['dailyData']);
  const dailyData = result.dailyData || {};
  delete dailyData[getTodayKey()];
  await chrome.storage.local.set({ dailyData });
  alert('Today\'s data cleared.');
});

document.getElementById('clearAllBtn').addEventListener('click', async () => {
  if (!confirm('This will delete ALL tracking data. Are you sure?')) return;
  await chrome.storage.local.clear();
  alert('All data cleared.');
});

// ---- Initial Load ----
loadToday();
