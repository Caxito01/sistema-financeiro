export let sentryLoaded = false;
let Sentry: any = null;

export async function initMonitor() {
  // Monitor initialization disabled for now
  // Sentry is optional and not installed
  sentryLoaded = false;
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
