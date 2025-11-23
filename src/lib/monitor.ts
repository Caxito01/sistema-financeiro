export let sentryLoaded = false;
let Sentry: any = null;

export async function initMonitor() {
  if (typeof window === 'undefined') return;
  const dsn = (process.env.NEXT_PUBLIC_SENTRY_DSN as string) || '';
  if (!dsn) return;
  try {
    Sentry = await import('@sentry/browser');
    Sentry.init({ dsn });
    sentryLoaded = true;
    console.info('Monitor initialized (Sentry)');
  } catch (err) {
    // Sentry not installed or failed to load - fallback silently
    // eslint-disable-next-line no-console
    console.warn('Sentry not available (install @sentry/browser to enable).');
  }
}

export function captureException(err: unknown) {
  if (sentryLoaded && Sentry) {
    Sentry.captureException(err);
  } else if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
    // eslint-disable-next-line no-console
    console.error(err);
  }
}

export function captureMessage(msg: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (sentryLoaded && Sentry) {
    Sentry.captureMessage(msg, level);
  } else if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
    // eslint-disable-next-line no-console
    console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log'](msg);
  }
}
