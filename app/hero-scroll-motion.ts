import { clockPhase } from './clockwork-model';

/** Speed the first act, then settle to the original clock before its handoff. */
export function introPlaybackRate(time: number, end: number) {
  return 1 + 0.42 * (1 - clockPhase(time, Math.max(0, end - 0.85), end));
}

/** Shared, reversible physical exit. Reduced motion keeps the opacity cues. */
export function heroExitMotion(
  progress: number,
  width: number,
  _height: number,
  reduced = false,
) {
  const travel = reduced ? 0 : clockPhase(progress, 0, 0.28);
  return {
    travel,
    x: width * (width < 760 ? 0.4 : 0.34) * travel,
    y: 0,
    rotation: 0,
    scale: 1,
    handOpacity: 1 - clockPhase(progress, 0.13, 0.32),
    cloudOpacity: 1 - clockPhase(progress, 0.14, 0.34),
    cloudRetreat: travel,
  };
}
