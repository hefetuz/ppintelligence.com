import { clockPhase } from './clockwork-model';

export function founderSceneRunway(travel: number) {
  return (Number.isFinite(travel) ? Math.max(0, travel) : 0) * 0.18;
}

/** Keep light ink on the blueprint until the founder dissolve covers the scene. */
export function founderHeaderInk(cloud: number) {
  return clockPhase(Number.isFinite(cloud) ? cloud : 0, 0.3, 0.75);
}

/** The consultation has a full reading stop before the reversible scene reveal. */
export function founderTransitionState(progress: number) {
  const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  const presence = clockPhase(p, 0.82, 0.84);
  const cloud = clockPhase(p, 0.84, 0.98);
  // The outgoing instrument remains complete behind the opaque founder scene.
  // It departs only after the reveal has physically covered the viewport.
  const departure = clockPhase(p, 0.98, 1);
  return { cloud, departure, presence, obscured: cloud === 1 };
}

