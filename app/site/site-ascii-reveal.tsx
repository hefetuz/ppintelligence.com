'use client';

import { useEffect } from 'react';
import { createAsciiReveal, type AsciiRevealController } from 'ascii-reveal/core';
import { SITE_ASCII_SETTINGS } from '../ascii-reveal-settings';
import './site-ascii-reveal.css';

const SURFACES = '.company-value,.work-phases__stage,.audience-card,.blog-featured__items article,.blog-archive__row,.contact-editorial__intro,.contact-editorial__message';
const TARGETS = 'h1,h2,h3,h4,h5,h6,p,span,a,button,label,legend,dt,dd,li,img,svg,canvas,input,select,textarea,' + SURFACES;
const SKIP = '.hero,.site-header,.podcast-announcement,.mobile-navigation,.ar-overlay,.hero-intro-canvas,.clockwork-canvas,.warm-depth-canvas,[aria-hidden="true"],script,style,[data-ascii="skip"]';
type Group = { root: HTMLElement; id: string; state: 'waiting' | 'queued' | 'running' | 'complete'; controller?: AsciiRevealController; restorePosition?: () => void };

/** One-shot, viewport-scoped reveals. The library owns the drawing and clock;
 * at most two reveals run together, and finished canvases are released. */
export function SiteAsciiReveal() {
  useEffect(() => {
    const root = document.getElementById('top');
    if (!root) return;
    const main = root.querySelector<HTMLElement>('main[data-ascii-boot]');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const groups = new Map<HTMLElement, Group>();
    const marked = new Set<HTMLElement>();
    const pending: Group[] = [];
    let disposed = false, started = false, paused = false, active = 0;
    root.dataset.siteAscii = 'ready';
    const visible = (element: HTMLElement) => {
      if (element.closest('[inert],[aria-hidden="true"]')) return false;
      let insideRoot = true;
      for (let parent: HTMLElement | null = element; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (!parent.hasAttribute('data-site-ascii-pending') && (style.display === 'none' || Number(style.opacity) < 0.01)) return false;
        if (parent === root) insideRoot = false;
        if (insideRoot && ((style.visibility === 'hidden' && !parent.closest('[data-site-ascii-pending]')) || style.display === 'none' || Number(style.opacity) < .05)) return false;
      }
      const box = element.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < innerHeight;
    };
    const finish = (group: Group) => {
      group.controller?.destroy(); group.controller = undefined;
      for (const target of group.root.querySelectorAll<HTMLElement>(`[data-site-ascii-owner="${group.id}"]`)) delete target.dataset.siteAsciiPending;
      if (group.root.dataset.siteAsciiOwner === group.id) delete group.root.dataset.siteAsciiPending;
      // A focus/visibility cancellation can end the library run before it
      // clears its temporary hiding markers. Always restore owned content.
      for (const target of [group.root, ...group.root.querySelectorAll<HTMLElement>('[data-ar-t],[data-ar-tc],[data-ar-m],[data-ar-s],[data-ar-f],[data-ar-pending]')]) {
        if (target.closest<HTMLElement>('[data-site-ascii-owner]')?.dataset.siteAsciiOwner !== group.id) continue;
        for (const attribute of ['data-ar-t','data-ar-tc','data-ar-m','data-ar-s','data-ar-f','data-ar-pending']) target.removeAttribute(attribute);
        target.style.removeProperty('--ar-o');
      }
      group.restorePosition?.(); group.restorePosition = undefined;
      group.state = 'complete';
      group.root.dataset.asciiRevealState = 'complete';
    };
    const pump = () => {
      if (disposed || paused || reduced.matches || document.hidden) return;
      while (active < 2 && pending.length) {
        const group = pending.shift()!;
        if (group.state !== 'queued') continue;
        if (!visible(group.root)) { group.state = 'waiting'; continue; }
        group.state = 'running'; active++;
        group.root.dataset.asciiRevealState = 'running';
        // Hand initial CSS hiding directly to the library in this same task;
        // the browser never paints loaded content between the two states.
        for (const target of [group.root, ...group.root.querySelectorAll<HTMLElement>(`[data-site-ascii-owner="${group.id}"]`)]) {
          if (target.dataset.siteAsciiOwner === group.id) delete target.dataset.siteAsciiPending;
        }
        // The library positions its canvas relative to a static host. Clear
        // dormant sticky offsets first, then restore the host on completion.
        if (getComputedStyle(group.root).position === 'static') {
          const properties = ['position','top','right','bottom','left'] as const;
          const saved = properties.map(property => [property, group.root.style[property]] as const);
          for (const property of properties.slice(1)) group.root.style[property] = 'auto';
          group.restorePosition = () => { for (const [property, value] of saved) group.root.style[property] = value; };
        }
        const selector = `[data-site-ascii-owner="${group.id}"]`;
        group.controller = createAsciiReveal(group.root, {
          ...SITE_ASCII_SETTINGS, lazy: false, selector,
          media: `[data-site-ascii-media][data-site-ascii-owner="${group.id}"]`,
          fades: `input${selector},select${selector},textarea${selector}`,
          surfaces: '[data-site-ascii-surface]',
        });
        void group.controller.reveal().catch(() => {}).finally(() => {
          finish(group); active--; pump();
        });
      }
    };
    const queue = (group: Group) => {
      if (group.state !== 'waiting' || !visible(group.root)) return;
      group.state = 'queued'; pending.push(group); pump();
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        const group = groups.get(entry.target as HTMLElement);
        if (group) queue(group);
      }
    }, { threshold: 0, rootMargin: '0px' });
    const scan = () => {
      // Late scene setup can leave section-owned groups in the founder scene.
      // Reassign them once to the bounded portrait/copy container.
      for (const [scope, group] of groups) {
        if (!scope.closest('.founder-stage[data-founder-reveal="true"]') || scope.matches('.founder-spread')) continue;
        finish(group);
        groups.delete(scope);
        for (const target of marked) {
          if (target.dataset.siteAsciiOwner !== group.id) continue;
          marked.delete(target);
          delete target.dataset.siteAsciiOwner;
          delete target.dataset.siteAsciiMedia;
          delete target.dataset.siteAsciiSurface;
          delete target.dataset.siteAsciiPending;
        }
      }
      const scopes = [root, ...document.querySelectorAll<HTMLElement>('.mobile-navigation,.contact-booking-dialog')];
      for (const container of scopes) for (const target of container.querySelectorAll<HTMLElement>(TARGETS)) {
        if (marked.has(target) || target.closest(SKIP)) continue;
        // Homepage scene transitions have a reusable owner, not this one-shot queue.
        if (root.classList.contains('site-home') && target.closest('.coin-expertise,#audience,.founder-spread,.site-footer')) continue;
        const founderReveal = target.closest<HTMLElement>('.founder-stage[data-founder-reveal="true"]');
        // Decorative full-screen clouds/sky stay ordinary cached images. Only
        // the bounded portrait and copy enter the existing ASCII queue.
        if (founderReveal && (!target.closest('.founder-spread') || target.matches('.founder-cloud-foreground'))) continue;
        // Parent copy owns its inline links; do not reveal the same text twice.
        if (!target.matches('input,select,textarea,img,svg,canvas') && target.parentElement?.closest('p,a,button,label,legend,dt,dd')) continue;
        const scope = (founderReveal ? target.closest<HTMLElement>('.founder-spread') : null)
          ?? target.closest<HTMLElement>('article,form,section,header,footer,nav,aside') ?? container;
        let group = groups.get(scope);
        // Content inserted by a filter is a fresh reveal, not a replay of the page.
        if (group?.state === 'complete') { groups.delete(scope); group = undefined; }
        if (!group) {
          group = {root:scope,id:`site-${++sequence}`,state:'waiting'};
          groups.set(scope,group); observer.observe(scope);
        }
        target.dataset.siteAsciiOwner = group.id;
        if (group.state === 'waiting' || group.state === 'queued') target.dataset.siteAsciiPending = '';
        if (target.matches('img,svg,canvas')) target.dataset.siteAsciiMedia = '';
        if (target.matches(SURFACES)) target.dataset.siteAsciiSurface = '';
        marked.add(target);
      }
      if (main) main.dataset.asciiBoot = 'ready';
      for (const group of groups.values()) queue(group);
    };
    const begin = async () => {
      if (started || disposed || root.dataset.entrance === 'intro') return;
      started = true;
      await document.fonts.ready;
      if (!disposed) {
        if (reduced.matches) { if (main) main.dataset.asciiBoot = 'ready'; }
        else scan();
      }
    };
    let mutationQueued = false;
    const mutations = new MutationObserver(records => {
      if (!started) { void begin(); return; }
      if (mutationQueued || !records.some(record => Array.from(record.addedNodes).some(node => node instanceof HTMLElement && !node.closest('.ar-overlay')))) return;
      mutationQueued = true;
      queueMicrotask(() => { mutationQueued = false; if (!disposed) scan(); });
    });
    mutations.observe(document.body, {childList:true,subtree:true,attributes:true,attributeFilter:['data-entrance']});
    const stop = () => { pending.length = 0; for (const group of groups.values()) finish(group); };
    const motion = (event: Event) => {
      paused = !!(event as CustomEvent<{paused?:boolean}>).detail?.paused;
      if (paused) stop(); else pump();
    };
    const onReduced = () => { if (reduced.matches) { stop(); if (main) main.dataset.asciiBoot = 'ready'; } else if (started) scan(); else void begin(); };
    const onFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      for (const group of groups.values()) if (group.root.contains(target) && group.state !== 'complete') finish(group);
    };
    let chapter = '';
    const chapterStory = root.querySelector<HTMLElement>('[data-clockwork-story]');
    const chapterFounder = root.querySelector<HTMLElement>('.founder-screen');
    const onChapter = () => {
      const next = `${Math.floor(Number(chapterStory?.dataset.progress ?? 0) * 20)}:${chapterFounder?.inert ?? false}`;
      if (next === chapter) return;
      chapter = next;
      scan();
    };
    const onVisibility = () => { if (document.hidden) stop(); else pump(); };
    // The scene emits a non-bubbling event; listen on its actual owner.
    chapterStory?.addEventListener('clockwork-progress', onChapter);
    document.addEventListener('site-motion-change', motion);
    document.addEventListener('focusin', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    reduced.addEventListener('change', onReduced);
    void begin();
    return () => {
      disposed = true; observer.disconnect(); mutations.disconnect(); stop();
      chapterStory?.removeEventListener('clockwork-progress', onChapter);
      document.removeEventListener('site-motion-change', motion);
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      reduced.removeEventListener('change', onReduced);
      for (const target of marked) { delete target.dataset.siteAsciiOwner; delete target.dataset.siteAsciiMedia; delete target.dataset.siteAsciiSurface; delete target.dataset.siteAsciiPending; }
      if (main) main.dataset.asciiBoot = 'ready';
      delete root.dataset.siteAscii;
    };
  }, []);
  return null;
}
let sequence = 0;
