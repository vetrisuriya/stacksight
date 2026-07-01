/**
 * framework-detector.js – StackSight Frontend Framework & Library Detection
 *
 * Detects:
 *  Frameworks: React, Vue 2/3, Angular, Next.js, Nuxt.js, Svelte, Alpine.js, Ember.js
 *  Libraries:  jQuery, Bootstrap, Lodash, Moment.js, GSAP, Three.js
 *
 * Uses DOM inspection, window variable signals, and script URL patterns.
 */

'use strict';

const FrameworkDetector = {

  /**
   * @param {{dom, win, headers, url}} pageData
   * @returns {Array<{name, icon, confidence, desc, version}>}
   */
  detect({ dom, win, headers, url }) {
    const results = [];
    const add = (item) => { if (item) results.push(item); };

    /* Frameworks */
    add(this._detectReact(dom, win));
    add(this._detectNextJs(dom, win));
    add(this._detectVue(dom, win));
    add(this._detectNuxt(dom, win));
    add(this._detectAngular(dom, win));
    add(this._detectSvelte(dom, win));
    add(this._detectAlpine(dom, win));
    add(this._detectEmber(dom, win));
    add(this._detectAstro(dom, win));

    /* Libraries */
    add(this._detectJQuery(dom, win));
    add(this._detectBootstrap(dom, win));
    add(this._detectLodash(dom, win));
    add(this._detectMoment(dom, win));
    add(this._detectGSAP(dom, win));
    add(this._detectThreeJs(dom, win));
    add(this._detectTailwind(dom, win));
    add(this._detectHTMX(dom, win));

    return results;
  },

  /* ── React ─────────────────────────────────────────────── */
  _detectReact(dom, win) {
    const weights = [];

    if (win.hasReact)                                                                 weights.push(80);
    if (win.hasReactHook)                                                             weights.push(50);
    if (dom.hasDataReactRoot)                                                         weights.push(65);
    if (dom.hasDataReactId)                                                           weights.push(55);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['react.development.js', 'react.production.min.js', 'react.min.js', '/react@', '/react/'])) weights.push(75);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['react-dom']))                  weights.push(40);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['createElement', '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED'])) weights.push(30);

    if (weights.length === 0) return null;

    // Exclude if Next.js already captured React (avoid double-listing)
    // Framework detector shows React separately from Next.js
    return {
      name:       'React',
      icon:       '⚛️',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'UI library by Meta (Facebook)',
      version:    win.reactVersion,
    };
  },

  /* ── Next.js ───────────────────────────────────────────── */
  _detectNextJs(dom, win) {
    const weights = [];

    if (win.hasNextJs)                                                               weights.push(90);
    if (dom.hasNextData)                                                             weights.push(85);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['/_next/static/', '/_next/chunks/'])) weights.push(80);
    if (DetectorUtils.linkMatches(dom.links, ['/_next/static/']))                    weights.push(65);
    if (DetectorUtils.headerContains({}, 'x-nextjs-page'))                          weights.push(70);

    if (weights.length === 0) return null;

    return {
      name:       'Next.js',
      icon:       '▲',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'React-based full-stack framework by Vercel',
    };
  },

  /* ── Vue ───────────────────────────────────────────────── */
  _detectVue(dom, win) {
    const weights = [];

    if (win.hasVue2)                                                                 weights.push(85);
    if (win.hasVue3)                                                                 weights.push(85);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['vue.js', 'vue.min.js', 'vue.runtime', '/vue@', '/vue/'])) weights.push(75);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['vue-router', 'vuex', 'pinia'])) weights.push(35);

    // v-bind, v-if attributes in the DOM (hard to check without full parse, use script signals)
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['createApp', 'defineComponent', '__VUE__'])) weights.push(40);

    if (weights.length === 0) return null;

    const version = win.vue2Version || (win.hasVue3 ? '3.x' : null);

    return {
      name:       'Vue.js',
      icon:       '💚',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Progressive JavaScript framework',
      version,
    };
  },

  /* ── Nuxt.js ───────────────────────────────────────────── */
  _detectNuxt(dom, win) {
    const weights = [];

    if (win.hasNuxt)                                                                 weights.push(90);
    if (dom.hasNuxtData)                                                             weights.push(85);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['/_nuxt/', '/__nuxt/']))        weights.push(80);
    if (DetectorUtils.linkMatches(dom.links, ['/_nuxt/']))                           weights.push(65);

    if (weights.length === 0) return null;

    return {
      name:       'Nuxt.js',
      icon:       '🟩',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Vue.js-based full-stack framework',
    };
  },

  /* ── Angular ───────────────────────────────────────────── */
  _detectAngular(dom, win) {
    const weights = [];

    const isModernNg = win.hasAngular && !win.isAngularJs;
    const isNgJs     = win.isAngularJs;

    if (isModernNg)                                                                  weights.push(85);
    if (isNgJs)                                                                      weights.push(75);
    if (dom.hasNgApp)                                                                weights.push(60);
    if (dom.ngVersion)                                                               weights.push(70);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['@angular/core', 'angular.min.js', '/angular/']))  weights.push(75);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['angular-router', 'angular-material'])) weights.push(30);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['platformBrowserDynamic', 'NgModule', 'Component'])) weights.push(35);

    if (weights.length === 0) return null;

    const name = isNgJs ? 'AngularJS' : 'Angular';
    const version = win.ngVersion || dom.ngVersion;

    return {
      name,
      icon:       '🔴',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       isNgJs ? 'Legacy Angular framework (v1.x)' : 'TypeScript-based framework by Google',
      version,
    };
  },

  /* ── Svelte ────────────────────────────────────────────── */
  _detectSvelte(dom, win) {
    const weights = [];

    if (win.hasSvelte)                                                               weights.push(80);
    if (dom.hasSvelteClass)                                                          weights.push(75);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['/svelte/', 'svelte.min.js'])) weights.push(70);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['svelte/internal', '__svelte'])) weights.push(60);

    if (weights.length === 0) return null;

    return {
      name:       'Svelte',
      icon:       '🧡',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Compile-time JavaScript framework',
    };
  },

  /* ── Alpine.js ─────────────────────────────────────────── */
  _detectAlpine(dom, win) {
    const weights = [];

    if (win.hasAlpine)                                                               weights.push(85);
    if (dom.hasXData)                                                                weights.push(75);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['alpinejs', 'alpine.min.js', 'cdn.jsdelivr.net/gh/alpinejs'])) weights.push(75);

    if (weights.length === 0) return null;

    return {
      name:       'Alpine.js',
      icon:       '🏔️',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Lightweight reactive JS framework',
      version:    win.alpineVersion,
    };
  },

  /* ── Ember.js ──────────────────────────────────────────── */
  _detectEmber(dom, win) {
    const weights = [];

    if (win.hasEmber)                                                                weights.push(85);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['ember.js', 'ember.min.js', '/ember/'])) weights.push(75);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['Ember.Application', 'DS.Model'])) weights.push(55);

    if (weights.length === 0) return null;

    return {
      name:       'Ember.js',
      icon:       '🔥',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Convention-over-configuration JS framework',
      version:    win.emberVersion,
    };
  },

  /* ── Astro ─────────────────────────────────────────────── */
  _detectAstro(dom, win) {
    const weights = [];

    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['/_astro/']))                  weights.push(80);
    if (DetectorUtils.linkMatches(dom.links, ['/_astro/']))                         weights.push(70);
    if (DetectorUtils.getMetaByName(dom.metas, 'generator')?.toLowerCase().includes('astro')) weights.push(80);

    if (weights.length === 0) return null;

    return {
      name:       'Astro',
      icon:       '🚀',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Content-focused static site framework',
    };
  },

  /* ── jQuery ─────────────────────────────────────────────── */
  _detectJQuery(dom, win) {
    const weights = [];

    if (win.hasJQuery)                                                               weights.push(85);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['jquery.min.js', 'jquery.js', '/jquery@', '/jquery/'])) weights.push(80);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['jquery-ui']))                 weights.push(20);

    if (weights.length === 0) return null;

    return {
      name:       'jQuery',
      icon:       '💛',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Ubiquitous DOM manipulation library',
      version:    win.jqVersion,
    };
  },

  /* ── Bootstrap ─────────────────────────────────────────── */
  _detectBootstrap(dom, win) {
    const weights = [];

    if (win.hasBootstrap)                                                            weights.push(80);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['bootstrap.min.js', 'bootstrap.js', '/bootstrap@', '/bootstrap/bundle'])) weights.push(80);
    if (DetectorUtils.linkMatches(dom.links, ['bootstrap.min.css', 'bootstrap.css', '/bootstrap@'])) weights.push(75);

    if (weights.length === 0) return null;

    return {
      name:       'Bootstrap',
      icon:       '🅱️',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Popular CSS component framework',
      version:    win.bsVersion,
    };
  },

  /* ── Lodash ─────────────────────────────────────────────── */
  _detectLodash(dom, win) {
    const weights = [];

    if (win.hasLodash)                                                               weights.push(85);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['lodash.min.js', 'lodash.js', '/lodash@', '/lodash/'])) weights.push(80);

    if (weights.length === 0) return null;

    return {
      name:       'Lodash',
      icon:       '🔗',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Modern JavaScript utility library',
      version:    win.lodashVersion,
    };
  },

  /* ── Moment.js ─────────────────────────────────────────── */
  _detectMoment(dom, win) {
    const weights = [];

    if (win.hasMoment)                                                               weights.push(85);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['moment.min.js', 'moment.js', '/moment@'])) weights.push(80);

    if (weights.length === 0) return null;

    return {
      name:       'Moment.js',
      icon:       '⏰',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Date/time manipulation library (legacy)',
      version:    win.momentVersion,
    };
  },

  /* ── GSAP ───────────────────────────────────────────────── */
  _detectGSAP(dom, win) {
    const weights = [];

    if (win.hasGSAP)                                                                 weights.push(85);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['gsap.min.js', 'gsap.js', '/gsap@', 'TweenMax', 'TweenLite'])) weights.push(80);

    if (weights.length === 0) return null;

    return {
      name:       'GSAP',
      icon:       '✨',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Professional JavaScript animation library',
      version:    win.gsapVersion,
    };
  },

  /* ── Three.js ───────────────────────────────────────────── */
  _detectThreeJs(dom, win) {
    const weights = [];

    if (win.hasThree)                                                                weights.push(85);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['three.min.js', 'three.js', '/three@'])) weights.push(80);

    if (weights.length === 0) return null;

    return {
      name:       'Three.js',
      icon:       '🎮',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'WebGL 3D library',
    };
  },

  /* ── Tailwind CSS ───────────────────────────────────────── */
  _detectTailwind(dom, win) {
    const weights = [];

    if (win.hasTailwind)                                                             weights.push(80);
    if (DetectorUtils.linkMatches(dom.links, ['tailwind.css', 'tailwind.min.css']))  weights.push(75);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['cdn.tailwindcss.com', 'tailwind.js'])) weights.push(75);
    // Check for Tailwind class patterns in body (many utility classes = likely Tailwind)
    if (DetectorUtils.bodyClassContains(dom.bodyClasses, ['flex', 'grid', 'px-', 'py-', 'text-', 'bg-', 'rounded'])) weights.push(25);

    if (weights.length === 0) return null;

    return {
      name:       'Tailwind CSS',
      icon:       '🌊',
      confidence: Math.min(85, DetectorUtils.sumConfidence(weights)),
      desc:       'Utility-first CSS framework',
    };
  },

  /* ── HTMX ───────────────────────────────────────────────── */
  _detectHTMX(dom, win) {
    const weights = [];

    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['htmx.min.js', 'htmx.js', '/htmx@', 'unpkg.com/htmx'])) weights.push(80);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['htmx.config']))              weights.push(60);

    if (weights.length === 0) return null;

    return {
      name:       'HTMX',
      icon:       '⚡',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'HTML-over-the-wire library',
    };
  },
};
