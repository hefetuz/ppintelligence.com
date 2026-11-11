'use client';
import { useEffect } from 'react';

/** Reflect the visible scene without adding history entries or moving focus. */
export function HomeSectionAddress() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>('.site-home');
    const story = page?.querySelector<HTMLElement>('[data-clockwork-story]');
    if (!page || !story) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (page.dataset.entrance !== 'ready') return;
      const p = Number(story.dataset.progress || 0);
      const founder = page.querySelector<HTMLElement>('.founder-stage');
      const footer = page.querySelector<HTMLElement>('footer');
      const line = innerHeight * .45;
      let hash: string;
      if (footer && footer.getBoundingClientRect().top <= line) hash = '#footer';
      else if (founder && founder.getBoundingClientRect().top <= line && founder.getBoundingClientRect().bottom > line) hash = '#founder';
      else if (p >= .97 && story.getBoundingClientRect().bottom > line) hash = '#audience';
      else if (story.dataset.motion === 'reduced') {
        const sections = [...page.querySelectorAll<HTMLElement>('[data-section]')];
        const section = sections.filter(n => {const r=n.getBoundingClientRect(); return r.top<=line && r.bottom>line;}).at(-1);
        hash = section ? '#' + section.id : '#introduction';
      } else hash = p >= .97 ? '#audience' : p >= .755 ? '#economics' : p >= .605 ? '#risk' : p >= .43 ? '#strategy' : p >= .12 ? '#inside-the-penny' : '#introduction';
      if (location.hash !== hash) history.replaceState(history.state, '', location.pathname + location.search + hash);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', schedule, { passive: true });
    story.addEventListener('clockwork-progress', schedule);
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      story.removeEventListener('clockwork-progress', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);
  return null;
}
