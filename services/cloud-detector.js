/**
 * cloud-detector.js – StackSight Cloud Provider Detection
 *
 * Detects: AWS, Microsoft Azure, Google Cloud, DigitalOcean,
 *          Vercel, Netlify, Cloudflare Pages, Heroku, Fly.io, Render
 *
 * Detection methods:
 *  • Response headers (server, via, x-amz-*, x-azure-*, etc.)
 *  • Asset URLs (s3.amazonaws.com, azurewebsites.net, etc.)
 *  • Script sources pointing to cloud storage
 */

'use strict';

const CloudDetector = {

  /**
   * @param {{dom, win, headers, url}} pageData
   * @returns {Array<{name, icon, confidence, desc}>}
   */
  detect({ dom, win, headers, url }) {
    const results = [];
    const add = (item) => { if (item) results.push(item); };

    add(this._detectAWS(dom, headers, url));
    add(this._detectAzure(dom, headers, url));
    add(this._detectGCP(dom, headers, url));
    add(this._detectDigitalOcean(dom, headers, url));
    add(this._detectVercel(dom, headers, url));
    add(this._detectNetlify(dom, headers, url));
    add(this._detectCloudflarePgs(dom, headers, url));
    add(this._detectHeroku(dom, headers, url));
    add(this._detectRender(dom, headers, url));

    return results;
  },

  /* ── Amazon Web Services ─────────────────────────────────── */
  _detectAWS(dom, headers, url) {
    const weights = [];

    // CloudFront (AWS CDN) headers
    if (DetectorUtils.headerContains(headers, 'x-amz-cf-id'))              weights.push(80);
    if (DetectorUtils.headerContains(headers, 'x-amz-cf-pop'))             weights.push(75);
    if (DetectorUtils.headerContains(headers, 'x-amz-request-id'))         weights.push(70);
    if (DetectorUtils.headerContains(headers, 'x-amz-id-2'))               weights.push(65);
    if (DetectorUtils.header(headers, 'via').includes('CloudFront'))        weights.push(80);
    if (DetectorUtils.header(headers, 'server').toLowerCase().includes('awselb')) weights.push(70);

    // URL patterns
    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['.s3.amazonaws.com', '.cloudfront.net', 'awsstatic.com'])) weights.push(65);
    if (DetectorUtils.imageMatches(dom.images, ['s3.amazonaws.com', '.cloudfront.net'])) weights.push(50);
    if (url.includes('.cloudfront.net') || url.includes('.amazonaws.com'))  weights.push(80);

    // Elastic Beanstalk / ECS
    if (DetectorUtils.headerContains(headers, 'server', 'awselb') ||
        DetectorUtils.headerContains(headers, 'server', 'amazon'))          weights.push(55);

    if (weights.length === 0) return null;

    return {
      name:       'Amazon Web Services (AWS)',
      icon:       '☁️',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'S3, CloudFront, EC2, or Elastic Beanstalk',
    };
  },

  /* ── Microsoft Azure ────────────────────────────────────── */
  _detectAzure(dom, headers, url) {
    const weights = [];

    if (DetectorUtils.headerContains(headers, 'x-azure-ref'))              weights.push(85);
    if (DetectorUtils.headerContains(headers, 'x-ms-request-id'))         weights.push(65);
    if (DetectorUtils.headerContains(headers, 'x-msedge-ref'))            weights.push(70);
    if (DetectorUtils.header(headers, 'server').toLowerCase().includes('microsoft-iis')) weights.push(45);

    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['.azurewebsites.net', '.windows.net', '.azure.com', 'azureedge.net'])) weights.push(75);
    if (DetectorUtils.imageMatches(dom.images, ['.azurewebsites.net', '.blob.core.windows.net'])) weights.push(60);
    if (url.includes('.azurewebsites.net') || url.includes('.azure.com') || url.includes('.windows.net')) weights.push(85);

    if (weights.length === 0) return null;

    return {
      name:       'Microsoft Azure',
      icon:       '🔷',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Azure App Service, CDN, or Blob Storage',
    };
  },

  /* ── Google Cloud Platform ───────────────────────────────── */
  _detectGCP(dom, headers, url) {
    const weights = [];

    if (DetectorUtils.headerContains(headers, 'x-goog-request-id'))       weights.push(70);
    if (DetectorUtils.headerContains(headers, 'x-guploader-uploadid'))    weights.push(65);
    if (DetectorUtils.header(headers, 'server').toLowerCase().includes('google frontend')) weights.push(75);
    if (DetectorUtils.header(headers, 'server').toLowerCase() === 'gws') weights.push(60);

    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['.appspot.com', 'storage.googleapis.com', '.run.app'])) weights.push(75);
    if (DetectorUtils.imageMatches(dom.images, ['storage.googleapis.com', '.googleusercontent.com'])) weights.push(55);
    if (url.includes('.appspot.com') || url.includes('.run.app'))          weights.push(85);

    // Firebase hosting
    if (DetectorUtils.headerContains(headers, 'x-firebase-appcheck'))     weights.push(70);
    if (url.includes('.web.app') || url.includes('.firebaseapp.com'))      weights.push(80);

    if (weights.length === 0) return null;

    return {
      name:       'Google Cloud',
      icon:       '🌐',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'App Engine, Cloud Run, Firebase Hosting, GCS',
    };
  },

  /* ── DigitalOcean ────────────────────────────────────────── */
  _detectDigitalOcean(dom, headers, url) {
    const weights = [];

    if (DetectorUtils.scriptSrcMatches(dom.scripts, ['.digitaloceanspaces.com', 'nyc3.cdn.digitaloceanspaces.com'])) weights.push(80);
    if (DetectorUtils.imageMatches(dom.images, ['.digitaloceanspaces.com'])) weights.push(70);
    if (url.includes('.ondigitalocean.app') || url.includes('.digitalocean.com')) weights.push(85);
    if (DetectorUtils.header(headers, 'server').toLowerCase().includes('cloudways')) weights.push(50);

    if (weights.length === 0) return null;

    return {
      name:       'DigitalOcean',
      icon:       '🌊',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'DigitalOcean Droplets, Spaces, or App Platform',
    };
  },

  /* ── Vercel ──────────────────────────────────────────────── */
  _detectVercel(dom, headers, url) {
    const weights = [];

    if (DetectorUtils.headerContains(headers, 'x-vercel-id'))             weights.push(90);
    if (DetectorUtils.headerContains(headers, 'x-vercel-cache'))          weights.push(85);
    if (DetectorUtils.headerContains(headers, 'x-deployment-id'))         weights.push(50);
    if (DetectorUtils.header(headers, 'server').toLowerCase() === 'vercel') weights.push(85);
    if (url.includes('.vercel.app'))                                       weights.push(90);

    if (weights.length === 0) return null;

    return {
      name:       'Vercel',
      icon:       '▲',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Edge deployment platform by Vercel',
    };
  },

  /* ── Netlify ─────────────────────────────────────────────── */
  _detectNetlify(dom, headers, url) {
    const weights = [];

    if (DetectorUtils.headerContains(headers, 'x-nf-request-id'))         weights.push(90);
    if (DetectorUtils.headerContains(headers, 'x-netlify'))                weights.push(85);
    if (DetectorUtils.header(headers, 'server').toLowerCase().includes('netlify')) weights.push(85);
    if (url.includes('.netlify.app') || url.includes('.netlify.com'))     weights.push(90);

    if (weights.length === 0) return null;

    return {
      name:       'Netlify',
      icon:       '🔰',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Jamstack deployment & serverless platform',
    };
  },

  /* ── Cloudflare Pages ────────────────────────────────────── */
  _detectCloudflarePgs(dom, headers, url) {
    const weights = [];

    if (url.includes('.pages.dev'))                                        weights.push(90);
    if (DetectorUtils.headerContains(headers, 'cf-cache-status'))         weights.push(60);
    if (DetectorUtils.headerContains(headers, 'cf-ray'))                  weights.push(55);

    if (weights.length === 0) return null;

    return {
      name:       'Cloudflare Pages',
      icon:       '🟠',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Static site hosting on Cloudflare\'s edge',
    };
  },

  /* ── Heroku ──────────────────────────────────────────────── */
  _detectHeroku(dom, headers, url) {
    const weights = [];

    if (url.includes('.herokuapp.com'))                                    weights.push(90);
    if (DetectorUtils.headerContains(headers, 'x-request-id'))            weights.push(20);
    if (DetectorUtils.header(headers, 'via').includes('heroku'))           weights.push(80);

    if (weights.length === 0) return null;

    return {
      name:       'Heroku',
      icon:       '💜',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'PaaS cloud application platform',
    };
  },

  /* ── Render ──────────────────────────────────────────────── */
  _detectRender(dom, headers, url) {
    const weights = [];

    if (url.includes('.onrender.com'))                                     weights.push(90);
    if (DetectorUtils.headerContains(headers, 'x-render-origin-server'))  weights.push(90);

    if (weights.length === 0) return null;

    return {
      name:       'Render',
      icon:       '🎯',
      confidence: DetectorUtils.sumConfidence(weights),
      desc:       'Cloud hosting platform (render.com)',
    };
  },
};
