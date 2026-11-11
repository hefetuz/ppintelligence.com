'use client';

import { useEffect } from 'react';
import {
  createAsciiReveal,
  type AsciiRevealController,
} from 'ascii-reveal/core';
import './home-section-decode.css';

/** Replayable, exclusive copy ownership. The coin keeps its existing clock. */
export function HomeSectionDecode() {
  useEffect(() => {
    const home = document.querySelector<HTMLElement>('.site-home');
    const story = home?.querySelector<HTMLElement>('[data-clockwork-story]');
    if (!home || !story) return;
    const selectors = {
      hero: '.hero-title',
      strategy: '#strategy',
      risk: '#risk',
      economics: '#economics',
      audience: '#audience .audience-layout',
      footer: '.site-footer',
    } as const;
    type Id = keyof typeof selectors;
    type Scene = {
      id: Id;
      root: HTMLElement;
      position: string;
      priority: string;
    };
    const scenes = new Map<Id, Scene>();
    for (const [id, selector] of Object.entries(selectors)) {
      const root = home.querySelector<HTMLElement>(selector);
      if (root)
        scenes.set(id as Id, {
          id: id as Id,
          root,
          position: root.style.getPropertyValue('position'),
          priority: root.style.getPropertyPriority('position'),
        });
    }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let paused = story.dataset.animationPaused === 'true';
    let disposed = false,
      initialized = false,
      bypassed = false;
    let generation = 0;
    let desired: Scene | undefined;
    let shown: Scene | undefined;
    let controlled: Scene | undefined;
    let controller: AsciiRevealController | undefined;
    let instantScene: Scene | undefined;

    const release = () => {
      controller?.destroy();
      controller = undefined;
      if (controlled) {
        // Cancelled hides can leave library markers behind. Focus and motion
        // preference changes must restore the real content in this same task.
        for (const target of [controlled.root, ...controlled.root.querySelectorAll<HTMLElement>('[data-ar-t],[data-ar-tc],[data-ar-m],[data-ar-s],[data-ar-f],[data-ar-pending]')]) {
          for (const attribute of ['data-ar-t', 'data-ar-tc', 'data-ar-m', 'data-ar-s', 'data-ar-f', 'data-ar-pending']) target.removeAttribute(attribute);
          target.style.removeProperty('--ar-o');
        }
        if (controlled.position)
          controlled.root.style.setProperty(
            'position',
            controlled.position,
            controlled.priority,
          );
        else controlled.root.style.removeProperty('position');
      }
      controlled = undefined;
    };
    const clear = () => {
      generation++;
      release();
      for (const scene of scenes.values()) delete scene.root.dataset.homeDecode;
    };
    const showImmediately = (target: HTMLElement) => {
      if (paused || reduced.matches || story.dataset.enhanced !== 'true') {
        clear();
        instantScene = undefined;
        return;
      }
      const scene = [...scenes.values()].find(scene => scene.root.contains(target) || target.contains(scene.root));
      if (!scene) return;
      generation++;
      release();
      instantScene = desired = shown = scene;
      initialized = true;
      bypassed = false;
      for (const item of scenes.values()) item.root.dataset.homeDecode = item === scene ? 'active' : 'hidden';
    };
    const focus = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement) showImmediately(event.target);
    };
    // The navigation owner emits this before focusing a destination that may
    // still be hidden by the outgoing scene's decode.
    const keyboardNavigation = (event: Event) => {
      const target = (event as CustomEvent<{ target?: HTMLElement }>).detail?.target;
      if (target instanceof HTMLElement) showImmediately(target);
    };
    const owner = () => {
      const progress = Number(story.dataset.progress ?? 0);
      const footer = scenes.get('footer');
      // Service frames do not need an additional geometry read after scene writes.
      const box = progress >= .94 ? footer?.root.getBoundingClientRect() : undefined;
      if (box && box.top < innerHeight * 0.45 && box.bottom > 0) return footer;
      if (progress >= 0.965 && story.getBoundingClientRect().bottom > 0) return scenes.get('audience');
      // Keep the coin assembly/docking interlude free of service copy.
      if (progress >= 0.87) return undefined;
      if (progress < 0.1) return scenes.get('hero');
      const beat = story.dataset.beat;
      if (beat === 'strategy') return scenes.get('strategy');
      if (beat === 'risk') return scenes.get('risk');
      if (beat === 'invitation' || beat === 'economics')
        return scenes.get('economics');
      return undefined;
    };
    const animate = async (
      scene: Scene,
      direction: 'hide' | 'reveal',
      run: number,
    ) => {
      if (scene.id === 'hero') return;
      if (disposed || run !== generation) return;
      try {
        controlled = scene;
        controller = createAsciiReveal(scene.root, {
          preset: 'decode',
          duration: 'fast',
          speed: 1.6,
          origin: 'center',
          lazy: false,
          fallback: true,
          // Full-screen atmospheric layers and static fallback instruments are
          // outside these bounded media selectors; they keep their own motion.
          media: '[data-home-decode-media]',
          surfaces: '[data-home-decode-surface]',
          fades: '[data-home-decode-fade]',
        });
        await controller[direction]();
      } catch {
        // Rich content remains usable if a canvas/font cannot be sampled.
      } finally {
        if (run === generation) release();
      }
    };
    const transition = (next: Scene | undefined) => {
      generation++;
      release();
      const run = generation;
      const previous = shown;
      desired = next;
      for (const scene of scenes.values())
        scene.root.dataset.homeDecode = 'hidden';
      if (next) next.root.dataset.homeDecode = 'pending';
      const delegated =
        false;
      const move = async () => {
        if (previous && previous !== next && !delegated) {
          previous.root.dataset.homeDecode = 'exiting';
          await animate(previous, 'hide', run);
          if (disposed || run !== generation) return;
          previous.root.dataset.homeDecode = 'hidden';
        }
        if (disposed || run !== generation) return;
        shown = next;
        if (!next) return;
        next.root.dataset.homeDecode = 'entering';
        await animate(next, 'reveal', run);
        if (disposed || run !== generation) return;
        next.root.dataset.homeDecode = 'active';
      };
      void move();
    };
    const render = () => {
      if (disposed) return;
      const next = owner();
      const intro = home.dataset.entrance === 'intro';
      if (
        intro ||
        reduced.matches ||
        paused ||
        document.hidden ||
        story.dataset.enhanced !== 'true'
      ) {
        clear();
        instantScene = undefined;
        desired = shown = next;
        bypassed = true;
        return;
      }
      if (instantScene && next === instantScene) return;
      instantScene = undefined;
      if (!initialized || bypassed) {
        const first = !initialized;
        initialized = true;
        bypassed = false;
        // The first hero copy entrance belongs to its existing intro effect.
        if (!first || next?.id === 'hero') {
          desired = shown = next;
          for (const scene of scenes.values())
            scene.root.dataset.homeDecode =
              scene === next ? 'active' : 'hidden';
          return;
        }
        desired = shown = undefined;
      }
      if (next === desired) return;
      transition(next);
    };
    const motion = (event: Event) => {
      paused = Boolean(
        (event as CustomEvent<{ paused?: boolean }>).detail?.paused,
      );
      render();
    };
    const entrance = new MutationObserver(render);
    entrance.observe(home, {
      attributes: true,
      attributeFilter: ['data-entrance'],
    });
    story.addEventListener('clockwork-progress', render);
    story.addEventListener('clockwork-keyboard-navigation', keyboardNavigation);
    window.addEventListener('scroll', render, { passive: true });
    window.addEventListener('resize', render, { passive: true });
    document.addEventListener('visibilitychange', render);
    document.addEventListener('site-motion-change', motion);
    document.addEventListener('focusin', focus);
    reduced.addEventListener('change', render);
    render();
    return () => {
      disposed = true;
      entrance.disconnect();
      story.removeEventListener('clockwork-progress', render);
      story.removeEventListener('clockwork-keyboard-navigation', keyboardNavigation);
      window.removeEventListener('scroll', render);
      window.removeEventListener('resize', render);
      document.removeEventListener('visibilitychange', render);
      document.removeEventListener('site-motion-change', motion);
      document.removeEventListener('focusin', focus);
      reduced.removeEventListener('change', render);
      clear();
    };
  }, []);
  return null;
}
