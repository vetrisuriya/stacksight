/**
 * analytics-detector.js – StackSight Analytics & Tracking Detection
 *
 * Detects: Google Analytics (UA + GA4), Google Tag Manager,
 *          Facebook Pixel, Hotjar, Microsoft Clarity, LinkedIn Insight,
 *          Amplitude, Mixpanel, Segment, Intercom, Heap, Optimizely, VWO,
 *          TikTok Pixel, Twitter/X Pixel, Crisp Chat, Drift, Sentry, Datadog
 */

'use strict';

const AnalyticsDetector = {

  /**
   * @param {{dom, win, headers, url}} pageData
   * @returns {{ list: Array<{name, icon, confidence, desc}>, privacyScore: number }}
   */
  detect({ dom, win, headers, url }) {
    const list = [];
    const add  = (item) => { if (item) list.push(item); };

    /* Google Analytics (Universal) */
    add(this._detect_UA(dom, win));
    /* GA4 / gtag.js */
    add(this._detect_GA4(dom, win));
    /* Google Tag Manager */
    add(this._detect_GTM(dom, win));
    /* Meta / Facebook Pixel */
    add(this._detect_FBPixel(dom, win));
    /* Hotjar */
    add(this._detect_Hotjar(dom, win));
    /* Microsoft Clarity */
    add(this._detect_Clarity(dom, win));
    /* LinkedIn Insight */
    add(this._detect_LinkedIn(dom, win));
    /* Amplitude */
    add(this._detect_Amplitude(dom, win));
    /* Mixpanel */
    add(this._detect_Mixpanel(dom, win));
    /* Segment */
    add(this._detect_Segment(dom, win));
    /* Intercom */
    add(this._detect_Intercom(dom, win));
    /* Heap */
    add(this._detect_Heap(dom, win));
    /* TikTok Pixel */
    add(this._detect_TikTok(dom, win));
    /* Twitter / X Pixel */
    add(this._detect_Twitter(dom, win));
    /* Optimizely */
    add(this._detect_Optimizely(dom, win));
    /* VWO (Visual Website Optimizer) */
    add(this._detect_VWO(dom, win));
    /* Crisp Chat */
    add(this._detect_Crisp(dom, win));
    /* Sentry */
    add(this._detect_Sentry(dom, win));

    return { list };
  },

  /* ── Google Analytics (Universal / UA) ─────────────────── */
  _detect_UA(dom, win) {
    const weights = [];

    if (win.hasGA && !win.hasGtag)                                                   weights.push(80);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['google-analytics.com/analytics.js', 'ga.js'])) weights.push(85);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ["ga('create'", "ga('send'", "_gaq.push"])) weights.push(70);

    if (weights.length === 0) return null;

    return {
      name:       'Google Analytics (UA)',
      icon:       '📊',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Universal Analytics (legacy – sunset July 2023)',
    };
  },

  /* ── GA4 ────────────────────────────────────────────────── */
  _detect_GA4(dom, win) {
    const weights = [];

    if (win.hasGtag)                                                                  weights.push(70);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['googletagmanager.com/gtag/js', 'gtag/js?id=G-'])) weights.push(85);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ["gtag('config','G-", "gtag('config', 'G-"])) weights.push(80);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ["gtag('event'", "gtag('set'"]))  weights.push(30);

    if (weights.length === 0) return null;

    return {
      name:       'Google Analytics 4',
      icon:       '📈',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Google\'s current analytics platform',
    };
  },

  /* ── Google Tag Manager ──────────────────────────────────── */
  _detect_GTM(dom, win) {
    const weights = [];

    if (win.hasGTM)                                                                   weights.push(85);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['googletagmanager.com/gtm.js'])) weights.push(90);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ["GTM-", "googletagmanager.com/ns.html"])) weights.push(75);

    if (weights.length === 0) return null;

    const ids = (win.gtmIds || []).filter(id => id.startsWith('GTM-'));

    return {
      name:       'Google Tag Manager',
      icon:       '🏷️',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Tag management system' + (ids.length ? ` (${ids.slice(0,2).join(', ')})` : ''),
    };
  },

  /* ── Facebook / Meta Pixel ──────────────────────────────── */
  _detect_FBPixel(dom, win) {
    const weights = [];

    if (win.hasFBQ)                                                                   weights.push(85);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['connect.facebook.net', 'fbevents.js'])) weights.push(85);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ["fbq('init'", "fbq('track'"]))  weights.push(80);

    if (weights.length === 0) return null;

    return {
      name:       'Meta (Facebook) Pixel',
      icon:       '📘',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Meta advertising & conversion tracking',
    };
  },

  /* ── Hotjar ─────────────────────────────────────────────── */
  _detect_Hotjar(dom, win) {
    const weights = [];

    if (win.hasHotjar)                                                                weights.push(85);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['static.hotjar.com', 'hotjar.com/'])) weights.push(85);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['hotjar', 'hjid', 'hjsv']))     weights.push(70);

    if (weights.length === 0) return null;

    return {
      name:       'Hotjar',
      icon:       '🔥',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Heatmaps, session recordings & surveys',
    };
  },

  /* ── Microsoft Clarity ──────────────────────────────────── */
  _detect_Clarity(dom, win) {
    const weights = [];

    if (win.hasClarity)                                                               weights.push(85);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['clarity.ms', 'clarity.js']))   weights.push(85);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['clarity(', 'clarity.set']))   weights.push(70);

    if (weights.length === 0) return null;

    return {
      name:       'Microsoft Clarity',
      icon:       '🪟',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Free heatmap & session recording tool',
    };
  },

  /* ── LinkedIn Insight ───────────────────────────────────── */
  _detect_LinkedIn(dom, win) {
    const weights = [];

    if (win.hasLinkedIn)                                                              weights.push(85);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['snap.licdn.com', 'linkedin.com/insight'])) weights.push(85);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['_linkedin_partner_id', 'lintrk'])) weights.push(75);

    if (weights.length === 0) return null;

    return {
      name:       'LinkedIn Insight Tag',
      icon:       '💼',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'LinkedIn B2B conversion tracking',
    };
  },

  /* ── Amplitude ──────────────────────────────────────────── */
  _detect_Amplitude(dom, win) {
    const weights = [];

    if (win.hasAmplitude)                                                             weights.push(85);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['amplitude.com/libs', 'amplitude-js'])) weights.push(80);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['amplitude.getInstance', 'amplitude.init'])) weights.push(70);

    if (weights.length === 0) return null;

    return {
      name:       'Amplitude',
      icon:       '🎵',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Product analytics platform',
    };
  },

  /* ── Mixpanel ───────────────────────────────────────────── */
  _detect_Mixpanel(dom, win) {
    const weights = [];

    if (win.hasMixpanel)                                                              weights.push(85);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['cdn.mxpnl.com', 'cdn4.mxpnl.com'])) weights.push(85);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['mixpanel.init', 'mixpanel.track'])) weights.push(75);

    if (weights.length === 0) return null;

    return {
      name:       'Mixpanel',
      icon:       '🎯',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Event-based product analytics',
    };
  },

  /* ── Segment ────────────────────────────────────────────── */
  _detect_Segment(dom, win) {
    const weights = [];

    if (win.hasSegment)                                                               weights.push(80);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['cdn.segment.com', 'segment.io'])) weights.push(85);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['analytics.identify', 'analytics.track', 'analytics.page'])) weights.push(65);

    if (weights.length === 0) return null;

    return {
      name:       'Segment',
      icon:       '🔀',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Customer data platform & CDP',
    };
  },

  /* ── Intercom ───────────────────────────────────────────── */
  _detect_Intercom(dom, win) {
    const weights = [];

    if (win.hasIntercom)                                                              weights.push(85);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['widget.intercom.io', 'js.intercomcdn.com'])) weights.push(85);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['Intercom(', 'intercomSettings'])) weights.push(75);

    if (weights.length === 0) return null;

    return {
      name:       'Intercom',
      icon:       '💬',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Customer messaging & support platform',
    };
  },

  /* ── Heap ───────────────────────────────────────────────── */
  _detect_Heap(dom, win) {
    const weights = [];

    if (win.hasHeap)                                                                  weights.push(85);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['heapanalytics.com', 'heap-js']))  weights.push(85);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['heap.load', 'heap.identify'])) weights.push(75);

    if (weights.length === 0) return null;

    return {
      name:       'Heap Analytics',
      icon:       '⛰️',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Retroactive behavioral analytics',
    };
  },

  /* ── TikTok Pixel ───────────────────────────────────────── */
  _detect_TikTok(dom, win) {
    const weights = [];

    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['analytics.tiktok.com'])) weights.push(85);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['ttq.load', 'TiktokAnalyticsObject'])) weights.push(80);

    if (weights.length === 0) return null;

    return {
      name:       'TikTok Pixel',
      icon:       '🎵',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'TikTok advertising & conversion tracking',
    };
  },

  /* ── Twitter / X Pixel ──────────────────────────────────── */
  _detect_Twitter(dom, win) {
    const weights = [];

    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['static.ads-twitter.com', 'platform.twitter.com'])) weights.push(80);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['twq(', 'twitter_conversion_tag'])) weights.push(75);

    if (weights.length === 0) return null;

    return {
      name:       'X (Twitter) Pixel',
      icon:       '🐦',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'X/Twitter advertising conversion tracking',
    };
  },

  /* ── Optimizely ─────────────────────────────────────────── */
  _detect_Optimizely(dom, win) {
    const weights = [];

    if (win.hasOptimizely)                                                            weights.push(85);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['optimizely.com/js', 'cdn.optimizely.com'])) weights.push(85);

    if (weights.length === 0) return null;

    return {
      name:       'Optimizely',
      icon:       '🧪',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'A/B testing & experimentation platform',
    };
  },

  /* ── VWO ────────────────────────────────────────────────── */
  _detect_VWO(dom, win) {
    const weights = [];

    if (win.hasVWO)                                                                   weights.push(85);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['vwo.com/j/sgE.js', 'd5phz18u4wuww.cloudfront.net'])) weights.push(80);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['_vwo_code', 'VWO.push']))      weights.push(75);

    if (weights.length === 0) return null;

    return {
      name:       'VWO (Visual Website Optimizer)',
      icon:       '🧬',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'A/B testing & conversion optimisation',
    };
  },

  /* ── Crisp ──────────────────────────────────────────────── */
  _detect_Crisp(dom, win) {
    const weights = [];

    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['client.crisp.chat', 'crisp.chat'])) weights.push(85);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['$crisp', 'CRISP_WEBSITE_ID']))  weights.push(80);

    if (weights.length === 0) return null;

    return {
      name:       'Crisp Chat',
      icon:       '💬',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Live chat & messaging tool',
    };
  },

  /* ── Sentry ─────────────────────────────────────────────── */
  _detect_Sentry(dom, win) {
    const weights = [];

    if (win.hasSentry)                                                                weights.push(80);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['browser.sentry-cdn.com', 'sentry.io'])) weights.push(80);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['Sentry.init', 'Sentry.captureException'])) weights.push(70);

    if (weights.length === 0) return null;

    return {
      name:       'Sentry',
      icon:       '🚨',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Error tracking & performance monitoring',
    };
  },
};
