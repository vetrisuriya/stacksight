# Contributing to StackSight

First of all — thank you for taking the time to contribute! StackSight is a community project and every improvement, bug fix, or new detector makes it better for everyone.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Ways to Contribute](#ways-to-contribute)
- [Adding a New Detector](#adding-a-new-detector)
- [Adding a Technology to an Existing Detector](#adding-a-technology-to-an-existing-detector)
- [Coding Guidelines](#coding-guidelines)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

---

## Code of Conduct

This project follows a [Code of Conduct](CODE_OF_CONDUCT.md). By participating you agree to abide by its terms. Be kind, be constructive.

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/vetrisuriya/stacksight.git
   cd stacksight
   ```
3. **Generate icons** (requires Python 3, no extra packages):
   ```bash
   python3 assets/generate-icons.py
   ```
4. **Load in Chrome** as an unpacked extension:
   - Open `chrome://extensions`
   - Enable **Developer mode**
   - Click **Load unpacked** → select the `stacksight/` folder

That's it — no npm install, no build step, no bundler.

---

## Development Setup

StackSight is intentionally zero-dependency:
- Vanilla ES6 JavaScript
- No build tools, no TypeScript compilation
- No npm packages

To reload changes during development, click the ↺ **Reload** button next to the extension on `chrome://extensions` after saving a file.

For popup changes, simply close and reopen the popup — it always re-runs popup.js on open.

---

## Project Structure

```
stacksight/
├── manifest.json                   # Extension manifest (MV3)
├── popup/
│   ├── popup.html                  # UI shell
│   ├── popup.css                   # All styles (dark + light theme)
│   └── popup.js                    # Orchestrator: collects data, runs detectors, renders UI
├── background/
│   └── background.js               # Service worker: fetches HTTP headers
├── content/
│   └── content.js                  # DOM content script (ISOLATED world)
├── services/
│   ├── detector.js                 # DetectorUtils: shared helper methods
│   ├── cms-detector.js             # → CMS identification
│   ├── framework-detector.js       # → Framework + library identification
│   ├── analytics-detector.js       # → Tracking tool identification
│   ├── cdn-detector.js             # → CDN identification
│   ├── cloud-detector.js           # → Cloud provider identification
│   ├── security-detector.js        # → Header audit + scoring
│   ├── performance-detector.js     # → Resource count scoring
│   └── export-service.js           # → JSON / TXT file export
├── assets/
│   ├── generate-icons.py           # Generates PNG icons (no deps)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── docs/
    ├── index.html                  # GitHub Pages landing page
    └── privacy.html                # Privacy policy page
```

---

## Ways to Contribute

- **Add support for a new CMS, framework, analytics tool, or cloud provider**
- **Improve detection accuracy** for existing technologies
- **Fix a bug** you found while using the extension
- **Improve the UI** in popup.css or popup.html
- **Write documentation** or improve existing docs
- **Translate** the UI (future goal)
- **Report a detection error** if a site is wrongly identified

---

## Adding a New Detector

If you want to add an entirely new detector category (e.g. an e-commerce detector), create a new file in `services/` and follow this pattern:

```javascript
// services/ecommerce-detector.js

const EcommerceDetector = {
  detect({ dom, win, headers, url }) {
    // Use DetectorUtils if needed: DetectorUtils.hasScript(dom, 'pattern')
    // Return null if nothing found, or:
    return {
      name:       'WooCommerce',
      confidence: 90,            // 0–100
      signals:    ['woocommerce cookie', 'wc-ajax script'],
    };
  },
};
```

Then wire it into `popup/popup.js`:

1. Add a `<script src="../services/ecommerce-detector.js"></script>` to `popup/popup.html`
2. Call `EcommerceDetector.detect(pageData)` inside `analyzeAll()` in `popup.js`
3. Store the result in `results.ecommerce`
4. Render it in the appropriate tab with `renderTechList(...)` or a custom renderer

---

## Adding a Technology to an Existing Detector

Each detector file contains named `_detect*` methods. To add a new technology, find the right detector file and add a new method.

**Example — adding SolidJS to `framework-detector.js`:**

```javascript
_detectSolidJS(dom, win) {
  // Check for window global
  if (win['$$$']) return { name: 'SolidJS', confidence: 85, signals: ['$$$  global'] };

  // Check script src
  if (DetectorUtils.hasScript(dom, 'solid')) {
    return { name: 'SolidJS', confidence: 70, signals: ['solid in script src'] };
  }

  return null;
},
```

Then call it from `detect()`:

```javascript
const solid = this._detectSolidJS(dom, win);
if (solid) found.push(solid);
```

**Confidence score guidelines:**
- **90–99** — Definitive proof (e.g. a unique global variable the library sets)
- **70–89** — Strong signal with possible false positives (e.g. URL pattern)
- **50–69** — Circumstantial evidence (e.g. a common filename)
- **< 50**  — Weak signal; not recommended

---

## Coding Guidelines

- **ES6, vanilla JS only** — no TypeScript, no build tools, no npm imports
- **One concern per file** — detectors are plain objects, not classes
- **Descriptive names** — prefer clarity over brevity
- **Comment non-obvious logic** — a one-liner explaining a regex saves future maintainers time
- **No external network calls** from detectors — all data comes from the `pageData` argument
- **Always handle null/undefined** — pageData.dom, pageData.win, pageData.headers may be empty
- **Return null from detectors** when nothing is found — never return `undefined`
- **Keep confidence scores honest** — overconfident scores degrade trust

**File header template:**

```javascript
/**
 * StackSight – your-detector.js
 * One-sentence description of what this detector identifies.
 * Detection signals: list the key signals used.
 */
```

---

## Submitting a Pull Request

1. Create a feature branch:
   ```bash
   git checkout -b feature/add-solidjs-detection
   ```

2. Make your changes with clear commit messages:
   ```bash
   git commit -m "feat(framework): add SolidJS detection via \$\$\$ global"
   ```

3. Push and open a Pull Request:
   ```bash
   git push origin feature/add-solidjs-detection
   ```

4. Fill in the PR template — describe what changed, how you tested it, and which sites demonstrate the detection.

**PR checklist:**
- [ ] I tested this on at least 2–3 real websites
- [ ] I haven't broken existing detections (tested on known WordPress, React, etc. sites)
- [ ] My confidence scores are justified
- [ ] I've updated docs/README if needed

---

## Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:
- The URL of the site that triggered the bug (if public)
- What StackSight showed vs. what you expected
- Chrome version and OS

---

## Requesting Features

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md). The most popular requests are prioritised first, so feel free to upvote existing issues with 👍.

---

Thank you for helping make StackSight better! 🚀
