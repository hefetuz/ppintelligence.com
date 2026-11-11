export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const ISOMETRIC_TILT = Math.acos(1 / Math.sqrt(3));
export const nearestIsometricYaw = (angle: number) => Math.round(angle / Math.PI) * Math.PI;
/** Which real engraving faces the viewer at the start of the scroll. */
export const coinFacing = (angle: number) => Math.cos(nearestIsometricYaw(angle)) >= 0 ? 1 : -1;
/** The closed coin retains its volume; only separated covers become thinner. */
export function cutawayShell(split: number, radius: number) {
  const t=clamp01(split), coverDepth=.115+(.032-.115)*t;
  return { coverDepth, separation:radius*(1.08*t+(.115-coverDepth)*Math.sin(ISOMETRIC_TILT)), coverAlpha:1-.985*clockPhase(t,.68,1) };
}
export function clockworkLayout(search: string) {
  return new URLSearchParams(search).get('clock-layout') === 'center' ? 'center' : 'split';
}
export function nearestCutawayYaw(angle: number) {
  // Four equivalent oblique views per revolution. Never unwind accumulated turns.
  let best = angle, delta = Infinity;
  const centre = Math.round(angle / Math.PI);
  for (let k=centre-1;k<=centre+1;k++) for(const side of [-1,1]) {
    const candidate = k * Math.PI + side * .82;
    if (Math.abs(candidate-angle)<delta) { best=candidate;delta=Math.abs(candidate-angle); }
  }
  return best;
}
export function followScroll(current: number, target: number, seconds: number) {
  return current + (target-current) * (1-Math.exp(-Math.min(seconds,.05)/.12));
}
export const clockPhase = (p: number, from: number, to: number) => {
  const t = clamp01((p - from) / (to - from));
  return t * t * (3 - 2 * t);
};
export const CLOCKWORK_ANCHORS: Readonly<Record<string, number>> = {
  '#inside-the-penny': .22, '#expertise-heading': .52, '#strategy': .52,
  '#risk': .68, '#economics': .82, '#technology': .82, '#economic-analysis': .82,
  '#clockwork-heading': .82,
  '#audience-heading': .99, '#audience': .99,
  '#services': .52, '#introduction': 0,
};
const readingBeat = (p:number, enter:number, settled:number, leave:number, gone:number) =>
  clockPhase(p,enter,settled)*(1-clockPhase(p,leave,gone));
/** Reading visibility and semantic ownership share this reversible scroll score. */
export function clockworkNarrative(progress:number) {
  const p=clamp01(progress);
  // Copy leaves completely before the next owner enters. The short quiet beats
  // keep long display lines from becoming a single illegible crossfade.
  const strategy=readingBeat(p,.43,.48,.57,.60);
  const risk=readingBeat(p,.61,.64,.72,.75);
  const economics=0;
  const invitation=clockPhase(p,.76,.79);
  return {
    discovery:readingBeat(p,.12,.20,.26,.34),strategy,risk,economics,invitation,
    section:clockPhase(p,.36,.43),
    active:p<.43?'discovery':p<.605?'strategy':p<.755?'risk':'invitation',
    spread:clockPhase(p,.39,.51)*(1-.42*clockPhase(p,.89,.97)),
    // Kept for renderer compatibility while its time-based travel is integrated.
    strategyTravel:clockPhase(p,.43,.58),riskTravel:clockPhase(p,.60,.74),
    analysisTravel:clockPhase(p,.74,.88),
  };
}
/** Every visual state is a pure function of scroll, including reverse travel. */
export function clockworkState(progress: number) {
  const p = clamp01(progress);
  return {
    p,
    enter: clockPhase(p, 0, .19),
    turn: clockPhase(p, 0, .30),
    split: clockPhase(p, .39, .51),
    focus: clockPhase(p, .56, .79),
    message: clockPhase(p, .87, .92),
    frame: Math.round(clockPhase(p, .25, .97) * 60),
    original: 1 - clockPhase(p, .30, .39),
  };
}
