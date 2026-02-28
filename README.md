# CHROME EXTENSION FOR TIME TRACKING AND PRODUCTIVITY ANALYTICS

Company Name: CODTECH IT SOLUTIONS

Name: Rajratna Nitin Kamble

Intern ID: CTIS3288

Domain Name: Full Stack Web Development

Batch Duration: 8 Weeks

Mentor Name: Neela Santosh

# 🔍 FocusLens — Time Tracker & Productivity Analytics

A powerful Chrome Extension that tracks time spent on websites, classifies them as productive or unproductive, and provides beautiful weekly productivity reports.

---

## 📦 Installation

### Method 1: Load Unpacked (Development)
1. Download and extract this folder
2. Open Chrome and go to: `chrome://extensions/`
3. Enable **Developer Mode** (toggle top-right)
4. Click **"Load unpacked"**
5. Select the `time-tracker-extension` folder
6. The 🔍 FocusLens icon will appear in your toolbar!

### Method 2: Pack as .crx
1. Go to `chrome://extensions/`
2. Click **"Pack extension"**
3. Select the extension directory
4. Distribute the `.crx` file

---

## 🚀 Features

### ⏱️ Real-Time Tracking
- Tracks time spent on every website automatically
- Detects idle time (pauses after 60 seconds of inactivity)
- Saves data every 30 seconds — nothing is lost

### 🏷️ Smart Classification
**Productive** (✅ Green):
- `github.com`, `stackoverflow.com`, `leetcode.com`, `hackerrank.com`
- `coursera.org`, `udemy.com`, `edx.org`, `khanacademy.org`
- `notion.so`, `figma.com`, `slack.com`, `linkedin.com`
- `developer.mozilla.org`, `freecodecamp.org`, `codecademy.com`
- And 20+ more coding/learning platforms

**Unproductive** (🚫 Red):
- `facebook.com`, `instagram.com`, `twitter.com/x.com`
- `tiktok.com`, `reddit.com`, `youtube.com`, `netflix.com`
- `twitch.tv`, `snapchat.com`, `pinterest.com` + more

**Neutral** (⚪ Yellow):
- Everything else (Google, Gmail, Wikipedia, etc.)

### 📊 Analytics Dashboard
Access via right-clicking the extension → "Options" or clicking "Full Dashboard" in the popup.

**Today Tab:**
- Productivity Score (0–100%)
- Time breakdown: Productive / Neutral / Unproductive
- Hourly activity chart
- Category distribution pie chart
- All sites table with time & percentage

**Weekly Tab:**
- Weekly productivity score
- Day-by-day stacked bar chart (Mon–Sun)
- 4-week productivity trend line chart
- Top sites for the week with active days count

**All Sites Tab:**
- Every tracked domain with total time
- Override classification for any site
- Add custom domain rules

**Settings Tab:**
- Export all data as JSON
- Clear today's data or all data
- View built-in domain classifications

### 📅 Weekly Reports
- Automatic notification every Sunday at 9 PM
- Shows weekly score, productive hours, and unproductive hours

---

## 📁 File Structure

```
time-tracker-extension/
├── manifest.json       # Extension configuration (Manifest V3)
├── background.js       # Service worker — core tracking engine
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic and live timer
├── dashboard.html      # Full analytics dashboard
├── dashboard.js        # Dashboard charts & data logic
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

---

## 🔒 Privacy

- **100% local** — all data stored in `chrome.storage.local`
- **No external servers** — nothing is ever transmitted
- **No account required** — works immediately
- You can export or delete all data at any time from Settings

---

## 🛠️ Customization

### Add Custom Domain Classifications
1. Open the extension popup → "Full Dashboard"
2. Go to the **"All Sites"** tab
3. Use the dropdown next to any domain to reclassify it
4. Or add a new domain rule with the input form at the top

### Override Built-in Classifications
For example, if you use `youtube.com` for tutorials, override it to "Productive" in the All Sites tab.

---

## 📈 Productivity Score Formula

```
Score = (Productive Time / Total Browsing Time) × 100
```

| Score | Grade |
|-------|-------|
| 80–100% | 🏆 Outstanding |
| 60–79% | ✅ Productive Day |
| 40–59% | ⚡ Mixed Focus |
| 20–39% | ⚠️ Distracted |
| 0–19% | 🚫 Off-track |

---

## 🧰 Tech Stack

- **Manifest V3** Chrome Extension API
- **chrome.storage.local** for all persistence
- **chrome.alarms** for periodic saves & weekly reports
- **chrome.idle** for idle detection
- **Chart.js 4.4** for analytics visualizations
- **Outfit + Space Mono** Google Fonts
- Pure vanilla HTML/CSS/JS — no frameworks, no dependencies

---

*Built for the Internship Task 4 — Chrome Extension for Time Tracking & Productivity Analytics*
