/**
 * popup.js – StackSight main popup controller
 *
 * Orchestrates:
 *  1. Page data collection (DOM + window variables)
 *  2. Header fetching via background service worker
 *  3. Running all detector services
 *  4. Rendering the full UI
 *  5. Theme toggle, tab switching, and exports
 */

'use strict';

/* ── State ──────────────────────────────────────────────── */
let currentResults = null;
let currentTab     = null;

/* ── Entry Point ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  setupTheme();
  setupRefresh();
  await runAnalysis();
});

/* ── Analysis Pipeline ──────────────────────────────────── */
async function runAnalysis() {
  showLoading();
  disableExports();
  currentResults = null;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;

    if (!tab || !tab.url) {
      showError('No active tab found.', 'Please open a webpage and try again.');
      return;
    }

    const url = tab.url;

    // Block browser-internal pages
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') ||
        url.startsWith('edge://') || url.startsWith('about:') || url === '') {
      showError(
        'Cannot analyze this page',
        'StackSight cannot scan browser-internal pages such as the New Tab, Settings, or extension pages.'
      );
      return;
    }

    // 1. Collect DOM-level data (ISOLATED world – can access document but not page's window vars)
    let domData = {};
    try {
      const [domResult] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world:  'ISOLATED',
        func:   collectIsolatedData,
      });
      domData = domResult?.result ?? {};
    } catch (e) {
      console.warn('DOM data collection failed:', e.message);
    }

    // 2. Collect window-level data (MAIN world – accesses page's JS globals)
    let winData = {};
    try {
      const [winResult] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world:  'MAIN',
        func:   collectMainWorldData,
      });
      winData = winResult?.result ?? {};
    } catch (e) {
      console.warn('Window data collection failed:', e.message);
    }

    // 3. Fetch response headers via background service worker
    let headers = {};
    try {
      const headerResponse = await chrome.runtime.sendMessage({
        type: 'FETCH_HEADERS',
        url,
      });
      if (headerResponse?.success) headers = headerResponse.headers ?? {};
    } catch (e) {
      console.warn('Header fetch failed:', e.message);
    }

    // 4. Bundle page data
    const pageData = { dom: domData, win: winData, headers, url, tab };

    // 5. Run all detectors
    const results = analyzeAll(pageData);
    currentResults = results;

    // 6. Render
    renderAll(results, tab, url);
    enableExports();

  } catch (err) {
    console.error('StackSight analysis error:', err);
    showError('Analysis failed', err.message ?? 'An unexpected error occurred. Please try refreshing.');
  }
}

/* ── Data Collection Functions (run inside the page) ─────
   These are serialized and sent to the tab – they must be
   completely self-contained (no outer scope references).   */

function collectIsolatedData() {
  try {
    /* Scripts */
    const scripts = Array.from(document.scripts).map(s => ({
      src:  s.src  || '',
      text: s.innerHTML ? s.innerHTML.slice(0, 600) : '',
      type: s.type || '',
      id:   s.id   || '',
    }));

    /* Stylesheets */
    const links = Array.from(document.querySelectorAll('link'))
      .map(l => ({ href: l.href || '', rel: l.rel || '', id: l.id || '' }));

    /* Meta tags */
    const metas = Array.from(document.querySelectorAll('meta'))
      .map(m => ({
        name:       m.name       || '',
        content:    m.content    || '',
        property:   m.getAttribute('property') || '',
        httpEquiv:  m.httpEquiv  || '',
      }));

    /* Images */
    const images = Array.from(document.images).map(i => i.src || '').slice(0, 100);

    /* Cookies (names only) */
    const cookieNames = document.cookie
      ? document.cookie.split(';').map(c => c.split('=')[0].trim())
      : [];

    /* DOM attribute signals */
    const hasDataReactRoot   = !!document.querySelector('[data-reactroot]');
    const hasDataReactId     = !!document.querySelector('[data-reactid]');
    const hasNgApp           = !!document.querySelector('[ng-app],[data-ng-app]');
    const ngVersion          = document.querySelector('[ng-version]')
                                ?.getAttribute('ng-version') || null;
    const hasXData           = !!document.querySelector('[x-data]');
    const hasSvelteClass     = !!document.querySelector('[class*="svelte-"]');
    const hasNextData        = !!document.getElementById('__NEXT_DATA__');
    const hasNuxtData        = !!document.getElementById('__NUXT__');
    const hasVDataAttr       = !!document.querySelector('[data-v]') ||
                               document.querySelectorAll('[class]').length > 0 &&
                               Array.from(document.querySelectorAll('[class]'))
                                    .some(el => /\bsvelte-/.test(el.className));

    /* WP-specific */
    const hasWpContent       = document.documentElement.innerHTML.includes('wp-content');
    const hasWpIncludes      = document.documentElement.innerHTML.includes('wp-includes');

    /* Body class */
    const bodyClasses        = document.body ? document.body.className : '';

    /* Performance entries */
    let perfResources = [];
    try {
      perfResources = window.performance.getEntriesByType('resource')
        .slice(0, 250)
        .map(r => ({
          name:          r.name,
          initiatorType: r.initiatorType,
          duration:      Math.round(r.duration),
          transferSize:  r.transferSize || 0,
        }));
    } catch (_) { /* performance API unavailable */ }

    return {
      scripts,
      links,
      metas,
      images,
      cookieNames,
      hasDataReactRoot,
      hasDataReactId,
      hasNgApp,
      ngVersion,
      hasXData,
      hasSvelteClass,
      hasNextData,
      hasNuxtData,
      hasWpContent,
      hasWpIncludes,
      bodyClasses,
      perfResources,
      scriptCount:     scripts.length,
      imageCount:      document.images.length,
      linkCount:       document.querySelectorAll('link[rel="stylesheet"]').length,
      iframeCount:     document.querySelectorAll('iframe').length,
      title:           document.title || '',
    };
  } catch (e) {
    return { error: e.message };
  }
}

function collectMainWorldData() {
  /** Helper: safely read a property chain */
  function safe(fn) { try { return fn(); } catch (_) { return null; } }

  return {
    /* CMS */
    hasWp:        safe(() => typeof window.wp !== 'undefined'),
    hasShopify:   safe(() => typeof window.Shopify !== 'undefined'),
    shopifyShop:  safe(() => window.Shopify?.shop ?? null),
    hasDrupal:    safe(() => typeof window.Drupal !== 'undefined'),
    hasMagento:   safe(() => typeof window.Magento !== 'undefined'),
    hasWix:       safe(() => typeof window.wixBiSession !== 'undefined' || typeof window.wixMasterPageProperties !== 'undefined'),
    hasSquare:    safe(() => typeof window.Static !== 'undefined' && typeof window.SQUARESPACE_ROLLUPS !== 'undefined'),

    /* React family */
    hasReact:     safe(() => typeof window.React !== 'undefined'),
    reactVersion: safe(() => window.React?.version ?? null),
    hasReactHook: safe(() => typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined'),
    hasNextJs:    safe(() => typeof window.__NEXT_DATA__ !== 'undefined'),
    nextVersion:  safe(() => window.__NEXT_DATA__?.buildId ? 'detected' : null),

    /* Vue family */
    hasVue2:      safe(() => typeof window.Vue !== 'undefined'),
    vue2Version:  safe(() => window.Vue?.version ?? null),
    hasVue3:      safe(() => typeof window.__VUE__ !== 'undefined' || typeof window.__vue_app__ !== 'undefined'),
    hasNuxt:      safe(() => typeof window.__NUXT__ !== 'undefined'),

    /* Angular */
    hasAngular:   safe(() => typeof window.ng !== 'undefined' || typeof window.angular !== 'undefined'),
    ngVersion:    safe(() => window.ng?.VERSION?.full ?? (window.angular?.version?.full ?? null)),
    isAngularJs:  safe(() => typeof window.angular !== 'undefined' && typeof window.ng === 'undefined'),

    /* Other frameworks */
    hasAlpine:    safe(() => typeof window.Alpine !== 'undefined'),
    alpineVersion:safe(() => window.Alpine?.version ?? null),
    hasSvelte:    safe(() => typeof window.__svelte !== 'undefined'),
    hasEmber:     safe(() => typeof window.Ember !== 'undefined'),
    emberVersion: safe(() => window.Ember?.VERSION ?? null),

    /* Libraries */
    hasJQuery:    safe(() => typeof window.jQuery !== 'undefined' || (typeof window.$ !== 'undefined' && typeof window.$?.fn?.jquery !== 'undefined')),
    jqVersion:    safe(() => window.jQuery?.fn?.jquery ?? window.$?.fn?.jquery ?? null),
    hasLodash:    safe(() => typeof window._ !== 'undefined' && typeof window._?.VERSION !== 'undefined'),
    lodashVersion:safe(() => window._?.VERSION ?? null),
    hasMoment:    safe(() => typeof window.moment !== 'undefined' && typeof window.moment?.version !== 'undefined'),
    momentVersion:safe(() => window.moment?.version ?? null),
    hasBootstrap: safe(() => typeof window.bootstrap !== 'undefined'),
    bsVersion:    safe(() => window.bootstrap?.Tooltip?.VERSION ?? null),
    hasTailwind:  safe(() => typeof window.tailwind !== 'undefined'),
    hasGSAP:      safe(() => typeof window.gsap !== 'undefined'),
    gsapVersion:  safe(() => window.gsap?.version ?? null),
    hasThree:     safe(() => typeof window.THREE !== 'undefined'),

    /* Analytics */
    hasGA:         safe(() => typeof window.ga !== 'undefined'),
    hasGtag:       safe(() => typeof window.gtag !== 'undefined'),
    hasGTM:        safe(() => typeof window.google_tag_manager !== 'undefined'),
    gtmIds:        safe(() => typeof window.google_tag_manager !== 'undefined' ? Object.keys(window.google_tag_manager) : []),
    hasFBQ:        safe(() => typeof window.fbq !== 'undefined'),
    hasHotjar:     safe(() => typeof window.hj !== 'undefined'),
    hasClarity:    safe(() => typeof window.clarity !== 'undefined'),
    hasLinkedIn:   safe(() => typeof window._linkedin_partner_id !== 'undefined'),
    hasAmplitude:  safe(() => typeof window.amplitude !== 'undefined'),
    hasMixpanel:   safe(() => typeof window.mixpanel !== 'undefined'),
    hasSegment:    safe(() => typeof window.analytics !== 'undefined' && typeof window.analytics?.track !== 'undefined'),
    hasIntercom:   safe(() => typeof window.Intercom !== 'undefined'),
    hasHeap:       safe(() => typeof window.heap !== 'undefined'),

    /* Error tracking */
    hasSentry:     safe(() => typeof window.Sentry !== 'undefined'),
    hasDatadog:    safe(() => typeof window.DD_RUM !== 'undefined'),
    hasLogRocket:  safe(() => typeof window.LogRocket !== 'undefined'),

    /* Backend hints */
    hasRailsCSRF:  safe(() => !!document.querySelector('meta[name="csrf-token"]')),
    hasDjangoCSRF: safe(() => typeof window.django !== 'undefined'),

    /* A/B Testing */
    hasOptimizely: safe(() => typeof window.optimizely !== 'undefined'),
    hasVWO:        safe(() => typeof window.VWO !== 'undefined' || typeof window._vwo_code !== 'undefined'),
  };
}

/* ── Analyze All ────────────────────────────────────────── */
function analyzeAll(pageData) {
  // CMSDetector and CloudDetector already return arrays (possibly empty).
  // CDNDetector returns a single object or null — wrap it into an array for uniform rendering.
  const cms        = CMSDetector.detect(pageData);       // -> Array
  const frameworks = FrameworkDetector.detect(pageData); // -> Array
  const analytics  = AnalyticsDetector.detect(pageData); // -> { list: Array }
  const cloud      = CloudDetector.detect(pageData);     // -> Array

  const _cdn = CDNDetector.detect(pageData);             // -> Object | null
  const cdn  = _cdn ? [_cdn] : [];                       // -> Array
  const security    = SecurityDetector.detect(pageData);
  const performance = PerformanceDetector.detect(pageData);

  /* Backend from security detector's header data */
  const backend     = detectBackend(pageData);

  /* Compute aggregate scores */
  const securityScore    = security.score;
  const performanceScore = performance.score;
  const privacyScore     = Math.max(0, 100 - analytics.list.length * 12);
  const techScore        = calcTechScore(cms, frameworks, backend);

  return { cms, frameworks, analytics, cdn, cloud, security, performance, backend,
           scores: { tech: techScore, security: securityScore, performance: performanceScore, privacy: privacyScore } };
}

function detectBackend(pageData) {
  const { dom, win, headers, url } = pageData;
  const detected = [];

  const server    = (headers['server']          || '').toLowerCase();
  const powered   = (headers['x-powered-by']   || '').toLowerCase();
  const generator = (headers['x-generator']    || '').toLowerCase();

  /* PHP */
  const phpSignals = [];
  if (powered.includes('php'))                phpSignals.push(60);
  if (dom.cookieNames?.includes('PHPSESSID')) phpSignals.push(50);
  if (dom.scripts?.some(s => s.src.endsWith('.php') || s.src.includes('.php?'))) phpSignals.push(30);
  if (generator.includes('wordpress') || generator.includes('drupal') || generator.includes('joomla')) phpSignals.push(20);
  if (phpSignals.length) detected.push({ name: 'PHP', icon: '🐘', confidence: Math.min(95, phpSignals.reduce((a,b)=>a+b,0)), desc: 'Server-side scripting language' });

  /* Node.js */
  const nodeSignals = [];
  if (server.includes('node') || powered.includes('express') || powered.includes('nodejs')) nodeSignals.push(70);
  if (server.includes('express'))             nodeSignals.push(20);
  if (headers['x-nextjs-page'])               nodeSignals.push(30);
  if (win.hasNextJs)                          nodeSignals.push(20);
  if (nodeSignals.length) detected.push({ name: 'Node.js', icon: '🟢', confidence: Math.min(90, nodeSignals.reduce((a,b)=>a+b,0)), desc: 'JavaScript runtime environment' });

  /* ASP.NET */
  const aspSignals = [];
  if (powered.includes('asp.net'))                         aspSignals.push(80);
  if (server.includes('microsoft-iis'))                    aspSignals.push(40);
  if (dom.cookieNames?.includes('ASP.NET_SessionId'))      aspSignals.push(50);
  if (dom.scripts?.some(s => s.src.includes('WebResource.axd') || s.src.includes('ScriptResource.axd'))) aspSignals.push(30);
  if (dom.scripts?.some(s => s.src.includes('__doPostBack'))) aspSignals.push(20);
  if (aspSignals.length) detected.push({ name: 'ASP.NET', icon: '🪟', confidence: Math.min(95, aspSignals.reduce((a,b)=>a+b,0)), desc: 'Microsoft web framework' });

  /* Python / Django / Flask */
  const pySignals = [];
  if (dom.cookieNames?.includes('csrftoken'))   pySignals.push(50);
  if (dom.cookieNames?.includes('sessionid'))   pySignals.push(20);
  if (win.hasRailsCSRF && dom.cookieNames?.includes('csrftoken')) pySignals.push(10);
  if (server.includes('gunicorn') || server.includes('uvicorn') || server.includes('django') || server.includes('flask')) pySignals.push(70);
  if (powered.includes('python') || powered.includes('django') || powered.includes('flask')) pySignals.push(60);
  if (pySignals.length) detected.push({ name: 'Python', icon: '🐍', confidence: Math.min(90, pySignals.reduce((a,b)=>a+b,0)), desc: 'Django / Flask web framework' });

  /* Ruby on Rails */
  const rubySignals = [];
  if (dom.cookieNames?.includes('_rails_session') || dom.cookieNames?.some(c => c.endsWith('_session'))) rubySignals.push(60);
  if (server.includes('passenger') || server.includes('unicorn') || server.includes('puma')) rubySignals.push(50);
  if (powered.includes('phusion passenger'))  rubySignals.push(40);
  if (win.hasRailsCSRF)                       rubySignals.push(25);
  if (rubySignals.length) detected.push({ name: 'Ruby on Rails', icon: '💎', confidence: Math.min(90, rubySignals.reduce((a,b)=>a+b,0)), desc: 'Ruby web framework' });

  /* Java */
  const javaSignals = [];
  if (server.includes('tomcat') || server.includes('jetty') || server.includes('jboss') || server.includes('weblogic') || server.includes('websphere')) javaSignals.push(75);
  if (powered.includes('java') || powered.includes('jsp')) javaSignals.push(60);
  if (dom.cookieNames?.includes('JSESSIONID'))     javaSignals.push(60);
  if (dom.scripts?.some(s => s.src.includes('.do') || s.src.includes('.jsp'))) javaSignals.push(20);
  if (javaSignals.length) detected.push({ name: 'Java', icon: '☕', confidence: Math.min(92, javaSignals.reduce((a,b)=>a+b,0)), desc: 'Servlet / Spring / JEE backend' });

  /* Go */
  if (server.includes('caddy') || powered.includes('go ') || server.includes('golang')) {
    detected.push({ name: 'Go', icon: '🔵', confidence: 70, desc: 'Go web server detected' });
  }

  return detected;
}

function calcTechScore(cms, frameworks, backend) {
  let score = 50; // baseline
  if (cms.length)        score += 15;
  if (frameworks.length) score += 20;
  if (backend.length)    score += 15;
  return Math.min(99, score);
}

/* ── Render ─────────────────────────────────────────────── */
function renderAll(results, tab, url) {
  // Site info
  document.getElementById('siteUrl').textContent   = url.replace(/^https?:\/\//, '').slice(0, 55);
  document.getElementById('siteTitle').textContent = tab.title ?? 'Unknown page';

  // Scores
  renderScore('tech',        results.scores.tech);
  renderScore('security',    results.scores.security);
  renderScore('performance', results.scores.performance);
  renderScore('privacy',     results.scores.privacy);

  // Overview
  hideLoading();
  renderOverview(results);

  // Technologies tab
  renderTechList('tech-cms',       results.cms,        'No CMS detected');
  renderTechList('tech-frameworks', results.frameworks, 'No frontend framework detected');
  renderLibraries(results);
  renderTechList('tech-backend',   results.backend,    'Backend not identified');

  // Analytics tab
  renderAnalytics(results.analytics);

  // Infrastructure tab
  renderTechList('infra-cdn',   results.cdn,   'No CDN detected');
  renderTechList('infra-cloud', results.cloud, 'No cloud provider detected');
  renderSSL(results.security);

  // Security tab
  renderSecurityTab(results.security);

  // Performance tab
  renderPerformanceTab(results.performance);
}

function renderScore(id, value) {
  const el = document.getElementById(`score-${id}`);
  el.textContent = Math.round(value);
  el.className   = 'score-value ' + scoreClass(value);
  document.getElementById(`card-${id}`).dataset.score = value;
}

function scoreClass(v) {
  if (v >= 80) return 'high';
  if (v >= 60) return 'medium';
  if (v >= 40) return 'low';
  return 'poor';
}

function colorFromScore(v) {
  if (v >= 80) return 'var(--success)';
  if (v >= 60) return 'var(--warning)';
  if (v >= 40) return 'var(--orange)';
  return 'var(--danger)';
}

function confClass(c) {
  if (c >= 80) return 'high';
  if (c >= 60) return 'medium';
  if (c >= 40) return 'low';
  return 'poor';
}

/* ── Overview ── */
function renderOverview(results) {
  document.getElementById('overview-content').classList.remove('hidden');

  // All detected techs as chips
  const allTechs = [
    ...results.cms, ...results.frameworks,
    ...results.analytics.list.map(a => ({ name: a.name, icon: a.icon, confidence: a.confidence })),
    ...results.cdn, ...results.cloud, ...results.backend
  ];

  const grid = document.getElementById('overview-stack');
  if (allTechs.length === 0) {
    grid.innerHTML = '<span class="none-msg">No specific technologies detected</span>';
  } else {
    grid.innerHTML = allTechs.map(t => `
      <span class="tech-chip">
        <span class="chip-icon">${t.icon || '🔧'}</span>
        ${escHtml(t.name)}
        <span class="chip-conf">${t.confidence}%</span>
      </span>`).join('');
  }

  // Summary rows
  const summary = document.getElementById('overview-summary');
  summary.innerHTML = makeSummaryRow('CMS',           results.cms.map(c=>c.name).join(', ')       || 'None detected', results.cms.length ? 'accent' : '') +
    makeSummaryRow('Framework',     results.frameworks.map(f=>f.name).join(', ')   || 'None detected', results.frameworks.length ? 'accent' : '') +
    makeSummaryRow('Analytics',     results.analytics.list.length + ' tracker(s)',                 results.analytics.list.length > 3 ? 'danger' : 'success') +
    makeSummaryRow('CDN',           results.cdn.map(c=>c.name).join(', ')          || 'None detected', '') +
    makeSummaryRow('Cloud',         results.cloud.map(c=>c.name).join(', ')        || 'None detected', '') +
    makeSummaryRow('HTTPS',         results.security.https ? 'Enabled ✓' : 'Not enabled ✗',      results.security.https ? 'success' : 'danger') +
    makeSummaryRow('Security Score',results.scores.security + ' / 100',                           scoreClass(results.scores.security));
}

function makeSummaryRow(key, val, valClass) {
  return `<div class="summary-row">
    <span class="summary-key">${escHtml(key)}</span>
    <span class="summary-val ${valClass}">${escHtml(String(val))}</span>
  </div>`;
}

/* ── Tech List ── */
function renderTechList(containerId, techs, emptyMsg) {
  const el = document.getElementById(containerId);
  if (!techs || techs.length === 0) {
    el.innerHTML = `<p class="none-msg">${emptyMsg}</p>`;
    return;
  }
  el.innerHTML = techs.map(t => makeTechItem(t)).join('');
}

function makeTechItem(t) {
  const cc = confClass(t.confidence);
  const version = t.version ? `<div class="tech-version">v${escHtml(t.version)}</div>` : '';
  return `<div class="tech-item">
    <div class="tech-icon">${t.icon || '🔧'}</div>
    <div class="tech-info">
      <div class="tech-name">${escHtml(t.name)}</div>
      <div class="tech-desc">${escHtml(t.desc || t.description || '')}</div>
      ${version}
    </div>
    <div class="confidence-bar">
      <span class="conf-label">${t.confidence}%</span>
      <div class="conf-track"><div class="conf-fill ${cc}" style="width:${t.confidence}%"></div></div>
    </div>
  </div>`;
}

function renderLibraries(results) {
  // Libraries come from framework detector
  const libs = results.frameworks.filter(f =>
    ['jQuery','Lodash','Moment.js','Bootstrap','GSAP','Three.js','Underscore'].includes(f.name));
  const libEl = document.getElementById('tech-libraries');
  if (!libs.length) { libEl.innerHTML = '<p class="none-msg">No JS libraries detected</p>'; return; }
  libEl.innerHTML = libs.map(makeTechItem).join('');
}

/* ── Analytics ── */
function renderAnalytics(analytics) {
  const list  = document.getElementById('analytics-list');
  const empty = document.getElementById('analytics-empty');

  if (!analytics.list || analytics.list.length === 0) {
    list.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }

  list.classList.remove('hidden');
  empty.classList.add('hidden');
  list.innerHTML = analytics.list.map(makeTechItem).join('');
}

/* ── SSL ── */
function renderSSL(security) {
  const el = document.getElementById('infra-ssl');
  const cl = security.https ? 'secure' : 'insecure';
  el.innerHTML = `
    <div class="ssl-row"><span class="ssl-key">Protocol</span><span class="ssl-val ${cl}">${security.https ? 'HTTPS ✓' : 'HTTP (insecure)'}</span></div>
    <div class="ssl-row"><span class="ssl-key">Certificate</span><span class="ssl-val ${cl}">${security.https ? 'Present' : 'Not applicable'}</span></div>
    <div class="ssl-row"><span class="ssl-key">HSTS Header</span><span class="ssl-val ${security.headers['strict-transport-security'] ? 'secure' : 'insecure'}">${security.headers['strict-transport-security'] ? 'Enabled' : 'Not set'}</span></div>
    <div class="ssl-row"><span class="ssl-key">Secure Origin</span><span class="ssl-val ${cl}">${security.https ? 'Yes' : 'No'}</span></div>`;
}

/* ── Security Tab ── */
function renderSecurityTab(security) {
  const score = security.score;

  // Score bar
  document.getElementById('security-score-bar').innerHTML = makeScoreBar('Security Score', score);

  // Headers
  const headerChecks = [
    { key: 'content-security-policy',      label: 'Content-Security-Policy',   deduction: 20 },
    { key: 'strict-transport-security',    label: 'Strict-Transport-Security', deduction: 15 },
    { key: 'x-frame-options',              label: 'X-Frame-Options',           deduction: 10 },
    { key: 'x-content-type-options',       label: 'X-Content-Type-Options',    deduction: 10 },
    { key: 'referrer-policy',              label: 'Referrer-Policy',           deduction: 10 },
    { key: 'permissions-policy',           label: 'Permissions-Policy',        deduction: 8  },
    { key: 'cross-origin-opener-policy',   label: 'Cross-Origin-Opener-Policy',deduction: 7  },
    { key: 'cross-origin-resource-policy', label: 'Cross-Origin-Resource-Policy',deduction:5 },
  ];

  const headerList = document.getElementById('security-headers');
  headerList.innerHTML = headerChecks.map(h => {
    const present = !!(security.headers[h.key]);
    return `<div class="header-item">
      <span class="header-name">${h.label}</span>
      <span class="header-badge ${present ? 'present' : 'missing'}">${present ? '✓ Present' : '✗ Missing'}</span>
    </div>`;
  }).join('');

  // Recommendations
  const recs = document.getElementById('security-recs');
  const recItems = [];
  if (!security.https) recItems.push({ type: 'warn', icon: '⚠️', text: 'Enable HTTPS to protect user data in transit.' });
  headerChecks.forEach(h => {
    if (!security.headers[h.key]) recItems.push({ type: 'warn', icon: '🔴', text: `Add the ${h.label} header to improve security.` });
  });
  if (score >= 80) recItems.push({ type: 'good', icon: '✅', text: 'Good security posture! Keep headers updated.' });
  recs.innerHTML = recItems.length ? recItems.map(r => `
    <div class="rec-item ${r.type}"><span class="rec-icon">${r.icon}</span>${escHtml(r.text)}</div>`).join('')
    : '<p class="none-msg">No issues found.</p>';
}

/* ── Performance Tab ── */
function renderPerformanceTab(perf) {
  const score = perf.score;

  document.getElementById('perf-score-bar').innerHTML = makeScoreBar('Performance Score', score);

  // Resources
  const resGrid = document.getElementById('perf-resources');
  resGrid.innerHTML = [
    { icon: '⚡', count: perf.scriptCount,   name: 'Scripts',    warn: 20, bad: 35 },
    { icon: '🎨', count: perf.cssCount,      name: 'Stylesheets',warn: 8,  bad: 15 },
    { icon: '🖼️', count: perf.imageCount,    name: 'Images',     warn: 40, bad: 80 },
    { icon: '🔤', count: perf.fontCount,     name: 'Fonts',      warn: 4,  bad: 8  },
    { icon: '📦', count: perf.thirdPartyCount, name: '3rd-Party', warn: 8, bad: 15 },
    { icon: '📄', count: perf.totalResources,'name': 'Total Res', warn: 60, bad: 100 },
  ].map(r => {
    const cls = r.count >= r.bad ? 'bad' : r.count >= r.warn ? 'warn' : '';
    return `<div class="resource-card">
      <span class="resource-icon">${r.icon}</span>
      <div class="resource-info">
        <div class="resource-count ${cls}">${r.count}</div>
        <div class="resource-name">${r.name}</div>
      </div>
    </div>`;
  }).join('');

  // Recommendations
  const recsEl = document.getElementById('perf-recs');
  recsEl.innerHTML = perf.recommendations.length
    ? perf.recommendations.map(r => `<div class="rec-item ${r.type}"><span class="rec-icon">${r.icon}</span>${escHtml(r.text)}</div>`).join('')
    : '<p class="none-msg">Performance looks good!</p>';
}

function makeScoreBar(label, score) {
  const color = colorFromScore(score);
  return `<div class="score-bar-wrap">
    <span class="score-bar-label">${label}</span>
    <div class="score-bar-track">
      <div class="score-bar-fill" style="width:${score}%;background:${color}"></div>
    </div>
    <span class="score-bar-num" style="color:${color}">${Math.round(score)}</span>
  </div>`;
}

/* ── Loading / Error helpers ─────────────────────────────── */
function showLoading() {
  document.getElementById('overview-loading').classList.remove('hidden');
  document.getElementById('overview-content').classList.add('hidden');
  document.getElementById('overview-error').classList.add('hidden');
  document.getElementById('siteUrl').textContent   = 'Analyzing…';
  document.getElementById('siteTitle').textContent = 'Please wait';
}

function hideLoading() {
  document.getElementById('overview-loading').classList.add('hidden');
  document.getElementById('overview-error').classList.add('hidden');
}

function showError(title, msg) {
  document.getElementById('overview-loading').classList.add('hidden');
  document.getElementById('overview-content').classList.add('hidden');
  const errEl = document.getElementById('overview-error');
  errEl.classList.remove('hidden');
  errEl.innerHTML = `
    <div class="error-icon">🚫</div>
    <div class="error-title">${escHtml(title)}</div>
    <div class="error-msg">${escHtml(msg)}</div>`;
  document.getElementById('siteUrl').textContent   = 'Error';
  document.getElementById('siteTitle').textContent = 'Analysis failed';
}

/* ── Tabs ────────────────────────────────────────────────── */
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
    });
  });
}

/* ── Theme ───────────────────────────────────────────────── */
function setupTheme() {
  const body   = document.body;
  const btn    = document.getElementById('themeToggle');
  const moon   = document.getElementById('iconMoon');
  const sun    = document.getElementById('iconSun');
  const stored = localStorage.getItem('ss-theme') || 'dark';

  const apply = (theme) => {
    body.dataset.theme = theme;
    localStorage.setItem('ss-theme', theme);
    const isDark = theme === 'dark';
    moon.style.display = isDark ? 'block' : 'none';
    sun.style.display  = isDark ? 'none'  : 'block';
  };

  apply(stored);
  btn.addEventListener('click', () => apply(body.dataset.theme === 'dark' ? 'light' : 'dark'));
}

/* ── Refresh ─────────────────────────────────────────────── */
function setupRefresh() {
  document.getElementById('refreshBtn').addEventListener('click', runAnalysis);
}

/* ── Exports ─────────────────────────────────────────────── */
function enableExports() {
  ['exportJson','exportTxt'].forEach(id => {
    const btn = document.getElementById(id);
    btn.disabled = false;
  });

  document.getElementById('exportJson').addEventListener('click', () => {
    if (!currentResults) return;
    ExportService.downloadJSON(currentResults, currentTab);
  });

  document.getElementById('exportTxt').addEventListener('click', () => {
    if (!currentResults) return;
    ExportService.downloadTXT(currentResults, currentTab);
  });
}

function disableExports() {
  ['exportJson','exportTxt'].forEach(id => {
    const btn = document.getElementById(id);
    btn.disabled = true;
    btn.replaceWith(btn.cloneNode(true)); // remove old listeners
  });
}

/* ── Utility ─────────────────────────────────────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
