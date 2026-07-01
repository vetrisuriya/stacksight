/**
 * content.js – StackSight Content Script
 *
 * This script is injected into the page's ISOLATED world.
 * It collects DOM-level signals and returns them to the popup
 * via chrome.runtime.sendMessage.
 *
 * Note: popup.js primarily uses chrome.scripting.executeScript
 * with inline functions for data collection. This file serves as:
 *   1. An alternative data collector that can be injected as a file
 *   2. A message-based fallback channel
 *   3. Documentation of the DOM data schema
 */

'use strict';

(function stackSightContentInit() {
  // Prevent duplicate injection
  if (window.__STACKSIGHT_INJECTED__) return;
  window.__STACKSIGHT_INJECTED__ = true;

  /* ── Listen for data requests from popup ── */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'COLLECT_DOM_DATA') {
      try {
        const data = collectDOMData();
        sendResponse({ success: true, data });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
      return false; // synchronous response
    }
  });

  /**
   * Collect all DOM-visible signals that can be used for technology detection.
   * Returns a structured object the detectors can consume.
   */
  function collectDOMData() {
    return {
      /* Script elements */
      scripts: Array.from(document.scripts).map(s => ({
        src:  s.src  || '',
        text: s.innerHTML ? s.innerHTML.slice(0, 600) : '',
        type: s.type || '',
        id:   s.id   || '',
      })),

      /* Linked resources */
      links: Array.from(document.querySelectorAll('link')).map(l => ({
        href: l.href || '',
        rel:  l.rel  || '',
        id:   l.id   || '',
      })),

      /* Meta tags */
      metas: Array.from(document.querySelectorAll('meta')).map(m => ({
        name:      m.name      || '',
        content:   m.content   || '',
        property:  m.getAttribute('property') || '',
        httpEquiv: m.httpEquiv || '',
      })),

      /* Images */
      images: Array.from(document.images).map(i => i.src || '').slice(0, 100),

      /* Cookie names (values omitted for privacy) */
      cookieNames: document.cookie
        ? document.cookie.split(';').map(c => c.split('=')[0].trim())
        : [],

      /* Key DOM attribute signals */
      hasDataReactRoot: !!document.querySelector('[data-reactroot]'),
      hasDataReactId:   !!document.querySelector('[data-reactid]'),
      hasNgApp:         !!document.querySelector('[ng-app],[data-ng-app]'),
      ngVersion:        document.querySelector('[ng-version]')
                          ?.getAttribute('ng-version') ?? null,
      hasXData:         !!document.querySelector('[x-data]'),
      hasSvelteClass:   !!document.querySelector('[class*="svelte-"]'),
      hasNextData:      !!document.getElementById('__NEXT_DATA__'),
      hasNuxtData:      !!document.getElementById('__NUXT__'),

      /* WordPress signals */
      hasWpContent:  document.documentElement.innerHTML.includes('wp-content'),
      hasWpIncludes: document.documentElement.innerHTML.includes('wp-includes'),

      /* Body metadata */
      bodyClasses: document.body ? document.body.className : '',
      title:       document.title || '',

      /* Resource counts */
      scriptCount: document.scripts.length,
      imageCount:  document.images.length,
      linkCount:   document.querySelectorAll('link[rel="stylesheet"]').length,
      iframeCount: document.querySelectorAll('iframe').length,

      /* Performance resource timing */
      perfResources: collectPerfResources(),
    };
  }

  function collectPerfResources() {
    try {
      return window.performance.getEntriesByType('resource')
        .slice(0, 250)
        .map(r => ({
          name:          r.name,
          initiatorType: r.initiatorType,
          duration:      Math.round(r.duration),
          transferSize:  r.transferSize || 0,
        }));
    } catch (_) {
      return [];
    }
  }
})();
