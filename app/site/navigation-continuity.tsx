'use client';
import { useEffect } from 'react';

/** Ordinary links retain browser navigation, history and document transitions. */
export function NavigationContinuity() {
  useEffect(() => {
    const remember = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
      if (!link || link.target || link.hasAttribute('download')) return;
      const destination = new URL(link.href, location.href);
      if (destination.origin !== location.origin || destination.pathname !== '/' || location.pathname === '/') return;
      try { sessionStorage.setItem('ppi-home-navigation', String(Date.now())); } catch {}
    };
    document.addEventListener('click', remember, true);
    return () => document.removeEventListener('click', remember, true);
  }, []);
  return null;
}
