// ============================================================
// FocusLens - Background Service Worker
// Tracks active tab time and classifies websites
// ============================================================

const PRODUCTIVE_DOMAINS = [
  'github.com', 'gitlab.com', 'stackoverflow.com', 'leetcode.com',
  'hackerrank.com', 'codepen.io', 'replit.com', 'codesandbox.io',
  'developer.mozilla.org', 'docs.google.com', 'notion.so',
  'trello.com', 'jira.atlassian.com', 'confluence.atlassian.com',
  'coursera.org', 'udemy.com', 'edx.org', 'khanacademy.org',
  'medium.com', 'dev.to', 'hashnode.com', 'npmjs.com',
  'python.org', 'w3schools.com', 'freecodecamp.org', 'codecademy.com',
  'linkedin.com', 'slack.com', 'figma.com', 'vercel.com',
  'netlify.com', 'heroku.com', 'aws.amazon.com', 'cloud.google.com',
  'azure.microsoft.com', 'digitalocean.com', 'overleaf.com'
];

const UNPRODUCTIVE_DOMAINS = [
  'facebook.com', 'twitter.com', 'x.com', 'instagram.com',
  'tiktok.com', 'reddit.com', 'snapchat.com', 'pinterest.com',
  'tumblr.com', 'twitch.tv', 'youtube.com', 'netflix.com',
  'hulu.com', 'disneyplus.com', 'primevideo.com', '9gag.com',
  'buzzfeed.com', 'dailymail.co.uk', 'tmz.com', 'espn.com',
  'sports.yahoo.com', 'bleacherreport.com'
];

const NEUTRAL_DOMAINS = [
  'google.com', 'bing.com', 'duckduckgo.com', 'wikipedia.org',
  'amazon.com', 'ebay.com', 'gmail.com', 'outlook.com',
  'yahoo.com', 'news.ycombinator.com'
];

let activeTabId = null;
let activeTabUrl = null;
let activeTabStartTime = null;
let isIdle = false;

// ---- Helpers ----

function extractDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function classifyDomain(domain) {
  if (!domain) return 'neutral';
  const lower = domain.toLowerCase();
  if (PRODUCTIVE_DOMAINS.some(d => lower === d || lower.endsWith('.' + d))) return 'productive';
  if (UNPRODUCTIVE_DOMAINS.some(d => lower === d || lower.endsWith('.' + d))) return 'unproductive';
  return 'neutral';
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekKey() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return `week-${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}

async function saveTimeRecord(domain, seconds) {
  if (!domain || seconds < 1) return;

  const todayKey = getTodayKey();
  const weekKey = getWeekKey();
  const category = classifyDomain(domain);

  const result = await chrome.storage.local.get(['dailyData', 'weeklyData', 'allDomains']);
  
  let dailyData = result.dailyData || {};
  let weeklyData = result.weeklyData || {};
  let allDomains = result.allDomains || {};

  // Daily data
  if (!dailyData[todayKey]) dailyData[todayKey] = {};
  if (!dailyData[todayKey][domain]) dailyData[todayKey][domain] = { seconds: 0, category };
  dailyData[todayKey][domain].seconds += seconds;

  // Weekly aggregation
  if (!weeklyData[weekKey]) weeklyData[weekKey] = {};
  if (!weeklyData[weekKey][domain]) weeklyData[weekKey][domain] = { seconds: 0, category };
  weeklyData[weekKey][domain].seconds += seconds;

  // All-time domain registry
  if (!allDomains[domain]) allDomains[domain] = { totalSeconds: 0, category, customCategory: null };
  allDomains[domain].totalSeconds += seconds;

  // Keep only 30 days of daily data
  const keys = Object.keys(dailyData).sort();
  if (keys.length > 30) {
    keys.slice(0, keys.length - 30).forEach(k => delete dailyData[k]);
  }

  // Keep only 12 weeks
  const wkeys = Object.keys(weeklyData).sort();
  if (wkeys.length > 12) {
    wkeys.slice(0, wkeys.length - 12).forEach(k => delete weeklyData[k]);
  }

  await chrome.storage.local.set({ dailyData, weeklyData, allDomains });
}

async function recordCurrentSession() {
  if (activeTabUrl && activeTabStartTime && !isIdle) {
    const domain = extractDomain(activeTabUrl);
    const elapsed = Math.floor((Date.now() - activeTabStartTime) / 1000);
    if (domain && elapsed > 0) {
      await saveTimeRecord(domain, elapsed);
    }
  }
  activeTabStartTime = Date.now();
}

// ---- Event Listeners ----

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await recordCurrentSession();
  activeTabId = activeInfo.tabId;
  try {
    const tab = await chrome.tabs.get(activeTabId);
    activeTabUrl = tab.url;
  } catch {
    activeTabUrl = null;
  }
  activeTabStartTime = Date.now();
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.status === 'complete') {
    await recordCurrentSession();
    activeTabUrl = tab.url;
    activeTabStartTime = Date.now();
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await recordCurrentSession();
    activeTabStartTime = null;
  } else {
    try {
      const [tab] = await chrome.tabs.query({ active: true, windowId });
      if (tab) {
        activeTabId = tab.id;
        activeTabUrl = tab.url;
        activeTabStartTime = Date.now();
      }
    } catch {}
  }
});

// Idle detection
chrome.idle.setDetectionInterval(60);
chrome.idle.onStateChanged.addListener(async (state) => {
  if (state === 'idle' || state === 'locked') {
    await recordCurrentSession();
    isIdle = true;
    activeTabStartTime = null;
  } else if (state === 'active') {
    isIdle = false;
    activeTabStartTime = Date.now();
  }
});

// Periodic save every 30 seconds
chrome.alarms.create('periodicSave', { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'periodicSave') {
    await recordCurrentSession();
  }
  if (alarm.name === 'weeklyReport') {
    sendWeeklyReport();
  }
});

// Schedule weekly report on Sundays at 9 PM
chrome.alarms.create('weeklyReport', {
  when: getNextSundayAt21(),
  periodInMinutes: 7 * 24 * 60
});

function getNextSundayAt21() {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  nextSunday.setHours(21, 0, 0, 0);
  return nextSunday.getTime();
}

async function sendWeeklyReport() {
  const weekKey = getWeekKey();
  const result = await chrome.storage.local.get(['weeklyData']);
  const weeklyData = result.weeklyData || {};
  const weekData = weeklyData[weekKey] || {};

  let productive = 0, unproductive = 0, neutral = 0;
  Object.values(weekData).forEach(({ seconds, category }) => {
    if (category === 'productive') productive += seconds;
    else if (category === 'unproductive') unproductive += seconds;
    else neutral += seconds;
  });

  const total = productive + unproductive + neutral;
  const score = total > 0 ? Math.round((productive / total) * 100) : 0;

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: '📊 Weekly Productivity Report',
    message: `Productivity Score: ${score}%\n✅ Productive: ${Math.round(productive / 3600)}h\n❌ Unproductive: ${Math.round(unproductive / 3600)}h\nOpen dashboard for full analytics.`
  });
}

// Message listener for popup/dashboard queries
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CURRENT_TAB') {
    const domain = extractDomain(activeTabUrl);
    const elapsed = activeTabStartTime ? Math.floor((Date.now() - activeTabStartTime) / 1000) : 0;
    sendResponse({
      domain,
      category: classifyDomain(domain),
      elapsed
    });
  }
  if (message.type === 'UPDATE_CATEGORY') {
    updateDomainCategory(message.domain, message.category).then(() => sendResponse({ ok: true }));
    return true;
  }
  return true;
});

async function updateDomainCategory(domain, category) {
  const result = await chrome.storage.local.get(['allDomains', 'dailyData', 'weeklyData']);
  let allDomains = result.allDomains || {};
  let dailyData = result.dailyData || {};
  let weeklyData = result.weeklyData || {};

  if (allDomains[domain]) allDomains[domain].customCategory = category;

  // Update in daily and weekly data too
  Object.values(dailyData).forEach(day => {
    if (day[domain]) day[domain].category = category;
  });
  Object.values(weeklyData).forEach(week => {
    if (week[domain]) week[domain].category = category;
  });

  await chrome.storage.local.set({ allDomains, dailyData, weeklyData });
}

console.log('[FocusLens] Background service worker started.');
