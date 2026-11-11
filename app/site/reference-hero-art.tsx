'use client';
/* oxlint-disable next/no-img-element, jsx-a11y/prefer-tag-over-role -- Authored image planes with a shared full-stage coin compositor. */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createMintedCoinRenderer } from '../minted-coin-renderer';
import { createClockworkRenderer } from '../clockwork-renderer';
import {
  createCoinTextures,
  renderCoin,
  type CoinLighting,
  type CoinRenderPose,
} from '../coin-renderer';
import type { CoinRenderer } from '../coin-gpu-types';
import type { IntroDefinition, IntroEnvironment } from '../intro/types';
import { assetUrl } from '../asset-url';
import { heroExitMotion } from '../hero-scroll-motion';
import { heroSceneZoom } from '../hero-scene-zoom';
import { createHeroDepthRenderer } from '../hero-depth-renderer';
import { orbitIntro, ORBIT_ENTRANCE_TIMING } from '../intro/orbit';
import { introPlaybackRate } from '../hero-scroll-motion';
import { createWarmHeroAscii } from '../warm-hero-ascii';
import { createCoinAsciiDecode } from '../coin-ascii-decode';

// Preserve observable state while avoiding identical DOM mutations each frame.
function setData(element: HTMLElement, key: string, value: string, force = false) {
  if (force || element.dataset[key] !== value) element.dataset[key] = value;
}

type Props = {
  animate: boolean;
  skipIntro: boolean;
  onIntroComplete: () => void;
  definition?: IntroDefinition;
};
export default function ReferenceHeroArt({
  animate,
  skipIntro,
  onIntroComplete,
  definition,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const atmosphere = useRef<HTMLDivElement>(null);
  const [heroHost, setHeroHost] = useState<HTMLElement | null>(null);
  const [drawing, setDrawing] = useState('engraving');
  useEffect(() => {
    setDrawing(new URLSearchParams(location.search).get('hero-art') === '04' ? 'wireframe' : 'engraving');
  }, []);
  useEffect(() => {
    setHeroHost(
      root.current?.closest<HTMLElement>('[data-reference-hero]') ?? null,
    );
  }, []);
  const running = useRef(animate);
  useEffect(() => {
    running.current = animate;
    root.current?.dispatchEvent(new Event('reference-motion'));
  }, [animate]);
  useEffect(() => {
    if (!heroHost) return;
    heroHost.dataset.drawing = drawing;
    const art = root.current;
    const story = art?.closest<HTMLElement>('[data-clockwork-story]');
    const sticky = story?.querySelector<HTMLElement>('.clockwork-sticky');
    const anchor = art?.querySelector<HTMLElement>('.reference-coin');
    if (!art || !story || !sticky || !anchor) {
      onIntroComplete();
      return;
    }
    const surface = document.createElement('canvas');
    surface.className = 'clockwork-canvas warm-unified-canvas';
    surface.setAttribute('aria-hidden', 'true');
    surface.style.width = surface.style.height = '100%';
    // A viewport surface avoids inheriting the sticky scene's scroll offset.
    surface.style.position = 'fixed';
    surface.style.inset = '0';
    surface.style.zIndex = '70';
    sticky.appendChild(surface);
    const context = surface.getContext('2d');
    if (!context) {
      surface.remove();
      onIntroComplete();
      return;
    }
    let renderer: CoinRenderer | null = null;
    let depthRenderer: Awaited<
      ReturnType<typeof createHeroDepthRenderer>
    > | null = null;
    let forceDepth = true;
    let viewX = 0,
      viewY = 0,
      targetX = 0,
      targetY = 0;
    let settled = false;
    let disposed = false,
      frame = 0,
      last = 0,
      elapsed = 0,
      mechanism = 0;
    let visible = true,
      width = 1,
      height = 1,
      ratio = 1;
    let progress = Number(story.dataset.progress || 0);
    let rest: CoinRenderPose = {
      x: 0,
      y: 0,
      radius: 1,
      yaw: -0.95,
      roll: (14 * Math.PI) / 180,
    };
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const handScene = art.querySelector<HTMLElement>('.reference-scene');
    const handLeft = art.querySelector<HTMLElement>('.reference-hand-left');
    const handRight = art.querySelector<HTMLElement>('.reference-hand-right');
    const clouds = [
      ...(atmosphere.current?.querySelectorAll<HTMLElement>(
        '.reference-cloud',
      ) ?? []),
    ];
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const point = (event: PointerEvent) => {
      if (
        !finePointer.matches ||
        !running.current ||
        reduced.matches ||
        progress > 0.32
      )
        return;
      const box = heroHost.getBoundingClientRect();
      targetX = Math.max(
        -1,
        Math.min(1, ((event.clientX - box.x) / box.width) * 2 - 1),
      );
      targetY = Math.max(
        -1,
        Math.min(1, ((event.clientY - box.y) / box.height) * 2 - 1),
      );
      wake();
    };
    const leave = () => {
      targetX = targetY = 0;
      wake();
    };
    heroHost.addEventListener('pointermove', point, { passive: true });
    heroHost.addEventListener('pointerleave', leave);
    const textures = createCoinTextures();
    const entrance = definition ?? orbitIntro;
    const opening = entrance.create();
    const coinDecode = createCoinAsciiDecode();
    let introTime = 0;
    let introDone = false;
    let gridReadinessPublished = false;
    let baseYaw = -0.95;
    let atmosphereStarted = false,
      handsStarted = false;
    let atmosphereDone = false,
      handsDone = false;
    let ascii: ReturnType<typeof createWarmHeroAscii> | null = null;
    const finish = () => {
      if (introDone || disposed) return;
      introDone = true;
      coinDecode.destroy();
      surface.style.zIndex = '5';
      ascii?.complete();
      depthRenderer?.activate();
      forceDepth = true;
      onIntroComplete();
    };
    const wake = () => {
      if (!frame && !disposed && !document.hidden && visible)
        frame = requestAnimationFrame(paint);
    };
    const drawClosed = (
      ctx: CanvasRenderingContext2D,
      next: typeof textures,
      pose: CoinRenderPose,
      light: CoinLighting = {},
    ) => {
      if (!renderer) {
        renderCoin(ctx, next, pose, light);
        return;
      }
      renderer.draw({
        radius: 100,
        yaw: pose.yaw,
        tilt: light.tilt ?? 0,
        perspective: light.perspective ?? 0.25,
        light: 0.5,
        wireframe: Number(light.wireframe) || 0,
      });
      ctx.save();
      ctx.globalAlpha *= light.alpha ?? 1;
      ctx.translate(pose.x, pose.y);
      ctx.rotate(pose.roll ?? 0);
      const side = pose.radius * 2.56;
      ctx.drawImage(renderer.canvas, -side / 2, -side / 2, side, side);
      ctx.restore();
      setData(surface, 'coinRadius', pose.radius.toFixed(3));
      setData(surface, 'coinYaw', pose.yaw.toFixed(5));
      setData(surface, 'coinTilt', String(light.tilt ?? 0));
      setData(surface, 'coinRoll', String(pose.roll ?? 0));
      setData(surface, 'coinPerspective', String(light.perspective ?? 0.25));
    };
    const clockwork = createClockworkRenderer(wake, drawClosed, {
      tilt: 0,
      perspective: 0.25,
    });
    let stageOffsetY = 0;
    function paint(now: number) {
      frame = 0;
      if (disposed || !visible || document.hidden || !settled) return;
      const dt = last ? Math.min(50, now - last) / 1000 : 0;
      last = now;
      const moving = running.current && !reduced.matches;
      if (!introDone && (skipIntro || !moving)) finish();
      if (!introDone)
        introTime +=
          dt *
          (entrance.id === 'orbit'
            ? introPlaybackRate(introTime, entrance.duration)
            : 1);
      ascii?.update(now);
      // Each effect's new trace observer needs the first paint notification,
      // including when a previous effect left the same readiness value behind.
      setData(story!, 'gridReady', String(introDone || introTime >= ORBIT_ENTRANCE_TIMING.transfer), !gridReadinessPublished);
      gridReadinessPublished = true;
      if (
        !introDone &&
        introTime >= ORBIT_ENTRANCE_TIMING.atmosphere &&
        !atmosphereStarted
      ) {
        atmosphereStarted = true;
        void ascii?.reveal('atmosphere').then(() => {
          atmosphereDone = true;
          wake();
        });
      }
      if (
        !introDone &&
        introTime >= ORBIT_ENTRANCE_TIMING.hands &&
        !handsStarted
      ) {
        handsStarted = true;
        void ascii?.reveal('hands').then(() => {
          handsDone = true;
          wake();
        });
      }
      if (
        !introDone &&
        introTime >= entrance.duration &&
        atmosphereDone &&
        handsDone
      )
        finish();
      const presence = 1 - Math.min(1, progress / 0.36);
      const idleX = finePointer.matches
        ? 0
        : Math.sin((elapsed * Math.PI) / 24) * 0.16;
      const idleY = finePointer.matches
        ? 0
        : Math.sin((elapsed * Math.PI) / 20) * 0.1;
      const follow = 1 - Math.exp(-dt * 5);
      viewX += ((targetX + idleX) * presence - viewX) * follow;
      viewY += ((targetY + idleY) * presence - viewY) * follow;
      if (!moving) viewX = viewY = targetX = targetY = 0;
      if (introDone && progress < 0.36)
        depthRenderer?.draw(viewX, viewY, now, forceDepth);
      forceDepth = false;
      if (moving && introDone && progress < 0.00001) elapsed += dt;
      if (moving && progress >= 0.39) mechanism += dt;
      if (progress < 0.00001) {
        rest.yaw = baseYaw + (elapsed * Math.PI) / 12;
        clockwork.reset();
      }
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      context!.clearRect(0, 0, width, height);
      if (!introDone) {
        const env: IntroEnvironment = {
          width,
          height,
          sceneY: rest.y,
          introY: rest.y,
          introMaxRadius: Math.min(width * 0.18, height * 0.19),
          radius: rest.radius,
          sprite: textures.face,
          handSources: [[], []],
          fingertips: [
            { x: width * 0.3, y: rest.y },
            { x: width * 0.7, y: rest.y },
          ],
        };
        const shot = opening.frame(introTime, env);
        baseYaw = shot.angle;
        opening.draw(context!, introTime, env, shot);
        if (shot.coinAlpha > 0) {
          context!.save();
          if (shot.coinReveal !== undefined && shot.coinReveal < 1) {
            const inner = rest.radius * 1.1 * (1 - shot.coinReveal);
            context!.beginPath();
            context!.rect(0, 0, width, height);
            context!.moveTo(rest.x + inner, rest.y);
            context!.arc(rest.x, rest.y, inner, 0, Math.PI * 2);
            context!.clip('evenodd');
          }
          drawClosed(
            context!,
            textures,
            { ...rest, y: rest.y, yaw: shot.angle, radius: rest.radius },
            { alpha: shot.coinAlpha, tilt: 0, perspective: 0.25 },
          );
          context!.restore();
          if (shot.coinReveal !== undefined && shot.coinReveal < 1 && renderer) {
            coinDecode.snapshot(renderer.canvas);
            coinDecode.draw(context!, rest.x, rest.y, rest.radius, shot.coinReveal);
          }
        }
        setData(surface, 'introPhase', introTime < 2.56 ? 'currency' : 'reveal');
      } else {
        setData(surface, 'introPhase', 'complete');
        context!.save();
        context!.translate(0, stageOffsetY);
        clockwork.draw(
          context!,
          textures,
          rest,
          progress,
          width,
          height,
          mechanism,
        );
        context!.restore();
      }
      setData(art!, 'ready', 'true');
      if (moving) wake();
    }
    const syncStage = (stage: DOMRect) => {
      const leavingStage = introDone && stage.top < 0;
      const position = leavingStage ? 'absolute' : 'fixed';
      if (surface.style.position !== position) surface.style.position = position;
      stageOffsetY = 0;
      surface.style.clipPath = leavingStage ? 'none' : `inset(${Math.max(0, stage.top)}px 0 ${Math.max(0, innerHeight - stage.bottom)}px)`;
      surface.hidden = !visible;
      if (!running.current || reduced.matches) forceDepth = true;
      progress = Number(story.dataset.progress || 0);
      const exit = heroExitMotion(progress, width, height, reduced.matches);
      const zoom = reduced.matches ? 1 : heroSceneZoom(progress, rest.radius, width, height);
      if (handScene) handScene.style.transform = `translate(-50%, -50%) scale(${zoom})`;
      const focusProgress = reduced.matches ? 0 : Math.max(0, Math.min(1, (progress - .02) / .2));
      const handBlur = (5.5 * focusProgress * focusProgress * (3 - 2 * focusProgress)).toFixed(2);
      for (const [hand, side] of [
        [handLeft, -1],
        [handRight, 1],
      ] as const) {
        if (!hand) continue;
        hand.style.transformOrigin = '50% 50%';
        hand.style.transform = side < 0 ? "translateX(-2.5%)" : "translateX(2.5%)";
        hand.style.opacity = String(exit.handOpacity);
        const focusFilter = handBlur === "0.00" ? "none" : `blur(${handBlur}px)`;
        if (hand.style.filter !== focusFilter) hand.style.filter = focusFilter;
      }
      clouds.forEach((cloud, index) => {
        cloud.style.transform = '';
        cloud.style.opacity = String(
          exit.cloudOpacity * [0.28, 0.65, 0.55][index],
        );
      });
      art.dataset.playing = String(
        running.current &&
          !reduced.matches &&
          visible &&
          !document.hidden &&
          progress < 0.36,
      );
      if (atmosphere.current)
        atmosphere.current.dataset.playing = art.dataset.playing;
      if (document.hidden || !visible) {
        cancelAnimationFrame(frame);
        frame = 0;
        last = 0;
      } else wake();
    };
    const sync = () => syncStage(sticky.getBoundingClientRect());
    const resize = () => {
      // Gather geometry before canvas resizing and grid/style writes.
      const nextWidth = document.documentElement.clientWidth;
      const nextHeight = window.innerHeight;
      const anchorWidth = anchor.offsetWidth;
      const stage = sticky.getBoundingClientRect();
      forceDepth = true;
      width = nextWidth;
      height = nextHeight;
      surface.style.height = `${height}px`;
      ratio = Math.min(devicePixelRatio || 1, 1.5);
      surface.width = Math.max(1, Math.round(width * ratio));
      surface.height = Math.max(1, Math.round(height * ratio));
      // The normalized camera fits a radius100 coin into a256px square.
      // offsetWidth is the unrolled CSS size; the bounding box includes roll.
      rest = {
        ...rest,
        x: width / 2,
        y: height / 2,
        radius: anchorWidth / 2.56,
      };
      clockwork.reset();
      renderer?.resize(384, ratio);
      story.dataset.heroRestRadius = String(rest.radius);
      story.style.setProperty('--hero-coin-x', `${rest.x}px`);
      story.style.setProperty('--hero-coin-y', `${rest.y}px`);
      // Position the shared grid before its reveal, even before the first scroll.
      if (progress === 0) {
        const plane = story.querySelector<SVGGElement>('[data-blueprint-plane]');
        const grid = plane?.ownerSVGElement;
        plane?.setAttribute('transform', 'scale(0.68 0.68)');
        if (grid) {
          grid.style.left = `${rest.x}px`;
          grid.style.translate = `0 ${rest.y - stage.top}px`;
        }
      }
      story.style.setProperty(
        '--hero-coin-radius',
        `${Math.max(24, rest.radius)}px`,
      );
      syncStage(stage);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(sticky);
    observer.observe(anchor);
    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.01 },
    );
    intersection.observe(sticky);
    story.addEventListener('clockwork-progress', sync);
    art.addEventListener('reference-motion', sync);
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    resize();
    const handImages = [
      ...art.querySelectorAll<HTMLImageElement>('.reference-hand-motion'),
    ];
    // Use the SVG path geometry directly; start once the intro hands arrive.
    const gridPaths = [...story.querySelectorAll<SVGGeometryElement>('[data-blueprint-line], [data-blueprint-ray]')];
    let traced = false;
    const traceGrid = new MutationObserver(() => {
      if (traced || story.dataset.gridReady !== 'true') return;
      traced = true;
      traceGrid.disconnect();
      gridPaths.forEach((path, index) => {
        path.style.setProperty('animation', 'none', 'important');
        path.style.strokeDasharray = '1';
        const trace = path.animate([{strokeDashoffset:'1'}, {strokeDashoffset:'0'}], {
          duration: reduced.matches ? 1 : 1800,
          delay: reduced.matches ? 0 : index * 35,
          easing:'cubic-bezier(.23,1,.32,1)', fill:'both',
        });
        void trace.finished.then(() => {
          path.style.setProperty('stroke-dasharray','none','important');
          path.style.setProperty('stroke-dashoffset','0','important');
          trace.cancel();
        }).catch(() => {});
      });
    });
    traceGrid.observe(story, {attributes:true, attributeFilter:['data-grid-ready']});
    const cloudImages = clouds
      .map((cloud) => cloud.querySelector('img')!)
      .filter(Boolean);
    const skyImage =
      atmosphere.current?.querySelector<HTMLImageElement>('.reference-sky img');
    ascii = createWarmHeroAscii(heroHost, {
      hands: [...cloudImages.slice(1), ...handImages],
      atmosphere: [],
    });
    atmosphere.current?.removeAttribute('data-initial');
    const depthPreparation = (false ? createHeroDepthRenderer(
      heroHost!,
      [
        ...cloudImages
          .slice(0, 1)
          .map((image) => ({ image, kind: 'cloud' as const, order: 0 })),
        ...handImages.map((image, i) => ({
          image,
          kind: 'hand' as const,
          order: 3,
          half: i ? 1 : -1,
        })),
        ...cloudImages
          .slice(1)
          .map((image) => ({ image, kind: 'cloud' as const, order: 1 })),
      ],
      {
        hand: assetUrl('experiments/reference-painted/hands-v10.webp'),
        handDepth: assetUrl(
          'experiments/reference-painted/hands-depth-v1.webp',
        ),
        cloud: assetUrl('experiments/reference-painted/clouds-v6.webp'),
        cloudDepth: assetUrl(
          'experiments/reference-painted/clouds-depth-v1.webp',
        ),
      },
      { deferReveal: true },
    ) : Promise.reject(new Error('Use authored drawing planes')))
      .then((next) => {
        if (disposed) {
          next.destroy();
          return;
        }
        depthRenderer = next;
        next.draw(0, 0, performance.now(), true);
      })
      .catch(() => {
        if (!disposed) heroHost.dataset.depth = 'fallback';
      });
    void createMintedCoinRenderer(
      () => {
        renderer?.destroy();
        renderer = null;
        settled = true;
        wake();
      },
      {
        modelUrl: assetUrl('models/pretty-penny-ornament-classic.glb'),
        blueprint: true,
        blueprintUrl: assetUrl('models/pretty-penny-classic-blueprint.json'),
        bakedOutlines: false,
        edgeThreshold: 8,
        studio: 'reference',
        exposure: 0.85,
        environmentIntensity: 1,
        environmentRotation: [0, 0, 0],
      },
    )
      .then((next) => {
        if (disposed) {
          next.destroy();
          return;
        }
        renderer = next;
        return Promise.all([
          depthPreparation,
          document.fonts
            .load('400 208px "Geist Mono"', '$€£¥₺₹')
            .then(() => ascii?.prepare()),
        ]).then(() => {
          if (disposed) return;
          heroHost.dataset.depthPreparedBeforeIntro = String(!!depthRenderer);
          settled = true;
          resize();
        });
      })
      .catch(() => {
        if (disposed) return;
        settled = true;
        wake();
        finish();
      });
    return () => {
      disposed = true;
      traceGrid.disconnect();
      ascii?.destroy();
      coinDecode.destroy();
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      story.removeEventListener('clockwork-progress', sync);
      art.removeEventListener('reference-motion', sync);
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', sync);
      clockwork.destroy();
      renderer?.destroy();
      depthRenderer?.destroy();
      heroHost.removeEventListener('pointermove', point);
      heroHost.removeEventListener('pointerleave', leave);
      surface.remove();
    };
  }, [onIntroComplete, skipIntro, heroHost, definition, drawing]);
  const handImage = assetUrl(drawing === 'wireframe'
    ? 'experiments/reference-painted/hands-wireframe-v2.png'
    : 'experiments/reference-painted/hands-renaissance-draped.png');
  return (
    <>
      {heroHost &&
        createPortal(
          <div
            ref={atmosphere}
            className="reference-atmosphere"
            data-initial="pending"
            data-playing="false"
            aria-hidden="true"
          >
            <div className="reference-sky">
              <img
                src={assetUrl(
                  'experiments/reference-painted/background-v5.webp',
                )}
                alt=""
                width={2059}
                height={764}
                fetchPriority="high"
              />
            </div>
            {['far', 'near-left', 'near-right'].map((plane) => (
              <div
                key={plane}
                className={`reference-cloud reference-cloud-${plane}`}
              >
                <img
                  src={assetUrl('experiments/reference-painted/clouds-contour-v3.png')}
                  alt=""
                  width={1942}
                  height={809}
                />
              </div>
            ))}
          </div>,
          heroHost,
        )}
      <div
        ref={root}
        className="reference-composition"
        data-ready="false"
        data-playing="false"
        role="img"
        aria-label="A gold Pretty Penny coin turning between two illustrated hands"
      >
        <div className="reference-scene">
          <div className="reference-hand-pose reference-hand-left">
            <img
              className="reference-hand-motion"
              src={handImage}
              alt=""
              width={2172}
              height={724}
            />
          </div>
          <div className="reference-hand-pose reference-hand-right">
            <img
              className="reference-hand-motion"
              src={handImage}
              alt=""
              width={2172}
              height={724}
            />
          </div>
          <div className="reference-coin"></div>
        </div>
      </div>
    </>
  );
}

