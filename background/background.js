/**
 * background.js – StackSight Service Worker
 *
 * Responsibilities:
 *  • Fetch response headers for any URL (popup cannot do this cross-origin)
 *  • Handle extension lifecycle events
 *  • Relay data back to popup via chrome.runtime.sendMessage
 */

'use strict';

/* ── Message Router ─────────────────────────────────────── */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {

    case 'FETCH_HEADERS':
      fetchHeaders(message.url)
        .then(sendResponse)
        .catch(err => sendResponse({ success: false, error: err.message, headers: {} }));
      return true; // keep message channel open for async response

    case 'PING':
      sendResponse({ pong: true });
      return false;

    default:
      return false;
  }
});

/* ── Header Fetcher ─────────────────────────────────────── */
/**
 * Fetches response headers for a given URL.
 * Uses HEAD first for speed; falls back to GET on failure.
 *
 * @param {string} url - The page URL to probe
 * @returns {Promise<{success:boolean, headers:object, status:number, finalUrl:string}>}
 */
async function fetchHeaders(url) {
  if (!url || !url.startsWith('http')) {
    return { success: false, headers: {}, status: 0, finalUrl: url, error: 'Non-HTTP URL' };
  }

  try {
    // Attempt HEAD request (fast, no body download)
    const headResponse = await fetch(url, {
      method:      'HEAD',
      cache:       'no-store',
      credentials: 'omit',
      redirect:    'follow',
    });

    const headers = parseHeaders(headResponse.headers);
    return {
      success:  true,
      headers,
      status:   headResponse.status,
      finalUrl: headResponse.url,
    };

  } catch (headErr) {
    // HEAD failed (some servers reject HEAD) — try GET
    try {
      const getResponse = await fetch(url, {
        method:      'GET',
        cache:       'no-store',
        credentials: 'omit',
        redirect:    'follow',
        // Read only a small portion to minimise data transfer
        headers:     { Range: 'bytes=0-512' },
      });

      const headers = parseHeaders(getResponse.headers);
      return {
        success:  true,
        headers,
        status:   getResponse.status,
        finalUrl: getResponse.url,
      };

    } catch (getErr) {
      return {
        success: false,
        headers: {},
        status:  0,
        finalUrl: url,
        error:   getErr.message,
      };
    }
  }
}

/**
 * Convert Headers object to a plain key→value map.
 * All keys are normalised to lowercase.
 *
 * @param {Headers} headers
 * @returns {Object.<string,string>}
 */
function parseHeaders(headers) {
  const result = {};
  headers.forEach((value, key) => {
    result[key.toLowerCase()] = value;
  });
  return result;
}

/* ── Install / Update Lifecycle ─────────────────────────── */
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    console.log('[StackSight] Extension installed. Ready to analyze websites!');
  } else if (reason === 'update') {
    console.log('[StackSight] Extension updated to', chrome.runtime.getManifest().version);
  }
});
