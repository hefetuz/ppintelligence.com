/**
 * A deterministic, scroll-reversible illustration of a going train.
 * Compound wheels/pinions obey pitch distances and angular velocity ratios.
 * Escapement locking/impulse is an illustrative timing law, not a dynamics solver.
 */
export const TAU = Math.PI * 2;
export const WATCH_CAMERA = Object.freeze({
  width: 1440, height: 1320, origin: [720, 660], scale: 3.1,
  azimuth: 45, elevation: Math.atan(1 / Math.sqrt(2)) * 180 / Math.PI,
  outerRadius: 96,
});
export const MODULE = 0.8;
export const BEATS_PER_PROGRESS = 32;
const next = (p, distance, angle) => ({
  x: p.x + distance * Math.cos(angle), y: p.y + distance * Math.sin(angle),
});
const barrel = { id: 'barrel', x: -34, y: -24, teeth: 64, radius: 25.6, z: 8, height: 1.4, drumHeight: 1, spokes: 0 };
const centre = { id: 'centre', ...next(barrel, 32, 0), teeth: 64, radius: 25.6, z: 10.8, height: 1.25, spokes: 5, pinionTeeth: 16, pinionRadius: 6.4, pinionZ: 8 };
const third = { id: 'third', ...next(centre, 32, 0.39), teeth: 52, radius: 20.8, z: 13.6, height: 1.25, spokes: 5, pinionTeeth: 16, pinionRadius: 6.4, pinionZ: 10.8 };
const fourth = { id: 'fourth', ...next(third, 27.2, 1.51), teeth: 44, radius: 17.6, z: 16.4, height: 1.25, spokes: 4, pinionTeeth: 16, pinionRadius: 6.4, pinionZ: 13.6 };
const escape = { id: 'escape', ...next(fourth, 24, 2.62), teeth: 15, radius: 13, z: 19.2, height: 1.1, spokes: 3, pinionTeeth: 16, pinionRadius: 6.4, pinionZ: 16.4 };
const train = [barrel, centre, third, fourth, escape];
barrel.phase = 0;
barrel.ratio = 1;
for (let i = 1; i < train.length; i++) {
  const previous = train[i - 1], wheel = train[i];
  const contact = Math.atan2(wheel.y - previous.y, wheel.x - previous.x);
  // Tooth centre on one wheel meets the middle of a tooth space on the other.
  wheel.pinionPhase = contact + Math.PI -
    (Math.PI - previous.teeth * (contact - previous.phase)) / wheel.pinionTeeth;
  wheel.phase = wheel.pinionPhase;
  wheel.ratio = -previous.ratio * previous.teeth / wheel.pinionTeeth;
}
export const WATCH_TRAIN = Object.freeze(train.map(Object.freeze));
export const WATCH_BALANCE = Object.freeze({ id: 'balance', x: -35, y: 32, radius: 24, z: 12, amplitude: 0.82 });
export const WATCH_PALLET = Object.freeze({ id: 'pallet', x: escape.x - 18, y: escape.y, z: 19.2, amplitude: 0.105 });
export const WATCH_MESHES = Object.freeze(train.slice(1).map((wheel, i) => Object.freeze({
  driver: train[i].id, driven: wheel.id,
  distance: train[i].radius + wheel.pinionRadius,
  z: train[i].z, module: MODULE,
})));
const smooth = (a, b, value) => {
  const t = Math.min(1, Math.max(0, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** progress is a dimensionless scroll phase; no elapsed clock or history. */
export function movementAt(progress) {
  const p = Number.isFinite(progress) ? progress : 0;
  const beats = p * BEATS_PER_PROGRESS;
  const beat = Math.floor(beats);
  const fraction = beats - beat;
  const releasedBeats = beat + smooth(0.80, 1, fraction);
  const escapeTravel = releasedBeats * Math.PI / escape.teeth;
  const barrelTravel = escapeTravel / escape.ratio;
  const angles = Object.fromEntries(train.map(wheel =>
    [wheel.id, wheel.phase + barrelTravel * wheel.ratio]));
  angles.balance = Math.sin(Math.PI * beats) * WATCH_BALANCE.amplitude;
  angles.pallet = (beat % 2 === 0 ? -1 : 1) *
    (1 - 2 * smooth(0.80, 1, fraction)) * WATCH_PALLET.amplitude;
  return { angles, beats, releasedBeats, escapeTravel, barrelTravel };
}
/** Adjacent reprojected sprite frames; callers may crossfade by mix. */
export function sampleWatchAtlas(angle, { frames, mode = 'rotation', min = 0, max = TAU }) {
  const count = Math.max(1, frames);
  let value;
  if (mode === 'rotation') value = ((angle % TAU) + TAU) % TAU / TAU * count;
  else value = Math.min(1, Math.max(0, (angle - min) / (max - min))) * (count - 1);
  const first = Math.floor(value);
  return { first, second: mode === 'rotation' ? (first + 1) % count : Math.min(count - 1, first + 1), mix: value - first };
}
