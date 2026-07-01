/**
 * StackSight – security-detector.js
 * Analyses HTTP response headers to generate a security score and per-header status.
 *
 * Score starts at 100 and deductions are applied for each missing or misconfigured header.
 * Also checks whether the page is served over HTTPS.
 */

const SecurityDetector = {

  /**
   * Analyse security posture of the current page.
   *
   * @param {object} pageData - { dom, win, headers, url }
   * @returns {{
   *   score:   number,          // 0-100
   *   grade:   string,          // A+ … F
   *   https:   boolean,
   *   headers: object,          // { headerName: value|'' }
   *   issues:  string[],        // human-readable missing/bad header messages
   *   passed:  string[]         // human-readable good header messages
   * }}
   */
  detect({ dom, win, headers, url }) {
    const h         = this._normalizeHeaders(headers || {});
    const isHttps   = this._checkHttps(url);
    const headerMap = this._auditHeaders(h);

    let score  = 100;
    const issues = [];
    const passed = [];

    // ── HTTPS ──────────────────────────────────────────────────────────────
    if (!isHttps) {
      score -= 30;
      issues.push('Page is served over HTTP — no encryption in transit');
    } else {
      passed.push('HTTPS enabled — traffic is encrypted');
    }

    // ── Per-header deductions ──────────────────────────────────────────────
    const rules = [
      {
        key:       'content-security-policy',
        deduction: 20,
        label:     'Content-Security-Policy',
        tip:       'CSP prevents XSS and data-injection attacks',
      },
      {
        key:       'strict-transport-security',
        deduction: 15,
        label:     'Strict-Transport-Security (HSTS)',
        tip:       'HSTS forces browsers to use HTTPS',
      },
      {
        key:       'x-frame-options',
        deduction: 10,
        label:     'X-Frame-Options',
        tip:       'Prevents clickjacking via iframes',
      },
      {
        key:       'x-content-type-options',
        deduction: 10,
        label:     'X-Content-Type-Options',
        tip:       'Prevents MIME-type sniffing attacks',
      },
      {
        key:       'referrer-policy',
        deduction: 10,
        label:     'Referrer-Policy',
        tip:       'Controls how much referrer information is shared',
      },
      {
        key:       'permissions-policy',
        deduction: 8,
        label:     'Permissions-Policy',
        tip:       'Restricts access to sensitive browser features',
      },
      {
        key:       'cross-origin-opener-policy',
        deduction: 7,
        label:     'Cross-Origin-Opener-Policy (COOP)',
        tip:       'Isolates the browsing context to prevent cross-origin attacks',
      },
    ];

    for (const rule of rules) {
      const value = headerMap[rule.key];
      if (value) {
        passed.push(`${rule.label}: ${value}`);
      } else {
        score -= rule.deduction;
        issues.push(`Missing ${rule.label} — ${rule.tip}`);
      }
    }

    score = Math.max(0, score);

    return {
      score,
      grade:   this._grade(score),
      https:   isHttps,
      headers: headerMap,
      issues,
      passed,
    };
  },

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Build a map of the security-relevant headers we care about.
   * Values are trimmed strings; absent headers are empty strings.
   */
  _auditHeaders(h) {
    const relevant = [
      'content-security-policy',
      'strict-transport-security',
      'x-frame-options',
      'x-content-type-options',
      'referrer-policy',
      'permissions-policy',
      'cross-origin-opener-policy',
      'cross-origin-embedder-policy',
      'cross-origin-resource-policy',
      'x-xss-protection',           // legacy, but still checked
      'expect-ct',                   // deprecated, informational
    ];
    const out = {};
    for (const key of relevant) {
      out[key] = h[key] || '';
    }
    return out;
  },

  /** Check if the page URL uses HTTPS. */
  _checkHttps(url) {
    try {
      return new URL(url).protocol === 'https:';
    } catch {
      return false;
    }
  },

  /** Convert numeric score to letter grade. */
  _grade(score) {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  },

  /** Lower-case all header keys for case-insensitive matching. */
  _normalizeHeaders(headers) {
    const out = {};
    for (const [k, v] of Object.entries(headers)) {
      if (typeof k === 'string') {
        out[k.toLowerCase()] = typeof v === 'string' ? v.trim() : '';
      }
    }
    return out;
  },
};
