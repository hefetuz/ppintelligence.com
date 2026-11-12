'use client';
import { useEffect, useRef, useState } from 'react';
import { contact } from './content';
import { ContactSecurity } from './contact-security';
import { trackEvent } from './analytics';
import config from '../../.generated/site-config.json';

type RequiredField = HTMLInputElement | HTMLTextAreaElement;
function fieldError(field: RequiredField) {
  const value = field.value.trim();
  if (!value) {
    if (field.name === 'name') return 'Enter your name.';
    if (field.name === 'email') return 'Enter your work email address.';
    return 'Add a little context about what you would like to discuss.';
  }
  if (field.name === 'email' && (!field.validity.valid || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value)))
    return 'Enter an email address in the format name@example.com.';
  if (field.maxLength > 0 && value.length > field.maxLength)
    return `Use ${field.maxLength} characters or fewer.`;
  return '';
}

export function ContactMessageForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle',
  );
  const [error, setError] = useState('');
  // Keep the working email fallback until both live services are configured.
  const emailDraft = !(config.contactEndpoint && config.turnstileSiteKey);
  const [draftRequested, setDraftRequested] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [token, setToken] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [topic, setTopic] = useState('General enquiry');
  const [complete, setComplete] = useState(false);
  const busy = useRef(false);
  const submission = useRef({ fingerprint: '', id: '' });
  useEffect(() => {
    if (new URLSearchParams(location.search).get('topic') === 'speaking')
      setTopic('Speaking invitation');
  }, []);
  return (
    <form
      className="contact-message-form"
      noValidate
      aria-describedby={emailDraft ? 'message-delivery-note' : undefined}
      aria-busy={state === 'sending'}
      onInput={(event) => {
        const form = event.currentTarget;
        const required = Array.from(form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[required], textarea[required]'));
        const valid = required.every((field) => !fieldError(field));
        setComplete(valid);
        const changed = event.target;
        if (changed instanceof HTMLInputElement || changed instanceof HTMLTextAreaElement) {
          setFieldErrors((previous) => previous[changed.name]
            ? { ...previous, [changed.name]: fieldError(changed) }
            : previous);
        }
        setDraftRequested(false);
        if (state === 'sent') setState('idle');
      }}
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy.current) return;
        const form = event.currentTarget;
        const required = Array.from(form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[required], textarea[required]'));
        const nextErrors = Object.fromEntries(required.map((field) => [field.name, fieldError(field)]));
        setFieldErrors(nextErrors);
        const invalid = required.find((field) => nextErrors[field.name]);
        if (invalid) {
          setDraftRequested(false);
          requestAnimationFrame(() => invalid.focus());
          return;
        }
        if (emailDraft) {
          setError('');
          setState('idle');
          setDraftRequested(true);
          const draft = Object.fromEntries(new FormData(form).entries());
          const body = `Name: ${draft.name}\nEmail: ${draft.email}\nCompany: ${draft.company || 'Not provided'}\n\n${draft.message}`;
          location.href = `mailto:${contact.email}?subject=${encodeURIComponent(String(draft.topic))}&body=${encodeURIComponent(body)}`;
          return;
        }
        if (!token) {
          setError('Please complete the security check before sending your message.');
          setState('error');
          return;
        }
        busy.current = true;
        const fields = Object.fromEntries(new FormData(form).entries());
        const fingerprint = JSON.stringify(fields);
        if (submission.current.fingerprint !== fingerprint)
          submission.current = { fingerprint, id: crypto.randomUUID() };
        setState('sending');
        setError('');
        try {
          const response = await fetch(config.contactEndpoint, {
            method: 'POST',
            credentials: 'omit',
            headers: {
              'Content-Type': 'application/json',
              'Idempotency-Key': submission.current.id,
            },
            body: JSON.stringify({ ...fields, token }),
            signal: AbortSignal.timeout(25000),
          });
          const result = (await response.json().catch(() => ({}))) as {
            accepted?: boolean;
            error?: string;
          };
          if (!response.ok || result.accepted !== true)
            throw new Error(
              result.error ||
                'Your message could not be submitted.',
            );
          setState('sent');
          trackEvent('contact_submitted');
          form.reset();
          setComplete(false);
          setTopic('General enquiry');
          submission.current = { fingerprint: '', id: '' };
        } catch (failure) {
          setState('error');
          setError(
            failure instanceof Error && failure.name !== 'TimeoutError'
              ? failure.message
              : 'The connection timed out.',
          );
        } finally {
          busy.current = false;
          setToken('');
          setAttempt((value) => value + 1);
        }
      }}
    >
      <h2>Tell us what’s on your mind.</h2>
      <p className="contact-message-required-note">Fields marked * are required.</p>
      {emailDraft && <p id="message-delivery-note" className="contact-message-delivery-note">This form opens a draft in your email app. Review the draft and send it there.</p>}
      <label htmlFor="message-name">
        Name <span aria-hidden="true">*</span>
        <input
          id="message-name"
          name="name"
          autoComplete="name"
          required
          aria-invalid={fieldErrors.name ? true : undefined}
          aria-describedby={fieldErrors.name ? 'message-name-error' : undefined}
          maxLength={120}
        />
      </label>
      {fieldErrors.name && <p id="message-name-error" className="contact-message-field-error">{fieldErrors.name}</p>}
      <label htmlFor="message-email">
        Work email <span aria-hidden="true">*</span>
        <input
          id="message-email"
          name="email"
          type="email"
          autoComplete="email"
          spellCheck={false}
          required
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={fieldErrors.email ? 'message-email-error' : undefined}
          maxLength={254}
        />
      </label>
      {fieldErrors.email && <p id="message-email-error" className="contact-message-field-error">{fieldErrors.email}</p>}
      <label htmlFor="message-company">
        Company <span>(optional)</span>
        <input
          id="message-company"
          name="company"
          autoComplete="organization"
          maxLength={180}
        />
      </label>
      <label htmlFor="message-topic">
        What would you like to discuss?
        <select
          id="message-topic"
          name="topic"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
        >
          <option>General enquiry</option>
          <option>Business strategy</option>
          <option>Risk management</option>
          <option>Economic analysis</option>
          <option>Writing &amp; publications</option>
          <option>Speaking invitation</option>
        </select>
      </label>
      <label htmlFor="message-body">
        A little context <span aria-hidden="true">*</span>
        <textarea
          id="message-body"
          name="message"
          rows={5}
          required
          aria-invalid={fieldErrors.message ? true : undefined}
          aria-describedby={fieldErrors.message ? 'message-body-error' : undefined}
          maxLength={5000}
          placeholder="For example, we are reviewing the risks of entering a new market."
        />
      </label>
      {fieldErrors.message && <p id="message-body-error" className="contact-message-field-error">{fieldErrors.message}</p>}
      <div className="contact-message-trap" aria-hidden="true">
        <label htmlFor="message-website">
          Website
          <input
            id="message-website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>
      {!emailDraft && <ContactSecurity onToken={setToken} attempt={attempt} />}
      <button type="submit" data-complete={complete} aria-disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : emailDraft ? 'Open email draft' : 'Send message'}
      </button>
      <p className="contact-message-success" role="status" aria-atomic="true">
        {state === 'sent' ? 'Thank you. Your message has been submitted to Pretty Penny.' : draftRequested ? <>Review and send the draft in your email app. If no app opened, email <a href={`mailto:${contact.email}`}>{contact.email}</a>.</> : ''}
      </p>
      <p className="contact-message-error" role="alert" aria-atomic="true">
        {state === 'error' && <>{error} Your entries are still here. Try again, or email <a href={`mailto:${contact.email}`}>{contact.email}</a>.</>}
      </p>
    </form>
  );
}

