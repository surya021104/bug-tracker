/**
 * Lightweight SDK wrapper for the Complete Bug Monitor.
 *
 * Usage in a target SPA (e.g. React):
 *
 *   import { initBugTracker } from "./utils/bugSdk";
 *
 *   initBugTracker({
 *     apiKey: "YOUR_API_KEY",
 *     endpoint: "http://localhost:4000/api/bugs/ingest",
 *     environment: "production",
 *     getUser: () => window.currentUser || null,
 *   });
 */

const DEFAULT_ENDPOINT = (import.meta.env.VITE_API_URL || "http://localhost:4000") + "/api/bugs/ingest";

/**
 * Initialize global bug tracking configuration.
 * This is read by public/complete-bug-monitor.js if that script is loaded.
 */
export function initBugTracker(config = {}) {
  if (typeof window === "undefined") return;

  const {
    apiKey = "",
    endpoint = DEFAULT_ENDPOINT,
    environment = "production",
    getUser,
  } = config;

  window.BUG_TRACKER_CONFIG = {
    ...(window.BUG_TRACKER_CONFIG || {}),
    apiKey,
    endpoint,
    environment,
  };

  if (typeof getUser === "function") {
    window.BUG_TRACKER_GET_USER = getUser;
  }

  // Helpful console hint for integrators
  // eslint-disable-next-line no-console
  console.log(
    "%cBug Tracker SDK initialised",
    "color:#0ea5e9;font-weight:bold;",
    {
      endpoint: window.BUG_TRACKER_CONFIG.endpoint,
      environment: window.BUG_TRACKER_CONFIG.environment,
    }
  );
}

/**
 * Manually capture an exception with optional extra context.
 * This sends a single signal directly to the ingest endpoint.
 */
export async function captureException(error, context = {}) {
  if (typeof window === "undefined") return;

  const cfg = window.BUG_TRACKER_CONFIG || {};
  const endpoint = cfg.endpoint || DEFAULT_ENDPOINT;

  const payload = {
    type: "JS_RUNTIME_ERROR",
    message: error?.message || String(error),
    stack: error?.stack || "",
    url: window.location.href,
    severity: "High",
    ...context,
  };

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cfg.apiKey ? { "X-API-Key": cfg.apiKey } : {}),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // swallow – we never want bug reporting to crash the app
  }
}

/**
 * Generic custom event capture helper.
 */
export async function trackBugEvent(type, payload = {}) {
  if (typeof window === "undefined") return;

  const cfg = window.BUG_TRACKER_CONFIG || {};
  const endpoint = cfg.endpoint || DEFAULT_ENDPOINT;

  const body = {
    type,
    url: window.location.href,
    severity: payload.severity || "Low",
    ...payload,
  };

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cfg.apiKey ? { "X-API-Key": cfg.apiKey } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    // ignore transport failures
  }
}

