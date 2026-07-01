/**
 * detector.js – StackSight Shared Detection Utilities
 *
 * Provides helper functions and constants used by all
 * technology-specific detector modules.
 */

'use strict';

/* eslint-disable no-unused-vars */

const DetectorUtils = {

  /* ── Confidence Calculation ─────────────────────────────
     Accumulates weighted signals and caps the result.

     @param {number[]} weights  - Array of points per matched signal
     @param {number}   [cap=99] - Maximum confidence to return
     @returns {number}          - Confidence percentage 0–cap
  ─────────────────────────────────────────────────────── */
  sumConfidence(weights, cap = 99) {
    if (!weights || weights.length === 0) return 0;
    return Math.min(cap, weights.reduce((acc, w) => acc + w, 0));
  },

  /* ── Script Source Matching ───────────────────────────── */

  /**
   * Returns true if any script src contains one of the patterns.
   * @param {Array<{src:string, text:string}>} scripts
   * @param {string[]} patterns
   */
  scriptSrcMatches(scripts, patterns) {
    return (scripts || []).some(s =>
      patterns.some(p => (s.src || '').toLowerCase().includes(p.toLowerCase()))
    );
  },

  /**
   * Returns true if any script inline text contains one of the patterns.
   */
  scriptTextMatches(scripts, patterns) {
    return (scripts || []).some(s =>
      patterns.some(p => (s.text || '').toLowerCase().includes(p.toLowerCase()))
    );
  },

  /**
   * Returns true if any script src OR text matches.
   */
  scriptMatches(scripts, patterns) {
    return (scripts || []).some(s =>
      patterns.some(p => {
        const pat = p.toLowerCase();
        return (s.src || '').toLowerCase().includes(pat) ||
               (s.text || '').toLowerCase().includes(pat);
      })
    );
  },

  /* ── Meta Tag Helpers ────────────────────────────────── */

  /**
   * Get the content of a meta tag by name (case-insensitive).
   * @param {Array<{name:string, content:string, property:string}>} metas
   * @param {string} name
   * @returns {string|null}
   */
  getMetaByName(metas, name) {
    const n = name.toLowerCase();
    const m = (metas || []).find(m =>
      (m.name || '').toLowerCase() === n ||
      (m.property || '').toLowerCase() === n
    );
    return m ? m.content || null : null;
  },

  /**
   * Get generator meta content.
   */
  getGenerator(metas) {
    return this.getMetaByName(metas, 'generator') || '';
  },

  /* ── Cookie Helpers ──────────────────────────────────── */

  /**
   * Check if any of the given cookie names are present.
   */
  hasCookie(cookieNames, names) {
    const cookies = cookieNames || [];
    return names.some(n => cookies.includes(n));
  },

  /* ── URL / Link Helpers ──────────────────────────────── */

  /**
   * Check if any link href contains one of the patterns.
   */
  linkMatches(links, patterns) {
    return (links || []).some(l =>
      patterns.some(p => (l.href || '').toLowerCase().includes(p.toLowerCase()))
    );
  },

  /**
   * Check if any image src contains one of the patterns.
   */
  imageMatches(images, patterns) {
    return (images || []).some(img =>
      patterns.some(p => (img || '').toLowerCase().includes(p.toLowerCase()))
    );
  },

  /* ── Header Helpers ──────────────────────────────────── */

  /**
   * Get a header value (case-insensitive, already lowercased in our map).
   */
  header(headers, name) {
    return (headers || {})[name.toLowerCase()] || '';
  },

  /**
   * Check if a header exists and optionally contains a value.
   */
  headerContains(headers, name, value) {
    const h = this.header(headers, name).toLowerCase();
    return value ? h.includes(value.toLowerCase()) : h.length > 0;
  },

  /* ── Performance Resource Helpers ────────────────────── */

  /**
   * Filter performance resources by initiator type.
   */
  perfByType(perfResources, type) {
    return (perfResources || []).filter(r => r.initiatorType === type);
  },

  /**
   * Count unique third-party hosts in performance resources.
   */
  countThirdPartyHosts(perfResources, pageOrigin) {
    const hosts = new Set();
    (perfResources || []).forEach(r => {
      try {
        const u = new URL(r.name);
        if (u.origin !== pageOrigin) hosts.add(u.hostname);
      } catch (_) { /* ignore invalid URLs */ }
    });
    return hosts.size;
  },

  /* ── HTML Content Helpers ─────────────────────────────── */

  /**
   * Check if any body class contains one of the patterns.
   */
  bodyClassContains(bodyClasses, patterns) {
    const bc = (bodyClasses || '').toLowerCase();
    return patterns.some(p => bc.includes(p.toLowerCase()));
  },

  /* ── Generic Text Contains ───────────────────────────── */
  textContains(text, patterns) {
    const t = (text || '').toLowerCase();
    return patterns.some(p => t.includes(p.toLowerCase()));
  },
};
