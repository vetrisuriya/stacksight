# Changelog

All notable changes to StackSight will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] – 2026-06-01

### Added

**Core Extension**
- Manifest V3 Chrome Extension with zero-dependency, zero-backend architecture
- Three-layer detection pipeline: DOM signals (ISOLATED world), JS globals (MAIN world), HTTP response headers
- Background service worker for header fetching (HEAD → GET fallback)
- Content script for DOM data collection

**CMS Detection**
- WordPress (wp-content, wp-includes, generator meta, wp-json, wpApiSettings global)
- Shopify (Shopify.shop global, cdn.shopify.com assets)
- Drupal (Drupal.settings, drupal.js, generator meta)
- Joomla (generator meta, /media/system/js/ paths)
- Magento (window.Mage, /skin/frontend/, MAGE_CACHE_STORAGE cookie)
- Wix (wix-code attributes, static.wixstatic.com)
- Squarespace (window.Squarespace, sqsp- classes)
- Ghost (window.ghost, ghost.io hostname)
- Webflow (data-wf-page, webflow.com/css/)

**Framework & Library Detection**
- React (window.React, __reactFiber DOM nodes)
- Next.js (window.__NEXT_DATA__, /_next/static/ URLs)
- Vue 2 & 3 (window.Vue, __vue__, __vueParentComponent)
- Nuxt (window.__NUXT__, /_nuxt/ URLs)
- Angular & AngularJS (window.ng, ng-version attribute)
- Svelte (svelte- class prefix, __svelte DOM props)
- Alpine.js (window.Alpine, x-data attributes)
- Astro (data-astro-cid attributes)
- Ember (window.Ember)
- jQuery (window.jQuery)
- Bootstrap (window.bootstrap, bootstrap CSS classes)
- Lodash (window._, _.VERSION)
- Moment.js (window.moment)
- GSAP (window.gsap, window.TweenMax)
- Three.js (window.THREE)
- Tailwind CSS (Tailwind config script, data-tw attributes)
- HTMX (window.htmx, hx- attributes)

**Analytics & Tracking Detection**
- Google Analytics (UA legacy, GA4 gtag)
- Google Tag Manager
- Facebook Pixel
- Hotjar
- Microsoft Clarity
- LinkedIn Insight Tag
- Amplitude
- Mixpanel
- Segment
- Intercom
- Heap
- TikTok Pixel
- Twitter / X Pixel
- Optimizely
- VWO (Visual Website Optimizer)
- Crisp Chat
- Sentry

**Infrastructure Detection**
- Cloud Providers: AWS, Azure, GCP, DigitalOcean, Vercel, Netlify, Cloudflare Pages, Heroku, Render
- CDN: Cloudflare, Amazon CloudFront, Akamai, Fastly, BunnyCDN, KeyCDN, MaxCDN/StackPath, jsDelivr, unpkg

**Security Analysis**
- HTTPS detection
- 7-header security audit: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP
- Score 0–100 with letter grade A+ to F
- Per-header pass/fail detail with remediation advice

**Performance Analysis**
- Script, CSS, image, font, third-party resource counting
- Score 0–100 with letter grade A to F
- Emoji-tagged recommendations

**UI**
- 420px popup with 6-tab layout: Overview, Technologies, Analytics, Infrastructure, Security, Performance
- 4 score cards: Technology, Security, Performance, Privacy
- Dark mode (default) with one-click light mode toggle
- Theme preference saved in localStorage

**Export**
- Export as JSON (structured, full detail)
- Export as TXT (human-readable report)
- Local Blob download — no server involved

**Icons & Assets**
- Pure Python 3 icon generator (stdlib only): icon16.png, icon48.png, icon128.png

**Documentation**
- Full README with detection pipeline diagram and scoring breakdown
- Privacy Policy
- Contributing Guide
- Code of Conduct
- MIT License
- GitHub Pages landing page (docs/index.html)
- Chrome Web Store listing content

---

## [Unreleased]

### Planned
- SolidJS, Qwik, Remix, SvelteKit detection
- Backend detection improvements (Laravel, Django, Rails, Spring)
- Accessibility audit tab
- Craft CMS, Sanity, Contentful detection
- More analytics tools (Pendo, FullStory, LogRocket)
- i18n / localisation support
