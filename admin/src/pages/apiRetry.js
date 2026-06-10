import React from 'react';
  
  const ApiRetry = () =>  {
	return (
	  <div>
	  </div>
	);
  }
  
  export default ApiRetry;
  /**
 * apiRetry.js  — drop this next to your api.js
 *
 * Fixes two issues:
 *  1. First-load blank data  → retries API calls up to N times with back-off
 *  2. Long-idle broken data  → periodic keep-alive ping so the backend never
 *                              fully sleeps (important on free-tier Render/Railway)
 */

const BASE = import.meta.env.VITE_API_URL;

// ─── Retry wrapper ────────────────────────────────────────────────────────────
/**
 * Calls `fn` up to `maxTries` times.
 * Waits `baseDelayMs * attempt` ms between attempts (linear back-off).
 *
 * @param {() => Promise<any>} fn
 * @param {number} maxTries   default 4
 * @param {number} baseDelayMs  default 1500
 */
export async function withRetry(fn, maxTries = 4, baseDelayMs = 1500) {
  let lastErr;
  for (let attempt = 1; attempt <= maxTries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < maxTries) {
        await new Promise(r => setTimeout(r, baseDelayMs * attempt));
      }
    }
  }
  throw lastErr;
}

// ─── Keep-alive ping ──────────────────────────────────────────────────────────
// Call startKeepAlive() once in your App root (or main.jsx).
// Pings GET /api/health every 4 minutes so Render/Railway never spins down
// while the tab is open.
//
// Make sure your backend has a GET /api/health route that returns 200.
//
let _pingTimer = null;

export function startKeepAlive(intervalMs = 4 * 60 * 1000) {
  if (_pingTimer) return; // already running
  const ping = () =>
    fetch(`${BASE}/api/health`, { method: 'GET', credentials: 'include' }).catch(() => {});
  ping(); // immediate first ping
  _pingTimer = setInterval(ping, intervalMs);
}

export function stopKeepAlive() {
  if (_pingTimer) { clearInterval(_pingTimer); _pingTimer = null; }
}

// ─── Usage example in App.jsx / main.jsx ─────────────────────────────────────
//
//   import { startKeepAlive } from './api/apiRetry';
//
//   useEffect(() => {
//     startKeepAlive();           // start pinging when app mounts
//     return () => stopKeepAlive(); // stop when app unmounts (tab close)
//   }, []);
//
// ─────────────────────────────────────────────────────────────────────────────
