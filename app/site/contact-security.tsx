'use client';
import { useEffect, useRef, useState } from 'react';
import config from '../../.generated/site-config.json';
type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}
let scriptPromise: Promise<void> | undefined;
function loadSecurity() {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise)
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = undefined;
        script.remove();
        reject(new Error('Security check unavailable'));
      };
      document.head.appendChild(script);
    });
  return scriptPromise;
}
export function ContactSecurity({
  onToken,
  attempt,
}: {
  onToken: (token: string) => void;
  attempt: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!config.turnstileSiteKey) return;
    let cancelled = false,
      widget: string | undefined;
    setFailed(false);
    void loadSecurity()
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return;
        widget = window.turnstile.render(container.current, {
          sitekey: config.turnstileSiteKey,
          action: 'contact',
          theme: 'light',
          callback: onToken,
          'expired-callback': () => onToken(''),
          'error-callback': () => {
            onToken('');
            setFailed(true);
          },
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (widget) window.turnstile?.remove(widget);
    };
  }, [attempt, onToken]);
  return (
    <>
      <div ref={container} />
      {failed && (
        <p role="status">
          The security check could not load. Please refresh or use the email
          link below.
        </p>
      )}
    </>
  );
}
