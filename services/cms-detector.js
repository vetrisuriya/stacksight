/**
 * cms-detector.js – StackSight CMS Detection
 *
 * Detects: WordPress, Shopify, Drupal, Joomla, Magento, Wix, Squarespace
 *
 * Each platform is identified using multiple independent signals;
 * confidence is the weighted sum of matched signals, capped at 99.
 */

'use strict';

const CMSDetector = {

  /**
   * Main entry point.
   * @param {{dom, win, headers, url}} pageData
   * @returns {Array<{name, icon, confidence, desc, version}>}
   */
  detect({ dom, win, headers, url }) {
    const results = [];

    const add = (item) => { if (item) results.push(item); };

    add(this._detectWordPress(dom, win, headers));
    add(this._detectShopify(dom, win, headers));
    add(this._detectDrupal(dom, win, headers));
    add(this._detectJoomla(dom, win, headers));
    add(this._detectMagento(dom, win, headers));
    add(this._detectWix(dom, win, headers));
    add(this._detectSquarespace(dom, win, headers));
    add(this._detectGhost(dom, win, headers));
    add(this._detectWebflow(dom, win, headers));

    return results;
  },

  /* ── WordPress ─────────────────────────────────────────── */
  _detectWordPress(dom, win, headers) {
    const weights = [];

    // Primary: wp-content or wp-includes in script/link src
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['/wp-content/', '/wp-includes/'])) weights.push(65);
    if (DetectorUtils.linkMatches(dom.links, ['/wp-content/', '/wp-includes/']))         weights.push(45);

    // Generator meta tag
    const gen = DetectorUtils.getGenerator(dom.metas);
    if (gen.toLowerCase().includes('wordpress')) weights.push(75);

    // Window object
    if (win.hasWp) weights.push(35);

    // HTML content signals
    if (dom.hasWpContent)  weights.push(25);
    if (dom.hasWpIncludes) weights.push(20);

    // WP emoji script
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['wp-emoji'])) weights.push(30);

    // Body classes like 'home page-template' (common in WP)
    if (DetectorUtils.bodyClassContains(dom.bodyClasses, ['wp-', 'single-', 'page-template'])) weights.push(15);

    // X-Powered-By or headers
    if (DetectorUtils.headerContains(headers, 'x-powered-by', 'wordpress')) weights.push(40);

    // Look-up theme in script text
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['wp.i18n', 'wp.hooks', 'wp.element'])) weights.push(30);

    if (weights.length === 0) return null;

    const version = gen.match(/WordPress\s+([\d.]+)/i)?.[1] ?? null;

    return {
      name:       'WordPress',
      icon:       '🔵',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Open-source CMS powering ~43% of the web',
      version,
    };
  },

  /* ── Shopify ───────────────────────────────────────────── */
  _detectShopify(dom, win, headers) {
    const weights = [];

    if (win.hasShopify)                                                              weights.push(90);
    if (win.shopifyShop)                                                             weights.push(15);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['cdn.shopify.com']))            weights.push(75);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['Shopify.shop', 'Shopify.theme'])) weights.push(60);
    if (DetectorUtils.linkMatches(dom.links, ['cdn.shopify.com']))                   weights.push(50);
    if (DetectorUtils.imageMatches(dom.images, ['cdn.shopify.com']))                 weights.push(30);
    if (DetectorUtils.headerContains(headers, 'x-shopify-stage'))                   weights.push(80);
    if (DetectorUtils.headerContains(headers, 'x-storefront-renderer-rendered'))     weights.push(70);

    if (weights.length === 0) return null;

    return {
      name:       'Shopify',
      icon:       '🛒',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Cloud-based e-commerce platform',
    };
  },

  /* ── Drupal ────────────────────────────────────────────── */
  _detectDrupal(dom, win, headers) {
    const weights = [];

    if (win.hasDrupal)                                                               weights.push(90);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['drupal.js', '/drupal/']))      weights.push(65);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['Drupal.settings', 'drupalSettings'])) weights.push(70);
    if (DetectorUtils.getGenerator(dom.metas).toLowerCase().includes('drupal'))      weights.push(75);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['/sites/default/files/', '/sites/all/modules/'])) weights.push(60);
    if (DetectorUtils.linkMatches(dom.links, ['/sites/default/files/']))             weights.push(50);
    if (DetectorUtils.headerContains(headers, 'x-drupal-cache'))                    weights.push(80);
    if (DetectorUtils.headerContains(headers, 'x-generator', 'drupal'))             weights.push(80);

    if (weights.length === 0) return null;

    const gen = DetectorUtils.getGenerator(dom.metas);
    const version = gen.match(/Drupal\s+([\d.]+)/i)?.[1] ?? null;

    return {
      name:       'Drupal',
      icon:       '💧',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Enterprise open-source CMS',
      version,
    };
  },

  /* ── Joomla ────────────────────────────────────────────── */
  _detectJoomla(dom, win, headers) {
    const weights = [];

    if (DetectorUtils.getGenerator(dom.metas).toLowerCase().includes('joomla'))     weights.push(80);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['/media/joomla_', '/media/system/'])) weights.push(65);
    if (DetectorUtils.linkMatches(dom.links, ['/media/joomla_', '/templates/']))     weights.push(50);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['Joomla.submitbutton'])) weights.push(70);
    if (DetectorUtils.headerContains(headers, 'x-content-encoded-by', 'joomla'))    weights.push(80);

    if (weights.length === 0) return null;

    const gen = DetectorUtils.getGenerator(dom.metas);
    const version = gen.match(/Joomla!\s*([\d.]+)/i)?.[1] ?? null;

    return {
      name:       'Joomla',
      icon:       '🟡',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Open-source CMS with extension ecosystem',
      version,
    };
  },

  /* ── Magento ───────────────────────────────────────────── */
  _detectMagento(dom, win, headers) {
    const weights = [];

    if (win.hasMagento)                                                              weights.push(90);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['/mage/', '/magento/', 'mage.js'])) weights.push(65);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['Mage.Cookies', 'Magento_Customer', 'mage/utils'])) weights.push(70);
    if (DetectorUtils.linkMatches(dom.links, ['/skin/frontend/', '/pub/static/frontend/'])) weights.push(55);
    if (DetectorUtils.hasCookie(dom.cookieNames, ['frontend', 'adminhtml']))         weights.push(35);
    if (DetectorUtils.headerContains(headers, 'x-magento-cache-debug'))             weights.push(80);

    if (weights.length === 0) return null;

    return {
      name:       'Magento',
      icon:       '🟠',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Enterprise e-commerce platform by Adobe',
    };
  },

  /* ── Wix ───────────────────────────────────────────────── */
  _detectWix(dom, win, headers) {
    const weights = [];

    if (win.hasWix)                                                                  weights.push(90);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['static.wixstatic.com', 'wix.com/'])) weights.push(75);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['wixBiSession', 'wixPerformanceMeasurements'])) weights.push(65);
    if (DetectorUtils.imageMatches(dom.images, ['static.wixstatic.com']))            weights.push(55);
    if (DetectorUtils.getMetaByName(dom.metas, 'generator')?.toLowerCase().includes('wix')) weights.push(75);
    if (DetectorUtils.headerContains(headers, 'x-wix-request-id'))                  weights.push(80);

    if (weights.length === 0) return null;

    return {
      name:       'Wix',
      icon:       '🌐',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Cloud-based website builder platform',
    };
  },

  /* ── Squarespace ───────────────────────────────────────── */
  _detectSquarespace(dom, win, headers) {
    const weights = [];

    if (win.hasSquare)                                                               weights.push(85);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['static.squarespace.com', 'squarespace.com/'])) weights.push(80);
    if (DetectorUtils.linkMatches(dom.links, ['static.squarespace.com']))            weights.push(65);
    if (DetectorUtils.imageMatches(dom.images, ['squarespace-cdn.com', 'sqspcdn.com'])) weights.push(60);
    if (DetectorUtils.getGenerator(dom.metas).toLowerCase().includes('squarespace')) weights.push(80);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['SQUARESPACE_ROLLUPS']))       weights.push(75);

    if (weights.length === 0) return null;

    return {
      name:       'Squarespace',
      icon:       '⬛',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'All-in-one website builder platform',
    };
  },

  /* ── Ghost ─────────────────────────────────────────────── */
  _detectGhost(dom, win, headers) {
    const weights = [];

    if (DetectorUtils.getGenerator(dom.metas).toLowerCase().includes('ghost'))       weights.push(80);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['/ghost/']))                    weights.push(60);
    if (DetectorUtils.linkMatches(dom.links, ['/ghost/']))                           weights.push(50);
    if (DetectorUtils.headerContains(headers, 'x-ghost-cache-status'))              weights.push(80);

    if (weights.length === 0) return null;

    const gen = DetectorUtils.getGenerator(dom.metas);
    const version = gen.match(/Ghost\s+([\d.]+)/i)?.[1] ?? null;

    return {
      name:       'Ghost',
      icon:       '👻',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Professional publishing platform (Node.js)',
      version,
    };
  },

  /* ── Webflow ────────────────────────────────────────────── */
  _detectWebflow(dom, win, headers) {
    const weights = [];

    if (DetectorUtils.getGenerator(dom.metas).toLowerCase().includes('webflow'))     weights.push(80);
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['webflow.com/', 'd3e54v103j8qbb.cloudfront.net'])) weights.push(75);
    if (DetectorUtils.linkMatches(dom.links, ['webflow.com/']))                      weights.push(60);
    if (DetectorUtils.scriptTextMatches(dom.scripts, ['Webflow.require', 'Webflow.push'])) weights.push(70);

    if (weights.length === 0) return null;

    return {
      name:       'Webflow',
      icon:       '🌊',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Visual web design platform',
    };
  },
};
