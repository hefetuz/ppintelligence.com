type CalendlyWidget = { initPopupWidget(options: { url: string }): void };
type CalendlyWindow = Window & { Calendly?: CalendlyWidget };
let pending: Promise<CalendlyWidget> | undefined;

/** Load the provider's own popup only when a visitor intends to book. */
export function prepareCalendlyPopup(): Promise<CalendlyWidget> {
  if (pending) return pending;
  pending = new Promise<CalendlyWidget>((resolve, reject) => {
    const script = document.createElement('script');
    const style = document.createElement('link');
    const timeout = window.setTimeout(() => fail(), 12000);
    let scriptReady = false;
    let styleReady = false;
    const fail = () => {
      window.clearTimeout(timeout);
      script.remove();
      style.remove();
      reject(new Error('Calendly could not load.'));
    };
    const ready = () => {
      const widget = (window as CalendlyWindow).Calendly;
      if (scriptReady && styleReady && widget) {
        window.clearTimeout(timeout);
        resolve(widget);
      }
    };
    style.rel = 'stylesheet';
    style.href = 'https://assets.calendly.com/assets/external/widget.css';
    style.onload = () => { styleReady = true; ready(); };
    style.onerror = fail;
    script.async = true;
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.onload = () => { scriptReady = true; ready(); };
    script.onerror = fail;
    document.head.appendChild(style);
    document.head.appendChild(script);
  }).catch(error => {
    pending = undefined;
    throw error;
  });
  return pending;
}

export async function openCalendlyPopup(url: string, trigger?: HTMLElement) {
  if (!url) throw new Error('Scheduling is unavailable.');
  const widget = await prepareCalendlyPopup();
  widget.initPopupWidget({ url });
  // Keep the provider's UI, while giving its div-based close control a name
  // and keyboard access. Restore the invoking control when it is dismissed.
  const overlay = document.querySelector<HTMLElement>('.calendly-overlay');
  const close = overlay?.querySelector<HTMLElement>('.calendly-popup-close');
  if (!overlay || !close) return;
  const returnFocus = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const root = document.getElementById('root');
  const wasInert = root?.inert ?? false;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Schedule a call with Deniz Tudor');
  close.setAttribute('role', 'button');
  close.setAttribute('aria-label', 'Close scheduling');
  close.tabIndex = 0;
  close.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      close.click();
    }
  });
  const onEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close.click();
  };
  document.addEventListener('keydown', onEscape);
  if (root) root.inert = true;
  close.focus();
  const observer = new MutationObserver(() => {
    if (overlay.isConnected) return;
    observer.disconnect();
    document.removeEventListener('keydown', onEscape);
    if (root) root.inert = wasInert;
    returnFocus?.focus({ preventScroll: true });
  });
  observer.observe(document.body, { childList: true });
}
