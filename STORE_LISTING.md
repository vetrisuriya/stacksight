# Chrome Web Store – Complete Submission Guide for StackSight

This document contains the exact content to paste into every field on the Chrome Web Store
Developer Dashboard when publishing StackSight. Follow each section in order.

---

## STEP 1 – Upload the Extension Package

- Go to: https://chrome.google.com/webstore/devconsole
- Click **New Item**
- Upload `stacksight.zip` (the extension folder zipped — NOT including the outer directory)
- Wait for validation to complete

---

## STEP 2 – Store Listing

### Extension Name
```
StackSight – Tech Stack Detector
```
*(Max 45 characters — this is 33)*

---

### Summary (Short Description)
*(Max 132 characters — shown in search results)*

```
Instantly detect any website's tech stack: CMS, frameworks, analytics, CDN, cloud, security & performance. Free. Private. No login.
```
*(131 characters)*

---

### Description (Detailed)
*(Max 16,000 characters. Paste the following exactly.)*

```
🔍 STACKSIGHT — INSTANTLY DISCOVER ANY WEBSITE'S TECH STACK

One click. One second. Zero data sent anywhere.

StackSight is a free, open-source Chrome Extension that reveals the exact technology stack powering any website you visit — without sending a single byte of your data to any server.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ WHAT STACKSIGHT DETECTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🗂 CMS PLATFORMS
→ WordPress, Shopify, Drupal, Joomla, Magento, Wix, Squarespace, Ghost, Webflow

⚙️ FRONTEND FRAMEWORKS & LIBRARIES
→ React, Next.js, Vue, Nuxt, Angular, AngularJS, Svelte, Alpine.js, Astro, Ember
→ jQuery, Bootstrap, Lodash, Moment.js, GSAP, Three.js, Tailwind CSS, HTMX

📈 ANALYTICS & TRACKING TOOLS
→ Google Analytics 4, Google Tag Manager, Facebook Pixel, Hotjar, Microsoft Clarity
→ LinkedIn Insight, Amplitude, Mixpanel, Segment, Intercom, Heap
→ TikTok Pixel, Twitter/X Pixel, Optimizely, VWO, Crisp, Sentry

☁️ CLOUD PROVIDERS
→ AWS, Microsoft Azure, Google Cloud, DigitalOcean, Vercel, Netlify
→ Cloudflare Pages, Heroku, Render

🌐 CDN PROVIDERS
→ Cloudflare, Amazon CloudFront, Akamai, Fastly, BunnyCDN, KeyCDN
→ MaxCDN / StackPath, jsDelivr, unpkg

🔒 SECURITY ANALYSIS
→ HTTPS detection
→ Content-Security-Policy (CSP)
→ Strict-Transport-Security (HSTS)
→ X-Frame-Options
→ X-Content-Type-Options
→ Referrer-Policy
→ Permissions-Policy
→ Cross-Origin-Opener-Policy
→ Security grade: A+ to F

⚡ PERFORMANCE INSIGHTS
→ Script count, CSS count, image count, font count
→ Third-party resource count
→ Total HTTP requests
→ Actionable recommendations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 100% PRIVATE — YOUR DATA NEVER LEAVES YOUR BROWSER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

StackSight is built with privacy as a first-class feature:

• No data collection of any kind
• No account or login required
• No analytics inside the extension itself
• No cookies set by the extension
• No cloud storage, no database, no backend server
• All processing happens locally in your browser
• The only network request is a HEAD call to the site you are already visiting

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 EXPORT YOUR ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Download your analysis as:
• JSON — structured, machine-readable, perfect for automation
• TXT — human-readable report for client decks and documentation

Both export entirely locally — no upload, no server.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌗 DARK & LIGHT MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Beautiful dark UI by default. One-click toggle to light mode.
Your preference is saved automatically.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 OPEN SOURCE — MIT LICENSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

StackSight is 100% open source. Every line of code is on GitHub.
Contributions, bug reports, and feature requests are always welcome.

GitHub: https://github.com/vetrisuriya/stacksight

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 WHO IS STACKSIGHT FOR?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Developers — discover the stack before you apply for a job or start a project
• Technical Marketers — audit competitor tech stacks for strategic insights
• Consultants & Agencies — quickly profile client websites during discovery
• Security Researchers — audit security headers on any site
• Curious technologists — satisfy your "what is this site built with?" curiosity instantly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 SUPPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Found a bug or want a new technology detected?
Open an issue: https://github.com/vetrisuriya/stacksight/issues

StackSight is free forever. No premium version. No subscription.
```

---

### Category
```
Developer Tools
```

---

### Language
```
English
```

---

## STEP 3 – Graphic Assets

### Store Icon
- **File**: `assets/icon128.png`
- **Size**: 128 × 128 px (required)
- Format: PNG with no alpha around the edges (Chrome adds the round mask)

### Screenshots
*(Required: 1–5 screenshots. Format: PNG or JPEG. Size: exactly 1280×800 or 640×400 px.)*

Take these screenshots after loading the extension:

| # | Description | Instructions |
|---|---|---|
| 1 | Overview tab on a WordPress site | Visit any WordPress blog, open StackSight, stay on Overview tab |
| 2 | Technologies tab on a React/Next.js site | Visit vercel.com or nextjs.org, click Technologies tab |
| 3 | Security tab showing grade | Visit any site, click Security tab |
| 4 | Analytics tab showing multiple trackers | Visit a major news site, click Analytics tab |
| 5 | Light mode on a Shopify site | Visit shopify.com, open StackSight, toggle light mode |

**Screenshot naming convention:**
- `screenshot-01-overview.png`
- `screenshot-02-technologies.png`
- `screenshot-03-security.png`
- `screenshot-04-analytics.png`
- `screenshot-05-light-mode.png`

### Promotional Images (Optional but Recommended)

**Small Promotional Tile: 440 × 280 px**
Text to include:
- "StackSight" (large)
- "Detect any website's tech stack instantly"
- Extension icon
- Background: dark (#0F172A) with indigo accent

**Marquee Promotional Image: 1400 × 560 px** (optional)
Text to include:
- "StackSight – Tech Stack Detector"
- "CMS • Frameworks • Analytics • CDN • Cloud • Security • Performance"
- "Free. Open Source. No Login. No Data Collection."

---

## STEP 4 – Privacy Practices

### Single Purpose Description
*(Describe the single purpose of the extension in one sentence)*

```
StackSight detects and displays the technology stack of any website the user is currently visiting.
```

---

### Permissions Justification

You must justify each permission. Use the following verbatim:

**activeTab**
```
Required to access the URL and content of the tab the user is actively viewing when they click the StackSight extension icon. StackSight only activates on demand — it never runs in the background on pages the user has not explicitly triggered analysis on.
```

**scripting**
```
Required to inject two lightweight analysis scripts into the active page: one in the ISOLATED world to read DOM structure (script sources, link hrefs, meta tags, performance resource entries), and one in the MAIN world to read JavaScript global variables set by frameworks and libraries (e.g. window.React, window.__NEXT_DATA__). No page content is modified. No data is transmitted.
```

**tabs**
```
Required to read the active tab's URL and title. The URL is used to extract the hostname for display in the popup header and for the page origin comparison in the performance analysis (identifying third-party resources). The title is used only when naming the exported report file locally.
```

**host_permissions: <all_urls>**
```
Required by the background service worker to make a HEAD request (with GET fallback) to the URL of the page the user is already visiting. This request reads the HTTP response headers of that page (e.g. Server, X-Powered-By, Content-Security-Policy, Strict-Transport-Security) for security analysis. No request is ever made to any domain other than the one the user is currently on. No data is logged or stored.
```

---

### Data Usage

Answer each question on the Privacy Practices form as follows:

| Question | Answer |
|---|---|
| Does the extension collect any user data? | **No** |
| Website content | Not collected |
| User activity | Not collected |
| Personal communications | Not collected |
| Location | Not collected |
| Web history | Not collected |
| User activity | Not collected |
| Financial and payment information | Not collected |
| Health information | Not collected |
| Authentication information | Not collected |
| Personal identification information | Not collected |
| Do you use the data for advertising purposes? | **No** |
| Do you use the data for analytics? | **No** |
| Do you sell the data to third parties? | **No** |
| Do you transfer the data to third parties? | **No** |
| Do you use or transfer data for creditworthiness or lending purposes? | **No** |

**Certify**: Check the box confirming you have disclosed all data collection and usage.

---

### Privacy Policy URL
```
https://your-org.github.io/stacksight/privacy.html
```
*(Replace `your-org` with your actual GitHub username/org)*

---

## STEP 5 – Distribution

### Visibility
```
Public
```

### Regions
```
All regions (or your preferred subset)
```

### Pricing
```
Free
```

---

## STEP 6 – Additional Fields

### Homepage URL
```
https://your-org.github.io/stacksight
```

### Support URL
```
https://github.com/vetrisuriya/stacksight/issues
```

### Version Number
*(Matches `manifest.json` → `"version": "1.0.0"`)*
```
1.0.0
```

---

## STEP 7 – Submit for Review

Before submitting, verify:

- [ ] Extension name does not include "Chrome" or "Google"
- [ ] Description does not include keyword stuffing
- [ ] All permission justifications are filled in
- [ ] Privacy policy URL is live and accessible
- [ ] Store icon is 128×128 PNG
- [ ] At least one screenshot is uploaded (1280×800 or 640×400)
- [ ] manifest.json `version` field matches what you entered in the dashboard
- [ ] The zip contains the extension folder contents (not the folder itself)

Click **Submit for Review**. First review typically takes 1–7 business days.

---

## STEP 8 – After Approval

Once approved:

1. **Announce** on GitHub Discussions / social media
2. **Add the Chrome Web Store badge** to your README and landing page:
   ```html
   <a href="https://chrome.google.com/webstore/detail/stacksight/EXTENSION_ID">
     <img src="https://storage.googleapis.com/web-dev-uploads/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/YT2Grfi9vEBa2wAPzhWa.png"
          alt="Available in the Chrome Web Store" height="58" />
   </a>
   ```
3. **Update the GitHub repo** with the real extension ID in all links
4. **Tag the release** in Git: `git tag v1.0.0 && git push --tags`
5. **Create a GitHub Release** with the `stacksight.zip` attached as a release asset

---

## Common Rejection Reasons & How to Avoid Them

| Rejection Reason | How StackSight Avoids It |
|---|---|
| Over-broad permissions | All permissions are individually justified above |
| Missing privacy policy | Privacy policy is at docs/privacy.html |
| Unclear single purpose | Single purpose statement is clear and accurate |
| Extension modifies pages | StackSight is read-only — no page modification |
| Remote code execution | All code is bundled locally; no eval() or remote scripts |
| Misleading description | Description accurately describes all features |
| Keyword stuffing | Description is natural and not repetitive |
| No support URL | Support URL links to GitHub issues |

---

*Last updated: June 2026 · StackSight v1.0.0*
