/* oxlint-disable next/no-img-element -- Reuse the established self-hosted founder illustration. */
import { Mail, MessageSquareText } from '@/components/sharp-icons';
import {
  COMPANY_LINKEDIN,
  contact,
  founder,
  socialLinks,
} from './content';
import { assetUrl } from '../asset-url';
import { PageShell } from './page-shell';
import { ContactBooking } from './contact-booking';
import { ContactCareerMarquee } from './contact-career-marquee';
import { ContactMessageForm } from './contact-message-form';
import { ContactFaq } from './contact-faq';
import './contact-foundation.css';
import './contact-editorial.css';
export function ContactPage() {
  const socials = [
    {
      label: 'Pretty Penny on LinkedIn',
      href: COMPANY_LINKEDIN,
      icon: 'linkedin',
    },
    {
      label: 'Deniz on LinkedIn',
      href: socialLinks.personalLinkedIn,
      icon: 'linkedin',
    },
    { label: 'Deniz on X', href: socialLinks.x, icon: 'x' },
    { label: 'Substack', href: socialLinks.substack, icon: 'substack' },
  ].filter((item) => item.href);

  return (
    <PageShell active="/contact/" closing={false}>
      <div className="contact-editorial">
        <div className="contact-editorial__columns">
          <section
            className="contact-editorial__intro contact-profile"
            aria-labelledby="contact-heading"
          >
            <ContactCareerMarquee career={founder?.career ?? []} />
            <div className="contact-profile__portrait" id="schedule">
              <img
                src={assetUrl('assets/deniz/deniz-photo-cutout-v1.png')}
                alt={`${contact.participant}, portrait`}
                width={400}
                height={400}
              />
            </div>
            <div className="contact-profile__identity">
              <h1 id="contact-heading">{contact.participant}</h1>
              <p>{founder?.role ?? 'Founder, Pretty Penny Intelligence'}</p>
            </div>
            <div className="contact-profile__booking">
              <ContactBooking />
            </div>
          </section>
          <section
            className="contact-editorial__message"
            aria-label="Write to Pretty Penny"
          >
            <ContactMessageForm />
          </section>
        </div>
        <section
          className="contact-editorial__channels"
          aria-label="Contact details"
        >
          <div>
            <Mail size={23} strokeWidth={1.2} aria-hidden="true" />
            <h2>Email</h2>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </div>
          <div>
            <MessageSquareText size={23} strokeWidth={1.2} aria-hidden="true" />
            <h2>Social</h2>
            <ul className="contact-social-links">
              {socials.map((item) => (
                <li key={item.label}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    {item.icon === 'linkedin' ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M20.45 2H3.55C2.7 2 2 2.68 2 3.52v16.96C2 21.32 2.7 22 3.55 22h16.9c.85 0 1.55-.68 1.55-1.52V3.52C22 2.68 21.3 2 20.45 2ZM8 19H5V9h3v10ZM6.5 7.7a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5ZM19 19h-3v-5c0-1.2-.02-2.7-1.65-2.7S12.5 12.6 12.5 14v5h-3V9h2.88v1.37h.04A3.16 3.16 0 0 1 15.27 8.8C18.32 8.8 19 10.8 19 13.4V19Z" />
                      </svg>
                    ) : item.icon === 'x' ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l8.2-9.4L.8 2h6.5l4.5 6.8L18.9 2Zm-1.1 18h1.7L6.4 3.9H4.6L17.8 20Z" />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden="true"
                      >
                        <path d="M4 3h16M4 7h16M4 11h16v11l-8-5-8 5V11Z" />
                      </svg>
                    )}
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <ContactFaq />
      </div>
    </PageShell>
  );
}
