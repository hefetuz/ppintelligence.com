import { heroServiceRadius } from './hero-scene-zoom';
import { setMotionStyle } from './dom-updates';
import { assetUrl } from './asset-url';
import { scrollCoinCamera } from './minted-coin-pose.mjs';
import {
  coinWireframeProgress,
  coinVisibleFace,
  renderCoin,
  type CoinRenderPose,
  type CoinTextures,
} from './coin-renderer';
import {
  clockworkState,
  clockworkNarrative,
  ISOMETRIC_TILT,
  nearestIsometricYaw,
  coinFacing,
  cutawayShell,
  clockPhase,
} from './clockwork-model';
import { createWatchMovementRenderer } from './watch-movement-renderer';
import { createConsultingCalibreRenderer } from './consulting-calibre-renderer';
import { createServiceInstrumentRenderer } from './service-instrument-renderer';
import { mechanismDeckLayout, mechanismMotionAt } from './clockwork-motion';
import {
  coinIllustrationStyle,
  coinIllustrationPaths,
  coinInstrumentFill,
} from './coin-illustration-style';
import { audienceHandoffState } from './audience-handoff-model';

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
// Common registration for the authored instrument sets. Their projected SVG
// paths are drawn once; the covers match the current set's camera below.
const ART = {
  width: 1440,
  height: 1320,
  x: 720,
  y: 660,
  radius: 96 * 3.1 * Math.sqrt(1.6),
};

export function createClockworkRenderer(
  wake: () => void,
  drawClosedCoin: typeof renderCoin = renderCoin,
  opening: { tilt?: number; perspective?: number } = {},
) {
  const style = coinIllustrationStyle(window.location.search);
  const paths = coinIllustrationPaths(style);
  const instruments =
    style === 'anatomy'
      ? createServiceInstrumentRenderer(
          wake,
          coinInstrumentFill(window.location.search),
        )
      : null;
  const watch = instruments ? null : createWatchMovementRenderer(wake, style);
  const calibre = instruments
    ? null
    : createConsultingCalibreRenderer(wake, style);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let dead = false;
  let dockAngle = 0;
  let previousSeconds: number | undefined;
  let storyRoot: HTMLElement | null = null,
    lastInstrumentBounds = '';
  let lastSceneZoom = '';
  let latched: CoinRenderPose | undefined,
    latchWidth = 0;
  const load = (name: string) => {
    const image = new Image();
    image.onload = () => {
      if (!dead) wake();
    };
    image.src = assetUrl(`${paths.watch}/${name}`);
    return image;
  };
  const movement = load(
    style === 'anatomy' ? 'movement-layer.webp' : 'watch-rest.webp',
  );
  const sheet = (name: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 640;
    const image = new Image();
    image.onload = () => {
      if (!dead) {
        canvas.getContext('2d')?.drawImage(image, 0, 0);
        wake();
      }
    };
    image.src = assetUrl(`experiments/clockwork-hero/assets/${name}.svg`);
    return { image, canvas };
  };
  const frontSheet = sheet('front-exterior'),
    reverseSheet = sheet('reverse-exterior'),
    innerSheet = sheet('back-interior');
  const engraving: CoinTextures = {
    face: frontSheet.canvas,
    reverse: reverseSheet.canvas,
    blankFace: frontSheet.canvas,
    mintedFace: frontSheet.canvas,
    lastMint: 1,
  };
  const inner: CoinTextures = {
    face: innerSheet.canvas,
    reverse: innerSheet.canvas,
    blankFace: innerSheet.canvas,
    mintedFace: innerSheet.canvas,
    lastMint: 1,
  };
  const ready = () =>
    [movement, frontSheet.image, reverseSheet.image, innerSheet.image].every(
      (image) => image.complete && image.naturalWidth > 0,
    );
  return {
    draw(
      ctx: CanvasRenderingContext2D,
      textures: CoinTextures,
      start: CoinRenderPose,
      progress: number,
      width: number,
      height: number,
      seconds = 0,
    ) {
      if (!latched || latchWidth !== width) {
        latched = { ...start };
        latchWidth = width;
      }
      const rest = latched,
        s = clockworkState(progress),
        story = clockworkNarrative(progress),
        phone = width <= 760,
        tablet = width <= 1100;
      storyRoot ??= ctx.canvas.closest<HTMLElement>('[data-clockwork-story]');
      const audience = audienceHandoffState(
        storyRoot?.dataset.audienceHandoff === 'true' ? progress : 0,
      );
      const split = s.split * (1 - audience.close);
      ctx.canvas.dataset.coinStyle = style;
      const motion = mechanismMotionAt(reduced.matches ? 0 : seconds);
      // The physical focus has its own continuous handoff. The final invitation
      // remains on the economics deck; text reading gaps never move the object.
      const portrait = height > width;
      const targetRadius = heroServiceRadius(width, height);
      const warm = storyRoot?.dataset.heroStyle === 'warm';
      const serviceRadius = warm
        ? mix(
            rest.radius,
            targetRadius,
            clockPhase(progress, 0, 0.3),
          )
        : mix(rest.radius, targetRadius, s.enter);
      const sceneZoom = (1 + (warm ? 0.04 : 0) * s.enter).toFixed(5);
      if (sceneZoom !== lastSceneZoom) {
        setMotionStyle(storyRoot, '--warm-scene-zoom', sceneZoom);
        setMotionStyle(storyRoot,
          '--warm-camera-travel',
          s.enter.toFixed(5),
        );
        lastSceneZoom = sceneZoom;
      }
      const radius = mix(
        serviceRadius,
        Number(storyRoot?.dataset.dockRadius) || 60,
        audience.dock,
      );
      // Preserve the hero's authored rest pose, then converge on one centred
      // horizontal axis. Focus compensation keeps the selected deck anchored
      // while the surrounding mechanism separates.
      const x = mix(
        mix(rest.x, width * 0.5, s.enter),
        Number(storyRoot?.dataset.dockX) || width * 0.5,
        audience.dock,
      );
      // The silver landing keeps all three captions in one lower reading band.
      const centeredCaptions =
        tablet || !!ctx.canvas.closest('.silver-landing');
      const readingAnchor =
        storyRoot?.dataset.heroStyle === 'warm'
          ? 0.5
          : centeredCaptions
            ? height <= 640 && !portrait
              ? 0.48
              : 0.4
            : 0.5;
      // The opening turns and enlarges in place. Only the instrument handoff
      // moves into the lower-caption layout, after the closed coin has settled.
      const baseY = mix(
        mix(
          rest.y,
          height * readingAnchor,
          centeredCaptions ? clockPhase(progress, 0.3, 0.43) : s.enter,
        ),
        Number(storyRoot?.dataset.dockY) || height * 0.5,
        audience.dock,
      );
      ctx.canvas.dataset.coinCenterX = x.toFixed(2);
      ctx.canvas.dataset.coinCenterY = baseY.toFixed(2);
      const restingYaw = mix(rest.yaw, nearestIsometricYaw(rest.yaw), s.turn);
      // The assembled coin keeps its own clock while it settles into the frame.
      // Fade the rotation in after assembly so the cutaway layers stay aligned.
      // Integrate time instead of multiplying elapsed time by scroll progress:
      // the latter fast-forwards the accumulated turns while the frame shrinks.
      const dt =
        previousSeconds === undefined
          ? 0
          : Math.min(0.05, Math.max(0, seconds - previousSeconds));
      previousSeconds = seconds;
      if (audience.dock < 0.001) dockAngle = 0;
      if (!reduced.matches && audience.dock > 0.85)
        dockAngle += (dt * Math.PI) / 9;
      const yaw = restingYaw + dockAngle;
      // Facing selects the engraving, not the sign of the tilt: either visible
      // face has a positive camera normal after its nearest half-turn.
      const side = coinFacing(rest.yaw);
      // Instrument art uses a 38° horizontal-plane elevation, so the coin's
      // face tilt is its 52° complement (vertical ellipse ratio sin 38°).
      const camera = scrollCoinCamera(
        { ...opening, roll: rest.roll ?? 0 },
        s.turn,
        instruments ? ((90 - 38) * Math.PI) / 180 : ISOMETRIC_TILT,
      );
      const tilt = mix(camera.tilt, Math.PI / 6, audience.dock);
      ctx.canvas.dataset.coinFace = side > 0 ? 'front' : 'reverse';
      const ink = ready()
        ? coinWireframeProgress(progress) * (1 - audience.material)
        : 0;
      const exposed = clockPhase(split, 0, 0.12);
      // `original` owns the closed object until the split begins. During the
      // first split beat, its last outline yields to the separated shell pair.
      const closedAlpha = Math.max(s.original, 1 - exposed);
      // The exact same pose carries the material handoff: gold recedes while
      // blueprint contours arrive, with no opaque disc once the drawing wins.
      if (closedAlpha > 0.001)
        drawClosedCoin(
          ctx,
          textures,
          { x, y: baseY, radius, yaw, roll: camera.roll },
          {
            alpha: closedAlpha,
            tilt,
            reflection: 0.25,
            perspective: camera.perspective,
            wireframe: ink,
          },
        );
      if (ink < 0.001) return;
      const scale = radius / ART.radius;
      if (progress > 0.24) {
        instruments?.prepare();
        calibre?.prepare();
      }
      const detailed = instruments?.ready() ?? calibre?.ready() ?? false;
      const instrumentTime = reduced.matches ? 0 : seconds;
      const deck = mechanismDeckLayout(
        progress,
        baseY,
        radius,
        story.spread * (1 - audience.close),
        detailed,
      );
      const {
        strategy: strategyFocus,
        analysis: economicFocus,
        risk: riskFocus,
      } = deck.focus;
      // Copy and artwork share physical bounds; Consultation keeps the same
      // instrument anchor as the preceding service chapters.
      const instrumentTop = baseY - 270 * scale,
        instrumentBottom = baseY + 238 * scale;
      const geometry = {
        '--clock-instrument-top': instrumentTop,
        '--clock-instrument-bottom': instrumentBottom,
        '--clock-assembly-bottom': mix(
          Math.max(instrumentBottom, deck.analysisY + 238 * scale),
          instrumentBottom,
          story.invitation,
        ),
        '--clock-deck-half-height': 270 * scale,
        '--clock-strategy-y': deck.strategyY,
        '--clock-risk-y': deck.riskY,
        '--clock-analysis-y': deck.analysisY,
      };
      const bounds = Object.values(geometry)
        .map((value) => value.toFixed(2))
        .join(':');
      if (bounds !== lastInstrumentBounds) {
        storyRoot ??= ctx.canvas.closest<HTMLElement>('[data-clockwork-story]');
        for (const [name, value] of Object.entries(geometry))
          setMotionStyle(storyRoot, name, `${value.toFixed(2)}px`);
        ctx.canvas.dataset.strategyCenterY = deck.strategyY.toFixed(2);
        ctx.canvas.dataset.riskCenterY = deck.riskY.toFixed(2);
        ctx.canvas.dataset.analysisCenterY = deck.analysisY.toFixed(2);
        lastInstrumentBounds = bounds;
      }
      const shell = cutawayShell(split, radius);
      const { gap, middleY: y } = deck;
      const draw = (image: HTMLImageElement, offset: number, alpha: number) => {
        ctx.save();
        ctx.globalAlpha *= alpha;
        ctx.drawImage(
          image,
          x - ART.x * scale,
          y - ART.y * scale + offset,
          ART.width * scale,
          ART.height * scale,
        );
        ctx.restore();
      };
      const context =
        0.07 * (1 - story.invitation) +
        0.22 * Math.sin(Math.PI * audience.close);
      const riskContext = context;
      // Once separated, both shells become quiet registration ghosts behind
      // the selected instrument. The closed handoff above remains full weight.
      const coverGhost =
        ink *
        shell.coverAlpha *
        exposed *
        ((1 - story.invitation) * (1 - 0.9 * split) + 0.6 * audience.close);
      renderCoin(
        ctx,
        inner,
        { x, y: y + shell.separation + gap * 0.35, radius, yaw },
        {
          alpha: coverGhost,
          tilt,
          perspective: 0,
          halfDepth: 0.032,
          wireframe: true,
          vectorFace: coinVisibleFace(yaw) === 'face' ? 'reverse' : 'face',
        },
      );
      drawClosedCoin(
        ctx,
        textures,
        { x, y: y - shell.separation - gap * 0.35, radius, yaw },
        {
          alpha: coverGhost,
          tilt,
          perspective: 0,
          halfDepth: shell.coverDepth,
          wireframe: true,
        },
      );
      if (detailed && exposed > 0) {
        ctx.save();
        ctx.globalAlpha *= ink * exposed * (0.07 + 0.93 * economicFocus);
        if (instruments)
          instruments.draw(
            ctx,
            'analysis',
            x,
            deck.analysisY,
            scale,
            instrumentTime,
          );
        else
          calibre?.draw(
            ctx,
            'analysis',
            x,
            deck.analysisY,
            scale,
            motion.analysis,
            story.invitation,
          );
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha *=
        ink *
        exposed *
        (detailed ? riskContext + (1 - riskContext) * riskFocus : 1);
      const animated =
        exposed > 0 &&
        (instruments?.draw(ctx, 'risk', x, deck.riskY, scale, instrumentTime) ??
          watch?.draw(ctx, x, deck.riskY, scale, motion.watch));
      ctx.restore();
      if (!animated)
        draw(
          movement,
          0,
          ink *
            exposed *
            (detailed ? riskContext + (1 - riskContext) * riskFocus : 1),
        );
      if (detailed && exposed > 0) {
        ctx.save();
        ctx.globalAlpha *=
          ink * exposed * (context + (1 - context) * strategyFocus);
        if (instruments)
          instruments.draw(
            ctx,
            'strategy',
            x,
            deck.strategyY,
            scale,
            instrumentTime,
          );
        else
          calibre?.draw(
            ctx,
            'strategy',
            x,
            deck.strategyY,
            scale,
            motion.strategy,
          );
        ctx.restore();
      }
      ctx.canvas.dataset.calibre = detailed ? story.active : 'fallback';
      ctx.canvas.dataset.instrumentSet =
        instruments && detailed ? 'coin-systems-v2' : 'calibre';
      ctx.canvas.dataset.focusDeck =
        economicFocus > 0.5
          ? 'analysis'
          : strategyFocus > 0.5
            ? 'strategy'
            : 'risk';
      ctx.canvas.dataset.mechanismTime = seconds.toFixed(3);
    },
    reset() {
      latched = undefined;
    },
    destroy() {
      dead = true;
      watch?.destroy();
      calibre?.destroy();
      instruments?.destroy();
      for (const image of [
        movement,
        frontSheet.image,
        reverseSheet.image,
        innerSheet.image,
      ])
        image.onload = image.onerror = null;
    },
  };
}
