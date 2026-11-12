'use client';
import { useEffect, useRef, useState } from 'react';
import { NEWSLETTER_DELAY, NEWSLETTER_DISMISSED, NEWSLETTER_SEEN, shouldOfferNewsletter } from './newsletter-policy.mjs';
import './insights-newsletter.css';

// Covers client-side revisits when browser storage is unavailable.
let offeredThisSession = false;

export function InsightsNewsletter() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (offeredThisSession) return;
    try {
      if (!shouldOfferNewsletter({ seen: sessionStorage.getItem(NEWSLETTER_SEEN), dismissedAt: localStorage.getItem(NEWSLETTER_DISMISSED) })) return;
    } catch { /* Still offer once in memory if storage is blocked. */ }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      if (document.visibilityState !== 'visible' || offeredThisSession) return;
      timer = setTimeout(() => {
        // Avoid competing with another modal, or interrupting someone typing.
        const focused = document.activeElement;
        if (document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]') ||
          focused?.matches('input, textarea, select, [contenteditable="true"]')) return;
        offeredThisSession = true;
        try { sessionStorage.setItem(NEWSLETTER_SEEN, '1'); } catch { /* Memory fallback above. */ }
        setOpen(true);
      }, NEWSLETTER_DELAY);
    };
    schedule();
    document.addEventListener('visibilitychange', schedule);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', schedule); };
  }, []);

  useEffect(() => {
    if (!open || !dialog.current) return;
    const element = dialog.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open]);

  const dismiss = () => {
    try { localStorage.setItem(NEWSLETTER_DISMISSED, String(Date.now())); } catch { /* Session suppression remains. */ }
    setOpen(false);
  };
  return <dialog ref={dialog} className="insights-newsletter" data-ascii="skip" aria-labelledby="newsletter-heading" aria-describedby="newsletter-description"
    onCancel={event => { event.preventDefault(); dismiss(); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dismiss();
    }}>
    {open && <>
      <div className="insights-newsletter__top"><span>DENIZ TUDOR ON SUBSTACK</span><button type="button" onClick={dismiss} autoFocus>Close</button></div>
      <header><h2 id="newsletter-heading">Writing, delivered.</h2><p id="newsletter-description">Perspectives on business, risk and change. Get Deniz’s latest writing in your inbox.</p></header>
      <iframe src="https://deniztudor.substack.com/embed" title="Subscribe to Deniz Tudor on Substack" className="insights-newsletter__embed" />
      <footer><span>Subscriptions are handled by Substack.</span><a href="https://deniztudor.substack.com/subscribe" target="_blank" rel="noopener noreferrer">Open on Substack</a></footer>
    </>}
  </dialog>;
}
