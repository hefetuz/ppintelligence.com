'use client';
import { useEffect, useState } from 'react';
import config from '../../.generated/site-config.json';
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
const enabled = config.indexable && !!config.googleAnalyticsId;
const preferenceKey = 'ppi-analytics';
export function trackEvent(
  name: 'contact_submitted' | 'booking_opened' | 'booking_completed',
) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    if (localStorage.getItem(preferenceKey) === 'accepted')
      window.gtag?.('event', name);
  } catch {
    /* Storage may be disabled. */
  }
}
function enableAnalytics() {
  if (!enabled) return;
  window.dataLayer ??= [];
  window.gtag ??= function (..._args: unknown[]) {
    window.dataLayer?.push(arguments);
  };
  window.gtag('consent', 'update', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  if (document.getElementById('ppi-analytics-script')) return;
  window.gtag('js', new Date());
  window.gtag('config', config.googleAnalyticsId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: location.origin + location.pathname,
    page_referrer: document.referrer ? new URL(document.referrer).origin : '',
  });
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${config.googleAnalyticsId}`;
  script.async = true;
  script.id = 'ppi-analytics-script';
  document.head.appendChild(script);
}
export function AnalyticsConsent() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    try {
      const preference = localStorage.getItem(preferenceKey);
      if (preference === 'accepted') enableAnalytics();
      else if (!preference) setShow(true);
    } catch {
      setShow(true);
    }
    const booking = (event: MessageEvent) => {
      if (
        event.origin !== 'https://calendly.com' ||
        event.data?.event !== 'calendly.event_scheduled'
      )
        return;
      const frame = document.querySelector<HTMLIFrameElement>(
        '.contact-calendar-frame iframe',
      );
      if (frame?.contentWindow === event.source)
        trackEvent('booking_completed');
    };
    window.addEventListener('message', booking);
    return () => window.removeEventListener('message', booking);
  }, []);
  if (!enabled) return null;
  const choose = (accepted: boolean) => {
    try {
      localStorage.setItem(preferenceKey, accepted ? 'accepted' : 'declined');
    } catch {
      /* Choice remains effective for this visit. */
    }
    if (accepted) enableAnalytics();
    else if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
      });
      for (const cookie of document.cookie.split(';')) {
        const name = cookie.trim().split('=')[0];
        if (name === '_ga' || name.startsWith('_ga_')) {
          document.cookie = `${name}=;Max-Age=0;Path=/`;
          document.cookie = `${name}=;Max-Age=0;Path=/;Domain=.${location.hostname}`;
        }
      }
      document.getElementById('ppi-analytics-script')?.remove();
    }
    setShow(false);
  };
  return (
    <>
      {show && (
        <aside className="analytics-choice" aria-label="Optional analytics">
          <p>
            May we use optional analytics to understand visits? Your name, email
            and message are never sent to analytics.
          </p>
          <div>
            <button type="button" onClick={() => choose(false)}>
              Decline
            </button>
            <button type="button" onClick={() => choose(true)}>
              Accept analytics
            </button>
          </div>
        </aside>
      )}
      <button
        type="button"
        className="analytics-preferences"
        onClick={() => setShow(true)}
      >
        Analytics preferences
      </button>
    </>
  );
}
