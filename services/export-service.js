/**
 * StackSight – export-service.js
 * Generates and downloads analysis reports as JSON or plain-text files.
 * Everything runs in the browser; no server involved.
 *
 * Data structure (as produced by analyzeAll in popup.js):
 *   results.cms        → Array<{name, icon, confidence, desc, version}>
 *   results.frameworks → Array<{name, icon, confidence, desc, version}>
 *   results.analytics  → { list: Array<{name, icon, confidence, desc}> }
 *   results.cdn        → Array<{name, confidence, signals}>   (0–1 items)
 *   results.cloud      → Array<{name, icon, confidence, desc}>
 *   results.backend    → Array<{name, icon, confidence, desc}>
 *   results.security   → { score, grade, https, headers, issues, passed }
 *   results.performance→ { score, grade, scriptCount, cssCount, imageCount,
 *                          fontCount, thirdPartyCount, totalResources, recommendations }
 *   results.scores     → { tech, security, performance, privacy }
 */

const ExportService = {

  // ─── JSON export ────────────────────────────────────────────────────────────

  downloadJSON(results, tab) {
    const payload = this._buildJSONPayload(results, tab);
    const json    = JSON.stringify(payload, null, 2);
    const blob    = new Blob([json], { type: 'application/json' });
    this._triggerDownload(blob, this._filename(tab, 'json'));
  },

  // ─── TXT export ─────────────────────────────────────────────────────────────

  downloadTXT(results, tab) {
    const text = this._buildTXTReport(results, tab);
    const blob = new Blob([text], { type: 'text/plain' });
    this._triggerDownload(blob, this._filename(tab, 'txt'));
  },

  // ─── JSON builder ───────────────────────────────────────────────────────────

  _buildJSONPayload(results, tab) {
    const {
      cms = [], frameworks = [], analytics = { list: [] },
      cdn = [], cloud = [], backend = [],
      security, performance, scores,
    } = results || {};

    return {
      meta: {
        tool:       'StackSight',
        version:    '1.0.0',
        url:        tab ? tab.url   : '',
        title:      tab ? tab.title : '',
        exportedAt: new Date().toISOString(),
      },

      scores: {
        technology:  scores?.tech        ?? null,
        security:    scores?.security     ?? null,
        performance: scores?.performance  ?? null,
        privacy:     scores?.privacy      ?? null,
      },

      // All of these are arrays
      cms: cms.map(c => ({
        name:       c.name,
        confidence: c.confidence,
        version:    c.version  ?? null,
        desc:       c.desc     ?? '',
      })),

      frameworks: frameworks.map(f => ({
        name:       f.name,
        confidence: f.confidence,
        version:    f.version  ?? null,
        desc:       f.desc     ?? '',
      })),

      analytics: (analytics.list || []).map(a => ({
        name:       a.name,
        confidence: a.confidence ?? null,
        desc:       a.desc       ?? '',
      })),

      cdn: cdn.map(c => ({
        name:       c.name,
        confidence: c.confidence,
      })),

      cloud: cloud.map(c => ({
        name:       c.name,
        confidence: c.confidence,
        desc:       c.desc ?? '',
      })),

      backend: backend.map(b => ({
        name:       b.name,
        confidence: b.confidence,
        desc:       b.desc ?? '',
      })),

      security: security ? {
        score:   security.score,
        grade:   security.grade,
        https:   security.https,
        headers: security.headers,
        issues:  security.issues  || [],
        passed:  security.passed  || [],
      } : null,

      performance: performance ? {
        score:           performance.score,
        grade:           performance.grade,
        scriptCount:     performance.scriptCount,
        cssCount:        performance.cssCount,
        imageCount:      performance.imageCount,
        fontCount:       performance.fontCount,
        thirdPartyCount: performance.thirdPartyCount,
        totalResources:  performance.totalResources,
        recommendations: performance.recommendations || [],
      } : null,
    };
  },

  // ─── TXT builder ────────────────────────────────────────────────────────────

  _buildTXTReport(results, tab) {
    const {
      cms = [], frameworks = [], analytics = { list: [] },
      cdn = [], cloud = [], backend = [],
      security, performance, scores,
    } = results || {};

    const hr  = '─'.repeat(54);
    const hr2 = '═'.repeat(54);
    const now = new Date().toLocaleString();

    const lines = [
      hr2,
      '  STACKSIGHT – Tech Stack Report',
      hr2,
      `  URL    : ${tab ? tab.url   : 'N/A'}`,
      `  Title  : ${tab ? tab.title : 'N/A'}`,
      `  Date   : ${now}`,
      hr,
      '',
      '[ SCORES ]',
      scores ? [
        `  Technology  : ${scores.tech        ?? '--'} / 100`,
        `  Security    : ${scores.security     ?? '--'} / 100`,
        `  Performance : ${scores.performance  ?? '--'} / 100`,
        `  Privacy     : ${scores.privacy      ?? '--'} / 100`,
      ].join('\n') : '  N/A',
      '',
      hr,
      '[ CMS ]',
    ];

    if (cms.length) {
      cms.forEach(c => lines.push(`  • ${c.name} — ${c.confidence}% confidence${c.version ? ` (v${c.version})` : ''}`));
    } else {
      lines.push('  None detected');
    }

    lines.push('', hr, '[ FRAMEWORKS & LIBRARIES ]');
    if (frameworks.length) {
      frameworks.forEach(f => lines.push(`  • ${f.name} — ${f.confidence}%${f.version ? ` (v${f.version})` : ''}`));
    } else {
      lines.push('  None detected');
    }

    lines.push('', hr, '[ ANALYTICS & TRACKING ]');
    const analyticsArr = analytics.list || [];
    if (analyticsArr.length) {
      analyticsArr.forEach(a => lines.push(`  • ${a.name}`));
    } else {
      lines.push('  None detected');
    }

    lines.push('', hr, '[ BACKEND ]');
    if (backend.length) {
      backend.forEach(b => lines.push(`  • ${b.name} — ${b.confidence}% confidence`));
    } else {
      lines.push('  Unknown / not identified');
    }

    lines.push('', hr, '[ CDN ]');
    if (cdn.length) {
      cdn.forEach(c => lines.push(`  • ${c.name} — ${c.confidence}% confidence`));
    } else {
      lines.push('  None detected');
    }

    lines.push('', hr, '[ CLOUD PROVIDER ]');
    if (cloud.length) {
      cloud.forEach(c => lines.push(`  • ${c.name} — ${c.confidence}% confidence`));
    } else {
      lines.push('  None detected');
    }

    // Security
    lines.push('', hr, '[ SECURITY ]');
    if (security) {
      lines.push(`  Score  : ${security.score} / 100  (Grade: ${security.grade})`);
      lines.push(`  HTTPS  : ${security.https ? 'Yes ✓' : 'No ✗'}`);
      lines.push('');
      lines.push('  Headers present:');
      if (security.passed && security.passed.length) {
        security.passed.forEach(p => lines.push(`    ✓  ${p}`));
      } else {
        lines.push('    None');
      }
      lines.push('');
      lines.push('  Issues:');
      if (security.issues && security.issues.length) {
        security.issues.forEach(i => lines.push(`    ✗  ${i}`));
      } else {
        lines.push('    None – excellent security posture!');
      }
    } else {
      lines.push('  N/A');
    }

    // Performance
    lines.push('', hr, '[ PERFORMANCE ]');
    if (performance) {
      lines.push(`  Score           : ${performance.score} / 100  (Grade: ${performance.grade})`);
      lines.push(`  Scripts         : ${performance.scriptCount}`);
      lines.push(`  CSS files       : ${performance.cssCount}`);
      lines.push(`  Images          : ${performance.imageCount}`);
      lines.push(`  Fonts           : ${performance.fontCount}`);
      lines.push(`  Third-party     : ${performance.thirdPartyCount}`);
      lines.push(`  Total resources : ${performance.totalResources}`);
      lines.push('');
      lines.push('  Recommendations:');
      const recs = performance.recommendations || [];
      if (recs.length) {
        recs.forEach(r => lines.push(`    ${r.icon}  ${r.text}`));
      } else {
        lines.push('    No issues found.');
      }
    } else {
      lines.push('  N/A');
    }

    lines.push('', hr2);
    lines.push('  Generated by StackSight – https://github.com/stacksight-ext');
    lines.push(hr2);

    return lines.join('\n');
  },

  // ─── Utilities ───────────────────────────────────────────────────────────────

  _filename(tab, ext) {
    let slug = 'stacksight-report';
    try {
      const host = new URL(tab.url).hostname
        .replace(/^www\./, '')
        .replace(/[^a-z0-9]/gi, '-');
      if (host) slug = `stacksight-${host}`;
    } catch { /* keep default */ }
    const ts = new Date().toISOString().slice(0, 10);
    return `${slug}-${ts}.${ext}`;
  },

  _triggerDownload(blob, filename) {
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href          = url;
    link.download      = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
};
