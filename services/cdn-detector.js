/**
 * StackSight – cdn-detector.js
 * Detects CDN providers from response headers, script URLs, and asset patterns.
 * Runs entirely in the popup context; no network calls are made here.
 */

const CDNDetector = {

  /**
   * Main entry point.
   * @param {object} pageData - { dom, win, headers, url }
   * @returns {{ name:string, confidence:number }|null}
   */
  detect({ dom, win, headers, url }) {
    const h = this._normalizeHeaders(headers || {});
    // dom.scripts is [{src, text, type, id}], dom.links is [{href, rel, id}]
    // Extract plain URL strings for pattern matching.
    const scriptObjs = (dom && dom.scripts) ? dom.scripts : [];
    const linkObjs   = (dom && dom.links)   ? dom.links   : [];
    const allUrls = [
      ...scriptObjs.map(s => s.src  || ''),
      ...linkObjs.map(l   => l.href || ''),
    ].filter(Boolean);

    const candidates = [
      this._detectCloudflare(h, allUrls),
      this._detectCloudFront(h, allUrls),
      this._detectAkamai(h, allUrls),
      this._detectFastly(h, allUrls),
      this._detectBunnyCDN(h, allUrls),
      this._detectKeyCDN(h, allUrls),
      this._detectMaxCDN(h, allUrls),
      this._detectJsDelivr(allUrls),
      this._detectUnpkg(allUrls),
    ].filter(Boolean);

    if (!candidates.length) return null;

    // Return the highest-confidence match
    candidates.sort((a, b) => b.confidence - a.confidence);
    return candidates[0];
  },

  // ─── Individual detectors ───────────────────────────────────────────────────

  _detectCloudflare(h, urls) {
    let score = 0;
    const signals = [];

    if (h['cf-cache-status']) { score += 40; signals.push('cf-cache-status header'); }
    if (h['cf-ray'])          { score += 40; signals.push('cf-ray header'); }
    if (h['cf-request-id'])   { score += 20; signals.push('cf-request-id header'); }
    if (h.server && /cloudflare/i.test(h.server)) { score += 30; signals.push('Server: cloudflare'); }
    if (urls.some(u => /cdnjs\.cloudflare\.com/i.test(u))) { score += 25; signals.push('cdnjs.cloudflare.com'); }
    if (urls.some(u => /\.cloudflare\.com/i.test(u)))      { score += 20; signals.push('*.cloudflare.com asset'); }

    if (!score) return null;
    return { name: 'Cloudflare', confidence: Math.min(score, 99), signals };
  },

  _detectCloudFront(h, urls) {
    let score = 0;
    const signals = [];

    if (h['x-amz-cf-id'])       { score += 50; signals.push('x-amz-cf-id header'); }
    if (h['x-amz-cf-pop'])      { score += 30; signals.push('x-amz-cf-pop header'); }
    if (h['via'] && /cloudfront/i.test(h['via'])) { score += 40; signals.push('Via: CloudFront'); }
    if (urls.some(u => /\.cloudfront\.net/i.test(u))) { score += 30; signals.push('*.cloudfront.net asset'); }

    if (!score) return null;
    return { name: 'Amazon CloudFront', confidence: Math.min(score, 99), signals };
  },

  _detectAkamai(h, urls) {
    let score = 0;
    const signals = [];

    if (h['x-check-cacheable'])        { score += 35; signals.push('x-check-cacheable header'); }
    if (h['x-akamai-request-id'])      { score += 45; signals.push('x-akamai-request-id header'); }
    if (h['x-cache'] && /akamai/i.test(h['x-cache'])) { score += 30; signals.push('x-cache: akamai'); }
    if (h.server && /akamaighost/i.test(h.server))    { score += 40; signals.push('Server: AkamaiGHost'); }
    if (urls.some(u => /akamaized\.net|akamai\.net|edgesuite\.net/i.test(u))) {
      score += 30; signals.push('Akamai asset URL');
    }

    if (!score) return null;
    return { name: 'Akamai', confidence: Math.min(score, 99), signals };
  },

  _detectFastly(h, urls) {
    let score = 0;
    const signals = [];

    if (h['x-served-by'] && /fastly/i.test(h['x-served-by'])) { score += 50; signals.push('x-served-by: fastly'); }
    if (h['fastly-restarts'] !== undefined)                     { score += 40; signals.push('fastly-restarts header'); }
    if (h['x-cache'] && /HIT|MISS/i.test(h['x-cache']) && h['x-served-by'] && /cache-/i.test(h['x-served-by'])) {
      score += 20; signals.push('Fastly cache pattern');
    }
    if (urls.some(u => /fastly\.net|fastlylb\.net/i.test(u))) { score += 30; signals.push('Fastly asset URL'); }

    if (!score) return null;
    return { name: 'Fastly', confidence: Math.min(score, 99), signals };
  },

  _detectBunnyCDN(h, urls) {
    let score = 0;
    const signals = [];

    if (h['bunnycdn-cache-status'] || h['bunny-cdn-cache-status']) { score += 50; signals.push('BunnyCDN cache header'); }
    if (urls.some(u => /b-cdn\.net|bunnycdn\.com/i.test(u))) { score += 40; signals.push('BunnyCDN asset URL'); }
    if (h.server && /bunny/i.test(h.server))                 { score += 30; signals.push('Server: BunnyCDN'); }

    if (!score) return null;
    return { name: 'BunnyCDN', confidence: Math.min(score, 99), signals };
  },

  _detectKeyCDN(h, urls) {
    let score = 0;
    const signals = [];

    if (h['x-edge-ip'] || h['x-pull-zone'])         { score += 45; signals.push('KeyCDN edge header'); }
    if (urls.some(u => /kxcdn\.com|keycdn\.com/i.test(u))) { score += 40; signals.push('KeyCDN asset URL'); }

    if (!score) return null;
    return { name: 'KeyCDN', confidence: Math.min(score, 99), signals };
  },

  _detectMaxCDN(h, urls) {
    let score = 0;
    const signals = [];

    if (h.server && /maxcdn|stackpath/i.test(h.server))      { score += 40; signals.push('Server: MaxCDN/StackPath'); }
    if (urls.some(u => /maxcdn\.bootstrapcdn\.com|stackpathcdn\.com/i.test(u))) {
      score += 35; signals.push('MaxCDN asset URL');
    }

    if (!score) return null;
    return { name: 'MaxCDN / StackPath', confidence: Math.min(score, 99), signals };
  },

  _detectJsDelivr(urls) {
    if (urls.some(u => /cdn\.jsdelivr\.net/i.test(u))) {
      return { name: 'jsDelivr', confidence: 95, signals: ['cdn.jsdelivr.net asset'] };
    }
    return null;
  },

  _detectUnpkg(urls) {
    if (urls.some(u => /unpkg\.com/i.test(u))) {
      return { name: 'unpkg', confidence: 95, signals: ['unpkg.com asset'] };
    }
    return null;
  },

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /** Lower-case all header keys for case-insensitive matching. */
  _normalizeHeaders(headers) {
    const out = {};
    for (const [k, v] of Object.entries(headers)) {
      out[k.toLowerCase()] = (v || '').toLowerCase();
    }
    return out;
  },
};
