// ============================================================
// FocusLens - Popup Script
// ============================================================

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatTimer(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getCategoryColor(cat) {
  if (cat === 'productive') return 'var(--productive)';
  if (cat === 'unproductive') return 'var(--unproductive)';
  return 'var(--neutral)';
}

let timerInterval = null;
let currentElapsed = 0;

async function loadPopup() {
  // Get current tab info from background
  const current = await chrome.runtime.sendMessage({ type: 'GET_CURRENT_TAB' });
  
  if (current && current.domain) {
    document.getElementById('currentDomain').textContent = current.domain;
    currentElapsed = current.elapsed || 0;
    updateTimer();

    const badge = document.getElementById('categoryBadge');
    const icons = { productive: '🟢', unproductive: '🔴', neutral: '⚪' };
    badge.textContent = `${icons[current.category] || '⚪'} ${current.category.charAt(0).toUpperCase() + current.category.slice(1)}`;
    badge.className = `category-badge badge-${current.category}`;

    // Start live timer
    timerInterval = setInterval(() => {
      currentElapsed++;
      updateTimer();
    }, 1000);
  } else {
    document.getElementById('currentDomain').textContent = 'No active tab';
    document.getElementById('currentTimer').textContent = '—';
  }

  // Load today's stats
  const result = await chrome.storage.local.get(['dailyData']);
  const dailyData = result.dailyData || {};
  const todayKey = getTodayKey();
  const todayData = dailyData[todayKey] || {};

  let productive = 0, unproductive = 0, neutral = 0, total = 0;
  const sites = [];

  Object.entries(todayData).forEach(([domain, info]) => {
    const s = info.seconds || 0;
    if (info.category === 'productive') productive += s;
    else if (info.category === 'unproductive') unproductive += s;
    else neutral += s;
    total += s;
    sites.push({ domain, seconds: s, category: info.category });
  });

  document.getElementById('statProductive').textContent = formatTime(productive);
  document.getElementById('statUnproductive').textContent = formatTime(unproductive);
  document.getElementById('statTotal').textContent = formatTime(total);

  const score = total > 0 ? Math.round((productive / total) * 100) : null;
  const scoreEl = document.getElementById('scoreValue');
  if (score !== null) {
    scoreEl.textContent = `${score}%`;
    scoreEl.style.color = score >= 60 ? 'var(--productive)' : score >= 40 ? 'var(--neutral)' : 'var(--unproductive)';
  }

  if (total > 0) {
    document.getElementById('barProductive').style.width = `${(productive / total) * 100}%`;
    document.getElementById('barNeutral').style.width = `${(neutral / total) * 100}%`;
    document.getElementById('barUnproductive').style.width = `${(unproductive / total) * 100}%`;
  }

  // Top sites
  const topSites = sites.sort((a, b) => b.seconds - a.seconds).slice(0, 5);
  const listEl = document.getElementById('topSitesList');

  if (topSites.length === 0) {
    listEl.innerHTML = '<div class="empty-state">No data yet today. Start browsing!</div>';
  } else {
    listEl.innerHTML = topSites.map(site => `
      <div class="site-row">
        <div class="site-dot" style="background:${getCategoryColor(site.category)}"></div>
        <span class="site-row-domain">${site.domain}</span>
        <span class="site-row-time">${formatTime(site.seconds)}</span>
      </div>
    `).join('');
  }
}

function updateTimer() {
  document.getElementById('currentTimer').textContent = formatTimer(currentElapsed);
}

document.getElementById('openDashboard').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById('openSettings').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

window.addEventListener('unload', () => {
  if (timerInterval) clearInterval(timerInterval);
});

loadPopup();
