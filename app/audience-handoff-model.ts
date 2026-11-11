import { clockPhase, clamp01 } from './clockwork-model';

/** Assembly finishes before the intact coin starts travelling to its frame. */
export function audienceHandoffState(progress: number) {
  const p = Number.isFinite(progress) ? clamp01(progress) : 0;
  return {
    close: clockPhase(p, 0.84, 0.915),
    dock: clockPhase(p, 0.915, 0.975),
    material: clockPhase(p, 0.91, 0.965),
    // The paper is uncovered spatially as the blue viewport contracts. This
    // channel now tracks header ink, never a full-screen white crossfade.
    paper: clockPhase(p, 0.915, 0.94),
    content: clockPhase(p, 0.94, 0.98),
    serviceExit: clockPhase(p, 0.835, 0.87),
  };
}

/** The existing founder dissolve now starts after the audience reading scene. */
export function audienceFounderProgress(rawProgress: number) {
  const raw = Number.isFinite(rawProgress) ? rawProgress : 0;
  return 0.82 + 0.18 * clamp01((raw - 1) / 0.18);
}

/** Keep the outgoing audience viewport pinned throughout the founder dissolve. */
export function audienceBaseTravel(totalTravel: number) {
  return Math.max(0, Number.isFinite(totalTravel) ? totalTravel : 0) / 1.18;
}
