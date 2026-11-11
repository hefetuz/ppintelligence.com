'use client';
import { AudienceSection } from './audience-section';
import { setMotionStyle, setMotionAttribute, setMotionText } from '../dom-updates';

/* oxlint-disable next/no-img-element -- Authored transparent WebP fallback art is already sized and optimized offline. */
import { warmHeroStage } from '../warm-hero-stage.mjs';
import {
  useEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import {
  CLOCKWORK_ANCHORS,
  clockworkNarrative,
  clockworkState,
  followScroll,
  clockworkLayout,
  clockPhase,
} from '../clockwork-model';
import {
  CHAPTERS,
  CHAPTER_ENTRY,
  CHAPTER_EXIT,
  createWheelState,
  getChapterStep,
  nearestChapterIndex,
  processWheel,
  type ChapterDirection,
} from '../clockwork-navigation';
import { assetUrl } from '../asset-url';
import {
  coinIllustrationStyle,
  coinIllustrationPaths,
  coinIllustrationPreviewHref,
  coinInstrumentFill,
} from '../coin-illustration-style';
import { BookingLink } from './booking';
import { COIN_EXPERTISE } from './coin-expertise';
import { founderTransitionState } from '../founder-transition-model';
import {
  audienceHandoffState,
  audienceFounderProgress,
  audienceBaseTravel,
} from '../audience-handoff-model';
import {
  audienceDockSurface,
  type DockSurfaceBox,
} from './audience-dock-surface';

const ADVANCE_EVENT = 'clockwork-advance';
const NAVIGATE_EVENT = 'clockwork-navigate';
const MOTION_TOGGLE_EVENT = 'clockwork-motion-toggle';
type AdvanceSource = 'scroll-link' | 'coin';
type AdvanceDetail = { source: AdvanceSource; input: 'keyboard' | 'pointer' };
type MotionToggleDetail = { paused: boolean };

export function requestClockworkAdvance(
  event: ReactMouseEvent<HTMLAnchorElement>,
  source: AdvanceSource,
) {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  event.preventDefault();
  event.currentTarget.dispatchEvent(
    new CustomEvent<AdvanceDetail>(ADVANCE_EVENT, {
      bubbles: true,
      detail: { source, input: event.detail === 0 ? 'keyboard' : 'pointer' },
    }),
  );
}
/** Used by the hero's pending deep link after the introduction finishes. */
export function navigateClockwork(hash: string) {
  if (['#founder', '#founder-heading'].includes(hash)) return false;
  if (
    CLOCKWORK_ANCHORS[hash] === undefined &&
    !(
      (hash === '#founder-heading' || hash === '#founder') &&
      document.querySelector('.founder-stage')?.getClientRects().length
    )
  )
    return false;
  window.dispatchEvent(
    new CustomEvent(NAVIGATE_EVENT, { detail: { hash, behavior: 'instant' } }),
  );
  return true;
}
function reportCoinPointer(
  event: ReactPointerEvent<HTMLAnchorElement>,
  active: boolean,
) {
  event.currentTarget.dispatchEvent(
    new CustomEvent('hero-coin-pointer', {
      bubbles: true,
      detail: {
        clientX: event.clientX,
        clientY: event.clientY,
        active,
        pointerType: event.pointerType,
      },
    }),
  );
}
function syncClockworkMotionState(el: HTMLElement, paused: boolean) {
  el.dataset.animationPaused = String(paused);
  const button = el.querySelector<HTMLButtonElement>(
    '.clockwork-motion-toggle',
  );
  if (button) {
    setMotionAttribute(button, 'aria-pressed', String(paused));
    setMotionAttribute(button, 'aria-label', paused ? 'Play motion' : 'Pause motion');
  }
}

export function ClockworkStory({
  intro,
  animate = true,
  heroStyle,
  children,
}: {
  intro: boolean;
  animate?: boolean;
  heroStyle?: 'warm';
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const animateRef = useRef(animate);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const style = coinIllustrationStyle(window.location.search);
    const fill = coinInstrumentFill(window.location.search);
    el.dataset.coinStyle = style;
    el.dataset.coinFill = fill;
    const paths = coinIllustrationPaths(style);
    for (const figure of el.querySelectorAll<HTMLImageElement>(
      '.clockwork-static-figure',
    )) {
      const layer = figure.closest<HTMLElement>('[data-clockwork-panel]')
        ?.dataset.clockworkPanel;
      const id =
        layer === 'risk'
          ? 'risk'
          : layer === 'economics' || layer === 'invitation'
            ? 'analysis'
            : 'strategy';
      figure.src = assetUrl(
        style === 'anatomy'
          ? `illustrations/coin-systems-v2/${fill === 'outline' ? 'outline/' : ''}${id}-rest.webp`
          : layer === 'risk'
            ? `${paths.watch}/watch-rest.webp`
            : `${paths.calibre}/${id}-rest.webp`,
      );
    }
    const query = new URLSearchParams(window.location.search);
    if (!query.has('coin-style') && !query.has('coin-fill')) return;
    const previous = document.title;
    const previewTitle = `Pretty Penny · ${fill === 'outline' ? 'Outline' : style === 'combo' ? 'Combo' : style === 'hairline' ? 'Hairline' : 'Anatomy'} · Live preview`;
    document.title = previewTitle;
    const retain = (event: Event) => {
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>('a[href]')
          : null;
      if (!link || link.hasAttribute('download')) return;
      const href = link.getAttribute('href');
      if (!href) return;
      const next = coinIllustrationPreviewHref(
        href,
        window.location.href,
        document.baseURI,
      );
      if (next !== href) setMotionAttribute(link, 'href', next);
    };
    const events = ['pointerdown', 'focusin', 'click'];
    for (const event of events) document.addEventListener(event, retain, true);
    return () => {
      for (const event of events)
        document.removeEventListener(event, retain, true);
      if (document.title === previewTitle) document.title = previous;
    };
  }, []);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    el.dataset.layout = clockworkLayout(window.location.search);
    el.dataset.enhanced = 'true';
    let frame = 0,
      focusTimer = 0,
      focusFrame = 0,
      last = 0,
      snapTimer = 0,
      busyUntil = 0,
      lastDirection: ChapterDirection = 1;
    let wheelState = createWheelState();
    let touch: {
      x: number;
      y: number;
      progress: number;
      captured: boolean;
    } | null = null;
    let current = Number(el.dataset.progress || 0);
    let lastRawProgress = current;
    const panels = Array.from(
      el.querySelectorAll<HTMLElement>('[data-clockwork-panel]'),
    );
    const headings = panels.flatMap((panel) => {
      const heading = panel.querySelector<HTMLElement>('h3');
      return heading ? [{ panel, heading }] : [];
    });
    const measureHeadings = () => {
      for (const { panel, heading } of headings)
        setMotionStyle(panel,
          '--clock-heading-offset',
          `${(-heading.offsetHeight / 2).toFixed(2)}px`,
        );
      const invitation = panels.find(
        (panel) => panel.dataset.clockworkPanel === 'invitation',
      );
      if (invitation)
        setMotionStyle(el,
          '--clock-invitation-height',
          `${invitation.offsetHeight}px`,
        );
    };
    // Anchor the title's centre to its deck, independent of paragraph wrapping
    // or late font loading. The card's body remains in normal flow below it.
    const headingObserver = new ResizeObserver(measureHeadings);
    for (const { heading } of headings) headingObserver.observe(heading);
    for (const panel of panels)
      if (panel.dataset.clockworkPanel === 'invitation')
        headingObserver.observe(panel);
    measureHeadings();
    const sticky = el.querySelector<HTMLElement>('.clockwork-sticky');
    const discovery = el.querySelector<HTMLElement>('.clockwork-discovery');
    const heroTitle = el.querySelector<HTMLElement>('.hero-title');
    const booking = el.querySelector<HTMLElement>('.hero-booking');
    const explore = el.querySelector<HTMLElement>('.hero-scroll-link');
    const coin = el.querySelector<HTMLElement>('.hero-coin-link');
    const controls = el.querySelector<HTMLElement>(
      '.clockwork-chapter-controls',
    );
    const page = el.closest<HTMLElement>('.replay-site');
    const header = page?.querySelector<HTMLElement>('.site-header');
    const blueprintSky = el.querySelector<HTMLElement>('.silver-blueprint-sky');
    const blueprintGeometry = el.querySelector<HTMLElement>(
      '.silver-geometry-blueprint',
    );
    const blueprintPlane = el.querySelector<SVGGElement>(
      '[data-blueprint-plane]',
    );
    const orbitSvg = blueprintPlane?.ownerSVGElement;
    const starfield = el.querySelector<HTMLElement>('.silver-starfield');
    const founder = document.querySelector<HTMLElement>('.founder-stage');
    const audience = el.querySelector<HTMLElement>('[data-audience-stage]');
    const dock = audience?.querySelector<HTMLElement>('[data-coin-dock]');
    const dockInset = dock?.querySelector<HTMLElement>('.audience-coin-inset');
    const dockSurface = audience?.querySelector<HTMLElement>(
      '[data-audience-dock-surface]',
    );
    const audienceContent = audience?.querySelectorAll<HTMLElement>(
      '.audience-copy, .audience-weave, .audience-cards, .audience-coin-frame',
    );
    const blueprintHome = blueprintSky?.parentElement;
    const geometryHome = blueprintGeometry?.parentElement;
    const skyMarker = document.createComment('blueprint sky home');
    const geometryMarker = document.createComment('blueprint geometry home');
    blueprintSky?.parentNode?.insertBefore(skyMarker, blueprintSky);
    blueprintGeometry?.parentNode?.insertBefore(
      geometryMarker,
      blueprintGeometry,
    );
    let surfaceBox: DockSurfaceBox = { x: 0, y: 0, width: 1, height: 1 };
    let stageWidth = innerWidth;
    let stageHeight = innerHeight;
    let surfaceOwnsBlueprint = false;
    const ownBlueprint = (docking: boolean) => {
      if (docking === surfaceOwnsBlueprint || !dockSurface) return;
      if (docking) {
        if (blueprintSky) dockSurface.appendChild(blueprintSky);
        if (blueprintGeometry) dockSurface.appendChild(blueprintGeometry);
      } else {
        if (blueprintSky)
          skyMarker.parentNode?.insertBefore(
            blueprintSky,
            skyMarker.nextSibling,
          );
        if (blueprintGeometry)
          geometryMarker.parentNode?.insertBefore(
            blueprintGeometry,
            geometryMarker.nextSibling,
          );
      }
      surfaceOwnsBlueprint = docking;
    };
    const measureDock = () => {
      if (!dock || !sticky) return;
      const box = dock.getBoundingClientRect();
      const stage = sticky.getBoundingClientRect();
      el.dataset.dockX = String(box.left + box.width / 2 - stage.left);
      el.dataset.dockY = String(box.top + box.height / 2 - stage.top);
      el.dataset.dockRadius = String(box.width * 0.32);
      const inset = dockInset?.getBoundingClientRect() ?? box;
      stageWidth = stage.width;
      stageHeight = stage.height;
      surfaceBox = {
        x: inset.left - stage.left,
        y: inset.top - stage.top,
        width: inset.width,
        height: inset.height,
      };
    };
    const dockObserver = new ResizeObserver(measureDock);
    if (dock) dockObserver.observe(dock);
    const audienceLayout = audience?.querySelector<HTMLElement>('.audience-layout');
    if (audienceLayout) dockObserver.observe(audienceLayout);
    void document.fonts.ready.then(measureDock);
    if (sticky) dockObserver.observe(sticky);
    measureDock();
    const hasFounder = !!founder;
    const founderScreen =
      founder?.querySelector<HTMLElement>('.founder-screen');
    const previousButton = el.querySelector<HTMLButtonElement>(
      '.clockwork-chapter-prev',
    );
    const nextButton = el.querySelector<HTMLButtonElement>(
      '.clockwork-chapter-next',
    );
    const previousLabel = el.querySelector<HTMLElement>(
      '.clockwork-chapter-prev-label',
    );
    const nextLabel = el.querySelector<HTMLElement>(
      '.clockwork-chapter-next-label',
    );
    const chapterDots = Array.from(
      el.querySelectorAll<HTMLAnchorElement>('.clockwork-chapter-dots a'),
    );
    const setPaused = (paused: boolean) => syncClockworkMotionState(el, paused);
    const toggleMotion = (event: Event) =>
      setPaused((event as CustomEvent<MotionToggleDetail>).detail.paused);
    const available = () => {
      const total = Math.max(
        1,
        el.offsetHeight - (sticky?.offsetHeight ?? innerHeight),
      );
      return audience ? total / 1.025 : total;
    };
    const address = (hash: string) =>
      location.pathname + location.search + hash;
    const rawProgress = () => -el.getBoundingClientRect().top / available();
    const focusAt = (
      target: HTMLElement,
      progress: number,
      instant = false,
    ) => {
      clearTimeout(focusTimer);
      cancelAnimationFrame(focusFrame);
      focusTimer = window.setTimeout(
        () => {
          focusFrame = requestAnimationFrame(() => {
            if (
              target.isConnected &&
              (reduced.matches || Math.abs(current - progress) < 0.065)
            )
              target.focus({ preventScroll: true });
          });
        },
        reduced.matches || instant ? 0 : 650,
      );
    };
    const go = (
      hash: string,
      keyboard = false,
      behavior: ScrollBehavior = 'instant',
    ) => {
      if (!intro && ['#founder', '#founder-heading'].includes(hash)) {
        document.querySelector(hash)?.scrollIntoView({behavior:'instant', block:'start'});
        return;
      }
      if (!intro && (hash === '#founder-heading' || hash === '#founder') && hasFounder) {
        if (reduced.matches) {
          const target = document.getElementById('founder-heading');
          target?.scrollIntoView({ behavior: 'instant', block: 'start' });
          if (keyboard) target?.focus({ preventScroll: true });
          return;
        }
        if (audience) {
          const target = document.getElementById('founder-heading');
          if (keyboard || behavior === 'instant') {
            current = 1;
            update();
          }
          window.scrollTo({
            top: scrollY + el.getBoundingClientRect().top + available() * 1.18,
            behavior:
              keyboard || reduced.matches || behavior === 'instant'
                ? 'instant'
                : 'instant',
          });
          if (keyboard && target) focusAt(target, 1, true);
          update();
          return;
        }
        leaveChapter(1, keyboard || behavior === 'instant');
        return;
      }
      const p = CLOCKWORK_ANCHORS[hash];
      if (intro || p === undefined) return;
      const id =
        hash === '#technology' || hash === '#economic-analysis'
          ? 'economics'
          : hash.slice(1);
      if (id === 'economics' && hash !== '#economics')
        history.replaceState(null, '', address('#economics'));
      const target = el.querySelector<HTMLElement>(`#${id}`);
      clearTimeout(snapTimer);
      const instant = keyboard || reduced.matches || behavior === 'instant';
      busyUntil = instant ? 0 : performance.now() + 750;
      if (reduced.matches) {
        target?.scrollIntoView({ behavior: 'instant', block: 'start' });
      } else {
        if (instant) {
          current = p;
          update();
        }
        window.scrollTo({
          top: scrollY + el.getBoundingClientRect().top + available() * p,
          behavior: instant ? 'instant' : behavior,
        });
      }
      if (keyboard && target) focusAt(target, p, instant);
    };
    const visitChapter = (index: number, keyboard = false, gesture = false) => {
      const chapter = CHAPTERS[index];
      if (!chapter) return;
      if (location.hash !== chapter.hash) {
        if (gesture) history.replaceState(null, '', address(chapter.hash));
        else history.pushState(null, '', address(chapter.hash));
      }
      go(chapter.hash, keyboard);
    };
    const leaveChapter = (direction: ChapterDirection, keyboard = false) => {
      clearTimeout(snapTimer);
      wheelState = createWheelState();
      touch = null;
      const candidate = document.getElementById(
        direction < 0
          ? 'hero-heading'
          : audience
            ? 'audience-heading'
            : 'founder-heading',
      );
      const target = candidate?.getClientRects().length ? candidate : null;
      const inset =
        direction > 0 && target?.closest('.founder-stage') ? 150 : 110;
      const pinnedFounder = direction > 0 && hasFounder && !reduced.matches;
      const top =
        direction < 0
          ? scrollY + el.getBoundingClientRect().top
          : pinnedFounder
            ? scrollY + el.getBoundingClientRect().top + available()
            : target
              ? scrollY + target.getBoundingClientRect().top - inset
              : scrollY + el.getBoundingClientRect().bottom;
      busyUntil = performance.now() + 750;
      if (pinnedFounder && keyboard) {
        current = 1;
        update();
      }
      window.scrollTo({
        top,
        behavior: keyboard || reduced.matches ? 'instant' : 'instant',
      });
      if (direction < 0 || target)
        history.replaceState(
          null,
          '',
          address(
            direction < 0
              ? '#top'
              : audience
                ? '#audience-heading'
                : '#founder-heading',
          ),
        );
      if (keyboard && target)
        requestAnimationFrame(() => {
          target.tabIndex = -1;
          target.focus({ preventScroll: true });
        });
    };
    const stepChapter = (
      direction: ChapterDirection,
      keyboard = false,
      gesture = false,
    ) => {
      const index = getChapterStep(current, direction);
      if (index === null) {
        if (!gesture) leaveChapter(direction, keyboard);
        return;
      }
      visitChapter(index, keyboard, gesture);
    };
    const advance = (event: Event) => {
      const detail = (event as CustomEvent<AdvanceDetail>).detail;
      if (current >= 0.12 && !reduced.matches) return;
      if (detail?.source === 'coin') {
        visitChapter(0, detail.input === 'keyboard');
        return;
      }
      go('#inside-the-penny', detail?.input === 'keyboard');
    };
    const navigate = (event: Event) => {
      const detail = (
        event as CustomEvent<{ hash: string; behavior?: ScrollBehavior }>
      ).detail;
      if (detail) go(detail.hash, true, detail.behavior);
    };
    const click = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (event.target as Element)?.closest<HTMLAnchorElement>(
        'a[href]',
      );
      if (!anchor || anchor.target === '_blank') return;
      const url = new URL(anchor.href, location.href);
      if (
        url.origin !== location.origin ||
        url.pathname !== location.pathname ||
        (CLOCKWORK_ANCHORS[url.hash] === undefined && !['#founder', '#founder-heading'].includes(url.hash))
      )
        return;
      event.preventDefault();
      const hash =
        url.hash === '#technology' || url.hash === '#economic-analysis'
          ? '#economics'
          : url.hash;
      history.pushState(null, '', address(hash));
      go(hash, event.detail === 0);
    };
    const hashchange = () => go(location.hash, true, 'instant');
    const draw = (time: number) => {
      frame = 0;
      lastRawProgress = rawProgress();
      const target =
        intro || reduced.matches
          ? 0
          : Math.max(0, Math.min(1, lastRawProgress));
      const dt = last ? (time - last) / 1000 : 1 / 60;
      last = time;
      // Give only the hero-to-services handoff a slightly softer follow.
      const handoff = 1 - clockPhase(Math.max(current, target), 0.34, 0.43);
      const followRate = 30 - 16 * handoff;
      current = intro || reduced.matches ? target : current + (target - current) * (1 - Math.exp(-followRate * Math.min(dt, 0.1)));
      if (Math.abs(current - target) < 0.00008) current = target;
      const state = clockworkState(current),
        story = clockworkNarrative(current);
      const audienceState = audienceHandoffState(current);
      const founderProgress = audience
        ? audienceFounderProgress(lastRawProgress)
        : state.p;
      el.dataset.founderProgress = founderProgress.toFixed(5);
      if (audience) {
        const docking = current > 0.84 && !reduced.matches;
        ownBlueprint(docking);
        if (dockSurface) {
          dockSurface.style.transform = audienceDockSurface(
            stageWidth,
            stageHeight,
            surfaceBox,
            audienceState.dock,
          ).transform;
        }
        for (const content of audienceContent ?? [])
          content.style.opacity = String(
            reduced.matches ? 1 : audienceState.content,
          );
        audience.dataset.present = String(current > 0.84 || reduced.matches);
        audience.inert = !reduced.matches && current < 0.97;
        setMotionAttribute(audience,
          'aria-hidden',
          String(!reduced.matches && current < 0.97),
        );
      }
      // During the hero, place the grid within its background layer, below the opaque hand artwork.
      if (blueprintGeometry && !surfaceOwnsBlueprint) {
        const hero = el.querySelector<HTMLElement>('[data-reference-hero]');
        if (current < .34 && hero && blueprintGeometry.parentElement !== hero) hero.insertBefore(blueprintGeometry, hero.firstChild);
        else if (current >= .34 && blueprintGeometry.parentNode !== geometryMarker.parentNode) geometryMarker.parentNode?.insertBefore(blueprintGeometry, geometryMarker.nextSibling);
      }
      const blueprint = clockPhase(state.p, 0.12, 0.34);
      if (blueprintSky) blueprintSky.style.opacity = String(blueprint);
      if (blueprintGeometry)
        blueprintGeometry.style.opacity = String(
          el.dataset.heroStyle === 'warm'
            ? 0.25 + blueprint * 0.015
            : 0.24 + blueprint * 0.025,
        );
      if (blueprintGeometry && el.dataset.heroStyle === 'warm')
        blueprintGeometry.style.color = `color-mix(in srgb, #526d7d ${100 * (1 - blueprint)}%, #d8e7ff)`;
      const sceneZoom =
        el.dataset.heroStyle === 'warm'
          ? 0.68 + 0.72 * clockPhase(state.p, 0, 0.28)
          : 1;
      if (blueprintPlane)
        setMotionAttribute(blueprintPlane,
          'transform',
          `scale(${sceneZoom} ${sceneZoom * (el.dataset.heroStyle === 'warm' ? Math.cos(((52 * Math.PI) / 180) * state.turn) : 1 - (1 - 0.615661) * clockPhase(state.p, 0.1, 0.34))})`,
        );
      if (orbitSvg) {
        const heroY =
          parseFloat(el.style.getPropertyValue('--hero-coin-y')) ||
          innerHeight * (el.dataset.heroStyle === 'warm' ? 0.5 : 0.4);
        const serviceY =
          innerHeight *
          (el.dataset.heroStyle === 'warm'
            ? 0.5
            : innerHeight <= 640 && innerWidth > innerHeight
              ? 0.48
              : 0.4);
        const dockedGridY =
          serviceY + (stageHeight * 0.5 - serviceY) * audienceState.dock;
        const gridTurn =
          el.dataset.heroStyle === 'warm'
            ? clockPhase(state.p, 0.3, 0.43)
            : clockPhase(state.p, 0.1, 0.34);
        const viewportOffset =
          el.dataset.heroStyle === 'warm'
            ? sticky?.getBoundingClientRect().top || 0
            : 0;
        orbitSvg.style.translate = `0 ${heroY + (dockedGridY - heroY) * gridTurn - viewportOffset}px`;
        if (el.dataset.heroStyle === 'warm') {
          const heroX =
            parseFloat(el.style.getPropertyValue('--hero-coin-x')) ||
            stageWidth * 0.5;
          orbitSvg.style.left = `${heroX + (stageWidth * 0.5 - heroX) * state.enter}px`;
        }
      }
      if (starfield)
        starfield.style.opacity = String(1 - clockPhase(state.p, 0.04, 0.29));
      const blueprintActive = blueprint > 0.5;
      if (page && page.dataset.blueprint !== String(blueprintActive))
        page.dataset.blueprint = String(blueprintActive);
      const exit = founderTransitionState(hasFounder ? founderProgress : 0);
      setMotionStyle(el, '--clock-outro', String(exit.departure));
      el.dataset.progress = state.p.toFixed(5);
      if (el.dataset.heroStyle === 'warm') {
        const warm = warmHeroStage(state.p);
        el.dataset.heroSurface = warm.chapters ? 'chapters' : 'warm';
        setMotionStyle(el, '--warm-hero-opacity', String(warm.opacity));
        const copyExit = clockPhase(state.p, 0, 0.12);
        setMotionStyle(el, '--warm-copy-opacity', String(1 - copyExit));
        setMotionStyle(el, '--warm-copy-exit', String(copyExit));
      }
      el.dataset.phase =
        state.p < 0.12 ? 'hero' : state.p < 0.43 ? 'opening' : 'mechanism';
      el.dataset.beat = story.active;
      el.dataset.motion = reduced.matches ? 'reduced' : 'full';
      setMotionStyle(el,
        '--clock-title',
        String(1 - Math.min(1, state.enter * 1.5)),
      );
      setMotionStyle(el, '--clock-discovery', String(story.discovery));
      setMotionStyle(el,
        '--clock-section',
        String(
          story.section *
            (1 - exit.departure) *
            (1 - audienceState.serviceExit),
        ),
      );
      setMotionStyle(el,
        '--clock-hands',
        String(1 - clockPhase(state.p, 0.13, 0.32)),
      );
      if (discovery) {
        const hidden = !reduced.matches && story.discovery < 0.5;
        if (hidden && discovery.contains(document.activeElement))
          (document.activeElement as HTMLElement)?.blur();
        discovery.inert = hidden;
        setMotionAttribute(discovery, 'aria-hidden', String(hidden));
      }
      if (heroTitle) {
        heroTitle.inert = state.p > 0.1;
        setMotionAttribute(heroTitle, 'aria-hidden', String(state.p > 0.1));
      }
      for (const id of [
        'strategy',
        'risk',
        'economics',
        'invitation',
      ] as const) {
        setMotionStyle(el,
          `--clock-${id}`,
          String(
            story[id] *
              (id === 'invitation'
                ? (1 - exit.departure) * (1 - audienceState.serviceExit)
                : 1),
          ),
        );
        const visibility = story[id];
        setMotionStyle(el,
          `--clock-${id}-x`,
          `${((1 - visibility) * (id === 'risk' || id === 'invitation' ? -16 : 16)).toFixed(3)}px`,
        );
      }
      for (const panel of panels) {
        const id = panel.dataset.clockworkPanel as
          | 'strategy'
          | 'risk'
          | 'economics'
          | 'invitation';
        const visible =
          reduced.matches ||
          (story.active === id &&
            !(
              id === 'invitation' &&
              (exit.obscured || audienceState.serviceExit > 0.5)
            ));
        if (!visible && panel.contains(document.activeElement))
          (document.activeElement as HTMLElement)?.blur();
        panel.inert = !visible;
        setMotionAttribute(panel, 'aria-hidden', String(!visible));
      }
      const chapterIndex = Math.max(
        0,
        CHAPTERS.findIndex((chapter) => chapter.id === story.active),
      );
      setMotionText(previousLabel, chapterIndex === 0 ? 'Hero' : 'Previous');
      setMotionText(nextLabel, chapterIndex === CHAPTERS.length - 1 ? 'Continue' : 'Next');
      setMotionAttribute(previousButton,
        'aria-label',
        chapterIndex === 0 ? 'Back to hero' : 'Previous chapter',
      );
      setMotionAttribute(nextButton,
        'aria-label',
        chapterIndex === CHAPTERS.length - 1
          ? 'Continue to the founder'
          : 'Next chapter',
      );
      for (const [index, dot] of chapterDots.entries()) {
        if (index === chapterIndex) setMotionAttribute(dot, 'aria-current', 'step');
        else dot.removeAttribute('aria-current');
      }
      if (controls) {
        const hidden =
          intro ||
          reduced.matches ||
          current < CHAPTER_ENTRY ||
          (hasFounder && current > 0.835) ||
          rawProgress() > CHAPTER_EXIT;
        controls.inert = hidden;
        setMotionAttribute(controls, 'aria-hidden', String(hidden));
      }
      if (booking) {
        booking.inert = state.p > 0.1;
        setMotionAttribute(booking, 'aria-hidden', String(state.p > 0.1));
      }
      if (explore) {
        explore.inert = state.p > 0.1;
        setMotionAttribute(explore, 'aria-hidden', String(state.p > 0.1));
      }
      if (coin) {
        const hidden = intro || state.p >= 0.1;
        coin.inert = hidden;
        setMotionAttribute(coin, 'aria-hidden', String(hidden));
      }
      el.dispatchEvent(new Event('clockwork-progress'));
      if (current !== target) frame = requestAnimationFrame(draw);
      else last = 0;
    };
    const update = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const snapToChapter = () => {
      if (intro || reduced.matches || touch || performance.now() < busyUntil)
        return;
      const p = rawProgress();
      if (p < CHAPTER_ENTRY || p > CHAPTER_EXIT) return;
      if (
        (lastDirection < 0 && p <= CHAPTERS[0].progress) ||
        (lastDirection > 0 && p >= CHAPTERS[CHAPTERS.length - 1].progress)
      )
        return;
      const index = nearestChapterIndex(p);
      if (Math.abs(p - CHAPTERS[index].progress) > 0.002)
        visitChapter(index, false, true);
    };
    const scroll = () => {
      update();
      clearTimeout(snapTimer);
      // Native scrolling: no automatic chapter snapping.
    };
    const resize = () => {
      clearTimeout(snapTimer);
      const wasReading =
        controls?.getAttribute('aria-hidden') === 'false' &&
        lastRawProgress >= CHAPTER_ENTRY &&
        lastRawProgress <= CHAPTER_EXIT;
      if (!intro && !reduced.matches && wasReading)
        go(CHAPTERS[nearestChapterIndex(current)].hash, false, 'instant');
      else {
        busyUntil = performance.now() + 750;
        update();
      }
    };
    const allowNative = (target: EventTarget | null) =>
      target instanceof Element &&
      !!target.closest(
        'input,textarea,select,[contenteditable="true"],[role="dialog"],[data-native-scroll]',
      );
    const wheel = (event: WheelEvent) => {
      if (
        intro ||
        reduced.matches ||
        event.defaultPrevented ||
        allowNative(event.target)
      )
        return;
      if (event.deltaY) lastDirection = event.deltaY > 0 ? 1 : -1;
      const result = processWheel(
        wheelState,
        {
          deltaY: event.deltaY,
          deltaX: event.deltaX,
          deltaMode: event.deltaMode,
          time: performance.now(),
          busy: performance.now() < busyUntil,
          ctrlKey: event.ctrlKey,
          viewportHeight: innerHeight,
        },
        rawProgress(),
      );
      wheelState = result.state;
      if (result.kind === 'native') return;
      event.preventDefault();
      clearTimeout(snapTimer);
      if (result.kind === 'step' && result.index !== undefined)
        visitChapter(result.index, false, true);
    };
    const touchstart = (event: TouchEvent) => {
      if (
        intro ||
        reduced.matches ||
        event.touches.length !== 1 ||
        allowNative(event.target) ||
        (event.target instanceof Element && event.target.closest('a,button'))
      )
        return;
      const p = rawProgress();
      if (p < CHAPTER_ENTRY || p > CHAPTER_EXIT) return;
      touch = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
        progress: current,
        captured: false,
      };
      clearTimeout(snapTimer);
    };
    const touchmove = (event: TouchEvent) => {
      if (!touch) return;
      if (event.touches.length !== 1) {
        touch = null;
        return;
      }
      const dx = touch.x - event.touches[0].clientX,
        dy = touch.y - event.touches[0].clientY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return;
      const direction: ChapterDirection =
        (Math.abs(dx) > Math.abs(dy) ? dx : dy) > 0 ? 1 : -1;
      lastDirection = direction;
      if (getChapterStep(touch.progress, direction) === null) return;
      if (event.cancelable) {
        event.preventDefault();
        touch.captured = true;
      }
    };
    const touchend = (event: TouchEvent) => {
      const start = touch;
      touch = null;
      if (
        !start?.captured ||
        !event.changedTouches.length ||
        performance.now() < busyUntil
      )
        return;
      const dx = start.x - event.changedTouches[0].clientX,
        dy = start.y - event.changedTouches[0].clientY;
      const distance = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      if (Math.abs(distance) >= 44) {
        const direction: ChapterDirection = distance > 0 ? 1 : -1;
        stepChapter(direction, false, true);
      }
    };
    const touchcancel = () => {
      touch = null;
    };
    const keydown = (event: KeyboardEvent) => {
      if (
        intro ||
        reduced.matches ||
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        allowNative(event.target) ||
        rawProgress() < CHAPTER_ENTRY ||
        rawProgress() > CHAPTER_EXIT
      )
        return;
      const direction: ChapterDirection | 0 = [
        'ArrowRight',
        'ArrowDown',
        'PageDown',
      ].includes(event.key)
        ? 1
        : ['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)
          ? -1
          : 0;
      if (!direction && event.key !== 'Home' && event.key !== 'End') return;
      // The final scene is normal reading content once the reveal is complete.
      if (
        hasFounder &&
        current >= 0.98 &&
        (direction > 0 || event.key === 'End')
      )
        return;
      event.preventDefault();
      if (event.repeat) return;
      if (direction) stepChapter(direction, true);
      else visitChapter(event.key === 'Home' ? 0 : CHAPTERS.length - 1, true);
    };
    const previousClick = (event: MouseEvent) =>
      stepChapter(-1, event.detail === 0);
    const nextClick = (event: MouseEvent) => {
      if (clockworkNarrative(current).active === 'invitation')
        leaveChapter(1, event.detail === 0);
      else stepChapter(1, event.detail === 0);
    };
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', resize);






    previousButton?.addEventListener('click', previousClick);
    nextButton?.addEventListener('click', nextClick);
    window.addEventListener(NAVIGATE_EVENT, navigate);
    window.addEventListener('hashchange', hashchange);
    const reducedChange = () => {
      setPaused(reduced.matches || !animateRef.current);
      update();
    };
    setPaused(reduced.matches || !animateRef.current);
    document.addEventListener('click', click);
    reduced.addEventListener('change', reducedChange);
    el.addEventListener(ADVANCE_EVENT, advance);
    el.addEventListener(MOTION_TOGGLE_EVENT, toggleMotion);
    frame = requestAnimationFrame(draw);
    return () => {
      headingObserver.disconnect();
      dockObserver.disconnect();
      ownBlueprint(false);
      if (blueprintSky && blueprintHome && !skyMarker.isConnected)
        blueprintHome.appendChild(blueprintSky);
      if (blueprintGeometry && geometryHome && !geometryMarker.isConnected)
        geometryHome.appendChild(blueprintGeometry);
      if (blueprintGeometry && geometryMarker.parentNode) geometryMarker.parentNode.insertBefore(blueprintGeometry, geometryMarker.nextSibling);
      skyMarker.remove();
      geometryMarker.remove();
      if (page) delete page.dataset.blueprint;
      header?.style.removeProperty('background-color');
      cancelAnimationFrame(frame);
      cancelAnimationFrame(focusFrame);
      clearTimeout(focusTimer);
      clearTimeout(snapTimer);
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('resize', resize);
      window.removeEventListener('wheel', wheel);
      el.removeEventListener('touchstart', touchstart);
      el.removeEventListener('touchmove', touchmove);
      el.removeEventListener('touchend', touchend);
      el.removeEventListener('touchcancel', touchcancel);
      window.removeEventListener('keydown', keydown);
      previousButton?.removeEventListener('click', previousClick);
      nextButton?.removeEventListener('click', nextClick);
      window.removeEventListener(NAVIGATE_EVENT, navigate);
      window.removeEventListener('hashchange', hashchange);
      document.removeEventListener('click', click);
      reduced.removeEventListener('change', reducedChange);
      el.removeEventListener(ADVANCE_EVENT, advance);
      el.removeEventListener(MOTION_TOGGLE_EVENT, toggleMotion);
    };
  }, [intro]);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    animateRef.current = animate;
    syncClockworkMotionState(
      el,
      window.matchMedia('(prefers-reduced-motion: reduce)').matches || !animate,
    );
  }, [animate]);
  return (
    <div
      ref={root}
      className="clockwork-story"
      data-clockwork-story
      data-hero-style={heroStyle}
      data-intro={intro ? 'running' : 'complete'}
      data-hero-surface={heroStyle === 'warm' ? 'warm' : undefined}
      data-audience-handoff="true"
      data-layout="split"
      data-progress="0"
      data-phase="hero"
      data-animation-paused={String(!animate)}
    >
      <div className="clockwork-sticky">
        {children}
        <a
          className="hero-coin-link"
          href="#strategy"
          aria-label="Explore Business strategy"
          aria-hidden={intro}
          inert={intro ? true : undefined}
          onClick={(event) => requestClockworkAdvance(event, 'coin')}
          onPointerEnter={(event) => reportCoinPointer(event, true)}
          onPointerMove={(event) => reportCoinPointer(event, true)}
          onPointerLeave={(event) => reportCoinPointer(event, false)}
          onPointerCancel={(event) => reportCoinPointer(event, false)}
        >
          <span className="sr-only">Explore Business strategy</span>
        </a>
        <section id="services" tabIndex={-1} data-section="services" className="coin-expertise" aria-labelledby="expertise-heading">
          <div
            id="inside-the-penny"
            className="clockwork-discovery"
            tabIndex={-1}
            aria-label="Inside the penny"
          />
          <h2
            id="expertise-heading"
            className="clockwork-services-label"
            tabIndex={-1}
          >
            Services
          </h2>
          {COIN_EXPERTISE.filter((topic) => topic.id !== 'economics').map(
            (topic, index) => (
              <article
                id={topic.id}
                data-section={topic.id}
                className="clockwork-panel coin-expertise-panel"
                data-clockwork-panel={topic.id}
                data-card-side={index % 2 === 0 ? 'right' : 'left'}
                key={topic.id}
                aria-labelledby={`${topic.id}-heading`}
                tabIndex={-1}
              >
                <img
                  className="clockwork-static-figure"
                  src={assetUrl(
                    `illustrations/coin-systems-v2/outline/${topic.part}-rest.webp`,
                  )}
                  alt=""
                  width={1440}
                  height={1320}
                  loading="lazy"
                />
                <h3 id={`${topic.id}-heading`}>{topic.name}</h3>
                <p className="clockwork-summary">{topic.summary}</p>
              </article>
            ),
          )}
          <section
            id="economics"
            data-section="economics"
            className="clockwork-panel clockwork-copy"
            data-clockwork-panel="invitation"
            aria-labelledby="clockwork-heading"
            tabIndex={-1}
          >
            <img
              className="clockwork-static-figure"
              src={assetUrl(
                'illustrations/coin-systems-v2/outline/analysis-rest.webp',
              )}
              alt=""
              width={1440}
              height={1320}
              loading="lazy"
            />
            <h3 id="clockwork-heading" tabIndex={-1}>
              {COIN_EXPERTISE[2].name}
            </h3>
            <p className="clockwork-tagline">{COIN_EXPERTISE[2].summary}</p>
            <BookingLink className="clockwork-call">
              Book a call
            </BookingLink>
            <span className="clockwork-free">
              15 minutes. No fee. A first conversation.
            </span>
          </section>
        </section>
        <AudienceSection />
        <nav
          className="clockwork-chapter-controls"
          aria-label="Chapter navigation"
          aria-hidden="true"
          inert
        >
          <div className="clockwork-chapter-dots">
            {CHAPTERS.map((chapter, index) => (
              <a
                key={chapter.id}
                href={chapter.hash}
                aria-label={`Go to ${chapter.id === 'invitation' ? 'Economic analysis' : COIN_EXPERTISE[index].name}`}
                title={
                  chapter.id === 'invitation'
                    ? 'Economic analysis'
                    : COIN_EXPERTISE[index].name
                }
                aria-current={index === 0 ? 'step' : undefined}
              >
                <span aria-hidden="true" />
              </a>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
