# StackSight

> **Instantly discover the technology behind any website.**

StackSight is a free, open-source Chrome Extension (Manifest V3) that scans any web page you visit and tells you exactly what tech stack it runs on — CMS, frontend frameworks, analytics tools, CDN, cloud provider, security headers, and more. Everything runs locally in your browser. No accounts. No servers. No data collection.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Folder Structure](#folder-structure)
- [How Detection Works](#how-detection-works)
- [Scoring System](#scoring-system)
- [Privacy Policy](#privacy-policy)
- [Exporting Reports](#exporting-reports)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Developers and technical marketers often need to know what technology a website uses — whether for competitive research, due diligence, or curiosity. StackSight makes this instant and private.

Click the extension icon on any tab and within 1–2 seconds you'll see:

- The CMS powering the site (WordPress, Shopify, Drupal, …)
- Frontend frameworks and JS libraries (React, Next.js, Vue, jQuery, …)
- Analytics & tracking tools (GA4, GTM, Facebook Pixel, Hotjar, …)
- CDN and cloud provider
- Security score and header audit
- Performance snapshot with recommendations

---

## Features

| Feature | Description |
|---|---|
| CMS Detection | WordPress, Shopify, Drupal, Joomla, Magento, Wix, Squarespace, Ghost, Webflow |
| Framework Detection | React, Next.js, Vue, Nuxt, Angular, Svelte, Alpine, Astro, Ember |
| Library Detection | jQuery, Bootstrap, Lodash, Moment.js, GSAP, Three.js, Tailwind, HTMX |
| Analytics Detection | GA4, GTM, Facebook Pixel, Hotjar, Clarity, LinkedIn, Amplitude, Mixpanel, Segment, Intercom, Heap, Sentry, and more |
| CDN Detection | Cloudflare, CloudFront, Akamai, Fastly, BunnyCDN, KeyCDN, jsDelivr |
| Cloud Detection | AWS, Azure, GCP, DigitalOcean, Vercel, Netlify, Cloudflare Pages, Heroku, Render |
| Security Analysis | HTTPS status, 7 security headers audited, grade A+–F |
| Performance Insights | Script / CSS / image / font / third-party counts + recommendations |
| Export Reports | Download JSON or TXT report locally — no server needed |
| Light / Dark Mode | Toggle with one click; preference saved in localStorage |

---

## Installation

### Option A — Load Unpacked (Developer Mode)

1. Clone or download this repository:
   ```bash
   git clone https://github.com/vetrisuriya/stacksight.git
   ```

2. Generate the PNG icons (requires Python 3, no extra packages):
   ```bash
   python3 assets/generate-icons.py
   ```

3. Open Chrome and navigate to `chrome://extensions`

4. Enable **Developer mode** (toggle in the top-right corner)

5. Click **Load unpacked** and select the `stacksight/` folder

6. The StackSight icon will appear in your toolbar. Pin it for easy access.

### Option B — Chrome Web Store

*(Coming soon — submission in progress)*

---

## Folder Structure

```
stacksight/
├── manifest.json              # Manifest V3 configuration
├── popup/
│   ├── popup.html             # Extension popup UI
│   ├── popup.css              # Styles (dark + light theme)
│   └── popup.js               # Orchestrator: collects data, calls detectors, renders UI
├── background/
│   └── background.js          # Service worker: fetches HTTP response headers
├── content/
│   └── content.js             # Content script: DOM data collector (isolated world)
├── services/
│   ├── detector.js            # Shared DetectorUtils helpers
│   ├── cms-detector.js        # CMS identification
│   ├── framework-detector.js  # Frontend framework + library identification
│   ├── analytics-detector.js  # Tracking tool identification
│   ├── cloud-detector.js      # Cloud provider identification
│   ├── cdn-detector.js        # CDN identification
│   ├── security-detector.js   # Security header audit + scoring
│   ├── performance-detector.js# Resource count analysis + scoring
│   └── export-service.js      # JSON / TXT download logic
├── assets/
│   ├── generate-icons.py      # Generates icon PNGs (pure stdlib Python 3)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

---

## How Detection Works

### Data Collection Pipeline

StackSight collects page data in three layers — each inaccessible to the others — then merges them for analysis:

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1 – DOM (ISOLATED world via chrome.scripting)            │
│  collectIsolatedData() → script srcs, link hrefs, meta tags,    │
│  cookies, HTML attributes, PerformanceResourceTiming entries     │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  Layer 2 – JS Globals (MAIN world via chrome.scripting)         │
│  collectMainWorldData() → window.React, window.jQuery,          │
│  window.__NUXT__, window.angular, etc.                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  Layer 3 – HTTP Headers (background service worker)             │
│  fetchHeaders() → HEAD/GET request captures response headers:   │
│  Server, X-Powered-By, Set-Cookie, CF-Cache-Status, etc.        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                     pageData object
              { dom, win, headers, url }
                             │
              ┌──────────────▼──────────────┐
              │  Detector services called    │
              │  in popup.js → analyzeAll()  │
              └──────────────┬──────────────┘
                             │
                      results object
               rendered in popup UI
```

### CMS Detection Signals

| CMS | Signals Used |
|---|---|
| WordPress | `wp-content` / `wp-includes` in URLs, generator meta, `wp-json` API path, `window.wpApiSettings` |
| Shopify | `Shopify.shop` global, `cdn.shopify.com` assets, `/checkout` cookie |
| Drupal | `Drupal.settings` global, `drupal.js`, generator meta |
| Magento | `window.Mage`, `/skin/frontend/` URL pattern, `MAGE_CACHE_STORAGE` cookie |
| Joomla | generator meta, `/media/system/js/` URLs |
| Wix | `wix-code` attributes, `static.wixstatic.com` |
| Squarespace | `window.Squarespace`, `sqsp-` CSS classes |
| Ghost | `window.ghost`, `ghost.io` hostname |
| Webflow | `data-wf-page`, `webflow.com/css/` |

### Framework Detection Signals

| Framework | Primary Signals |
|---|---|
| React | `window.React`, `__reactFiber` on DOM nodes, `_reactRootContainer` |
| Next.js | `window.__NEXT_DATA__`, `/_next/static/` URLs |
| Vue 2/3 | `window.Vue`, `__vue__` / `__vueParentComponent` on DOM nodes |
| Nuxt | `window.__NUXT__`, `/_nuxt/` URLs |
| Angular | `window.ng`, `ng-version` attribute, `window.angular` |
| Svelte | `svelte-` class prefix, `__svelte` DOM props |
| Alpine.js | `window.Alpine`, `x-data` attributes |
| Astro | `data-astro-cid` attributes |

### Security Header Scoring

```
Start:  100 points
−30     No HTTPS
−20     Missing Content-Security-Policy
−15     Missing Strict-Transport-Security
−10     Missing X-Frame-Options
−10     Missing X-Content-Type-Options
−10     Missing Referrer-Policy
 −8     Missing Permissions-Policy
 −7     Missing Cross-Origin-Opener-Policy
```

Grades: A+ (≥95) · A (≥90) · B (≥80) · C (≥70) · D (≥60) · F (<60)

---

## Scoring System

StackSight shows four scores in the top row of the popup:

| Score | What it measures |
|---|---|
| **Technology** | Breadth of detected stack: +50 baseline, +15 for CMS, +20 for frameworks, +15 for backend |
| **Security** | Header completeness and HTTPS (see above) |
| **Performance** | Penalises excessive scripts, images, fonts, and third-party resources |
| **Privacy** | Penalises analytics/tracker count (−12 per tracker, capped at 0) |

---

## Privacy Policy

StackSight is fully private by design:

- **No data is ever transmitted** to any server
- **No analytics** are included in the extension itself
- **No account or login** is required
- **No cookies** are set by the extension
- All processing happens **locally in your browser**
- The only network request made is a `HEAD` (then `GET` fallback) to the **current tab's own URL** to read its response headers

---

## Exporting Reports

Click **Export JSON** or **Export TXT** in the bottom bar of the popup.

A file named `stacksight-<hostname>-<date>.json` (or `.txt`) will be downloaded immediately to your default downloads folder. No server is involved.

### JSON report shape

```json
{
  "meta": { "tool": "StackSight", "url": "...", "exportedAt": "..." },
  "scores": { "technology": 85, "security": 70, "performance": 90, "privacy": 64 },
  "cms": { "name": "WordPress", "confidence": 99 },
  "frameworks": [{ "name": "React", "confidence": 95 }],
  "analytics": [{ "name": "Google Analytics 4" }, { "name": "Hotjar" }],
  "cdn":   { "name": "Cloudflare", "confidence": 95 },
  "cloud": { "name": "AWS",        "confidence": 70 },
  "security": {
    "score": 70, "grade": "C", "https": true,
    "headers": { "content-security-policy": "", "strict-transport-security": "max-age=31536000" },
    "issues": ["Missing Content-Security-Policy — CSP prevents XSS attacks"],
    "passed": ["HTTPS enabled", "Strict-Transport-Security: max-age=31536000"]
  },
  "performance": {
    "score": 85, "scriptCount": 12, "cssCount": 3,
    "imageCount": 18, "fontCount": 2, "thirdPartyCount": 7, "totalResources": 64,
    "recommendations": [{ "type": "good", "icon": "✅", "text": "Script count looks healthy (12)" }]
  }
}
```

---

## Screenshots

> *(Add screenshots here once the extension is loaded in Chrome)*

- `docs/screenshot-overview.png` — Overview tab
- `docs/screenshot-tech.png` — Technologies tab
- `docs/screenshot-security.png` — Security tab
- `docs/screenshot-performance.png` — Performance tab
- `docs/screenshot-dark.png` — Dark mode
- `docs/screenshot-light.png` — Light mode

---

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository and create a feature branch:
   ```bash
   git checkout -b feature/add-laravel-detection
   ```

2. **Make your changes.** If you're adding a new detector, follow the pattern in `services/cms-detector.js`:
   - Export a plain object with a `.detect(pageData)` method
   - Return `{ name, confidence }` or `null`
   - Add it to the `analyzeAll()` pipeline in `popup/popup.js`

3. **Test manually** by loading the unpacked extension and visiting representative sites.

4. **Submit a pull request** with a clear description of what you changed and why.

### Ideas for contributions

- Additional CMS support (Ghost, Craft CMS, Contentful, Sanity)
- More framework detectors (SolidJS, Qwik, Remix, SvelteKit)
- Backend detector improvements (Laravel, Django, Spring, Rails)
- `dom.perfResources` richer analysis (largest resources, estimated total transfer size)
- Accessibility score tab
- History / comparison across multiple sites

### Code style

- Vanilla ES6 — no build step, no bundler
- One concern per file; detectors are plain objects (not classes)
- Descriptive variable names; inline comments for non-obvious logic
- No external dependencies

---

## License

MIT © StackSight Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, subject to the standard MIT terms.

---

*Built with ❤️ for developers who want to know what's under the hood.*
