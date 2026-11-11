'use client';
import { useState } from 'react';
import { trackEvent } from './analytics';
import { BOOKING_URL } from './content';
import { openCalendlyPopup, prepareCalendlyPopup } from './calendly-popup';
export function ContactBooking({
  label = 'Book a call',
  className = 'contact-book-call',
}: {
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  return <>
    <button type="button" className={className} disabled={loading} aria-busy={loading} aria-haspopup="dialog"
      onPointerEnter={() => { void prepareCalendlyPopup().catch(() => {}); }}
      onFocus={() => { void prepareCalendlyPopup().catch(() => {}); }}
      onClick={async event => {
        const trigger = event.currentTarget;
        setLoading(true);
        setFailed(false);
        try {
          await openCalendlyPopup(BOOKING_URL, trigger);
          trackEvent('booking_opened');
        } catch {
          setFailed(true);
        } finally {
          setLoading(false);
        }
      }}>{label}</button>
    <span className="sr-only" role="status">{loading ? 'Opening Calendly…' : ''}</span>
    {failed && <p className="contact-booking-error" role="status">Calendly could not open. <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">Open the scheduling page</a>.</p>}
  </>;
}
