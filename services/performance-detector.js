/**
 * StackSight – performance-detector.js
 * Analyses page resource counts collected by collectIsolatedData() and produces
 * a performance score together with human-readable recommendations.
 *
 * Input shape expected from dom:
 *   dom.scriptCount    – number of <script> tags
 *   dom.linkCount      – number of <link> tags
 *   dom.imageCount     – number of <img> tags
 *   dom.scriptSrcs     – string[] of external script src values
 *   dom.perfResources  – PerformanceResourceTiming[] (serialised objects)
 */

const PerformanceDetector = {

  /**
   * @param {object} pageData - { dom, win, headers, url }
   * @returns {{
   *   score:           number,
   *   grade:           string,
   *   scriptCount:     number,
   *   cssCount:        number,
   *   imageCount:      number,
   *   fontCount:       number,
   *   thirdPartyCount: number,
   *   totalResources:  number,
   *   recommendations: Array<{ type: 'good'|'warn'|'error', icon: string, text: string }>
   * }}
   */
  detect({ dom, win, headers, url }) {
    const perf = (dom && dom.perfResources) ? dom.perfResources : [];

    // ── Resource counts ──────────────────────────────────────────────────────
    const scriptCount = (dom && dom.scriptCount) || 0;
    const cssCount    = (dom && dom.linkCount)   || 0;
    const imageCount  = (dom && dom.imageCount)  || 0;

    const fontCount = perf.filter(r =>
      r.initiatorType === 'font' ||
      /\.(woff2?|ttf|otf|eot)(\?|$)/i.test(r.name)
    ).length;

    // Third-party = resources whose hostname differs from the page origin
    const pageHost = this._hostname(url);
    const thirdPartyCount = perf.filter(r => {
      const h = this._hostname(r.name);
      return h && h !== pageHost;
    }).length;

    const totalResources = perf.length || (scriptCount + cssCount + imageCount);

    // ── Scoring ──────────────────────────────────────────────────────────────
    let score = 100;
    const recommendations = [];

    // Scripts
    if (scriptCount > 30) {
      score -= 25;
      recommendations.push({ type: 'error', icon: '🚨', text: `${scriptCount} script tags detected — very high; aim for under 15` });
    } else if (scriptCount > 15) {
      score -= 12;
      recommendations.push({ type: 'warn', icon: '⚠️', text: `${scriptCount} script tags detected — consider bundling to reduce requests` });
    } else if (scriptCount > 0) {
      recommendations.push({ type: 'good', icon: '✅', text: `Script count looks healthy (${scriptCount})` });
    }

    // CSS
    if (cssCount > 10) {
      score -= 15;
      recommendations.push({ type: 'warn', icon: '⚠️', text: `${cssCount} CSS files detected — merging stylesheets can improve load time` });
    } else if (cssCount > 0) {
      recommendations.push({ type: 'good', icon: '✅', text: `CSS file count is reasonable (${cssCount})` });
    }

    // Images
    if (imageCount > 50) {
      score -= 20;
      recommendations.push({ type: 'error', icon: '🚨', text: `${imageCount} images on page — lazy loading and optimisation recommended` });
    } else if (imageCount > 25) {
      score -= 10;
      recommendations.push({ type: 'warn', icon: '⚠️', text: `${imageCount} images detected — consider lazy loading off-screen images` });
    } else if (imageCount > 0) {
      recommendations.push({ type: 'good', icon: '✅', text: `Image count looks manageable (${imageCount})` });
    }

    // Fonts
    if (fontCount > 6) {
      score -= 10;
      recommendations.push({ type: 'warn', icon: '⚠️', text: `${fontCount} web fonts loaded — each font is a render-blocking resource` });
    } else if (fontCount > 0) {
      recommendations.push({ type: 'good', icon: '✅', text: `Web fonts: ${fontCount} — within a reasonable range` });
    }

    // Third-party scripts
    if (thirdPartyCount > 20) {
      score -= 20;
      recommendations.push({ type: 'error', icon: '🚨', text: `${thirdPartyCount} third-party resources — heavily impacts privacy and load time` });
    } else if (thirdPartyCount > 10) {
      score -= 10;
      recommendations.push({ type: 'warn', icon: '⚠️', text: `${thirdPartyCount} third-party resources — review trackers and unnecessary scripts` });
    } else if (thirdPartyCount > 0) {
      recommendations.push({ type: 'good', icon: '✅', text: `Third-party resource count is low (${thirdPartyCount})` });
    }

    // Total resources
    if (totalResources > 100) {
      score -= 10;
      recommendations.push({ type: 'warn', icon: '⚠️', text: `${totalResources} total resources — high number of HTTP requests detected` });
    } else if (totalResources > 0) {
      recommendations.push({ type: 'good', icon: '✅', text: `Total resources: ${totalResources}` });
    }

    // Fallback if no data was collected
    if (!totalResources && !scriptCount && !cssCount && !imageCount) {
      recommendations.push({ type: 'warn', icon: 'ℹ️', text: 'Performance data not available for this page' });
      score = 0;
    }

    score = Math.max(0, Math.min(100, score));

    return {
      score,
      grade:           this._grade(score),
      scriptCount,
      cssCount,
      imageCount,
      fontCount,
      thirdPartyCount,
      totalResources,
      recommendations,
    };
  },

  // ─── Helpers ────────────────────────────────────────────────────────────────

  _grade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  },

  _hostname(urlStr) {
    try {
      return new URL(urlStr).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  },
};
