import { useEffect } from "react";
import { useLocation } from "react-router-dom";

type AnalyticsProps = {
  /**
   * Enables analytics collection even when the app is not running in a production build.
   * Useful when you want to verify analytics behaviour locally.
   */
  debug?: boolean;
};

const ANALYTICS_SCRIPT_ID = "vercel-analytics-script";
const ANALYTICS_SCRIPT_SRC = "/_vercel/insights/script.js";

const isBrowser = () => typeof window !== "undefined" && typeof document !== "undefined";

const shouldEnableAnalytics = (debug?: boolean) => (import.meta.env.PROD || Boolean(debug)) && isBrowser();

declare global {
  interface Window {
    va?: ((event: string, payload?: Record<string, unknown>) => void) & {
      q?: unknown[][];
    };
    vaq?: unknown[][];
  }
}

const bootstrapQueue = () => {
  if (!isBrowser()) {
    return;
  }

  if (typeof window.va === "function") {
    return;
  }

  const queue: unknown[][] = [];
  const va = ((...args: unknown[]) => {
    queue.push(args);
  }) as Window["va"];

  va.q = queue;
  window.va = va;
  window.vaq = queue;
};

const ensureScript = () => {
  if (!isBrowser()) {
    return;
  }

  if (document.getElementById(ANALYTICS_SCRIPT_ID)) {
    return;
  }

  const script = document.createElement("script");
  script.id = ANALYTICS_SCRIPT_ID;
  script.defer = true;
  script.src = ANALYTICS_SCRIPT_SRC;
  script.setAttribute("data-collect-dnt", "true");
  document.head.appendChild(script);
};

const trackPageview = (url: string) => {
  if (!isBrowser()) {
    return;
  }

  const tracker = window.va;
  if (typeof tracker === "function") {
    tracker("pageview", {
      url,
      title: document.title,
    });
  }
};

export function Analytics({ debug }: AnalyticsProps = {}) {
  const location = useLocation();
  const enabled = shouldEnableAnalytics(debug);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    bootstrapQueue();
    ensureScript();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    bootstrapQueue();
    ensureScript();
    trackPageview(`${location.pathname}${location.search}${location.hash}`);
  }, [enabled, location.hash, location.pathname, location.search]);

  return null;
}

export default Analytics;
