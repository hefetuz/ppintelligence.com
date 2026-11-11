import { EmployerLogo } from './employer-logo';

export function ContactCareerMarquee({ career }: { career: readonly string[] }) {
  if (!career.length) return null;

  return (
    <div className="contact-editorial__experience contact-profile__experience" data-ascii="skip">
      <div className="contact-profile__marquee">
        <div className="contact-profile__logo-track">
          {[0, 1].map(copy => (
            <ul key={copy} className="contact-profile__logo-group"
              aria-label={copy === 0 ? 'Deniz Tudor’s previous employers' : undefined}
              aria-hidden={copy === 1 ? true : undefined}>
              {career.map(name => <li key={name}><EmployerLogo name={name} /></li>)}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
