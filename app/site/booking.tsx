import type { ComponentProps } from 'react';
import { siteHref } from './links';

/** Every conversation CTA is ordinary same-tab navigation to the contact page. */
export function BookingLink({
  children,
  href: _href,
  target: _target,
  rel: _rel,
  ...props
}: ComponentProps<'a'>) {
  return (
    <a {...props} href={siteHref('/contact/')}>
      {children}
    </a>
  );
}
