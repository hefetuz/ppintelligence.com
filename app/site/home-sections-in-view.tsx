'use client';
import { useEffect } from 'react';
import { createAsciiReveal, type AsciiRevealController } from 'ascii-reveal/core';

/** Each editorial section reveals when it enters the viewport. */
export function HomeSectionsInView() {
  useEffect(() => {
    const roots = [...document.querySelectorAll<HTMLElement>('.site-home .founder-spread')];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const active = new Map<Element, AsciiRevealController>();
    let paused = document.querySelector<HTMLElement>('[data-clockwork-story]')?.dataset.animationPaused === 'true';
    const restore = (root: HTMLElement) => {
      active.get(root)?.destroy();
      active.delete(root);
      for (const target of [root, ...root.querySelectorAll<HTMLElement>('[data-ar-t],[data-ar-tc],[data-ar-m],[data-ar-s],[data-ar-f],[data-ar-pending]')]) {
        for (const attribute of ['data-ar-t', 'data-ar-tc', 'data-ar-m', 'data-ar-s', 'data-ar-f', 'data-ar-pending']) target.removeAttribute(attribute);
        target.style.removeProperty('--ar-o');
      }
    };
    const stop = () => { for (const root of roots) restore(root); };
    const preference = () => { if (reduced.matches) stop(); };
    const motion = (event: Event) => {
      paused = Boolean((event as CustomEvent<{ paused?: boolean }>).detail?.paused);
      if (paused) stop();
    };
    const focus = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      for (const root of roots) if (root.contains(target)) restore(root);
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const root = entry.target as HTMLElement;
        if (!entry.isIntersecting) { root.dataset.inView = 'false'; restore(root); continue; }
        root.dataset.inView = 'true';
        if (reduced.matches || paused) continue;
        const controller = createAsciiReveal(root, {preset:'decode', duration:'fast', speed:1.6, lazy:false, fallback:true, media:'.audience-card svg,.audience-card img', surfaces:'.audience-card,.audience-coin-frame', fades:'.audience-weave'});
        active.set(root, controller);
        void controller.reveal().catch(() => {}).finally(() => { if(active.get(root) === controller) { controller.destroy(); active.delete(root); } });
      }
    }, {threshold:0.15});
    for (const root of roots) observer.observe(root);
    reduced.addEventListener('change', preference);
    document.addEventListener('site-motion-change', motion);
    document.addEventListener('focusin', focus);
    return () => {
      observer.disconnect();
      reduced.removeEventListener('change', preference);
      document.removeEventListener('site-motion-change', motion);
      document.removeEventListener('focusin', focus);
      stop();
    };
  }, []);
  return null;
}
