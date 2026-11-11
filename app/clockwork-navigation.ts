/** Shared reading stops for controls, gestures, and scroll destinations. */
export const CHAPTERS = [
  {id:'strategy', hash:'#strategy', label:'Strategy', progress:.52},
  {id:'risk', hash:'#risk', label:'Risk', progress:.68},
  {id:'invitation', hash:'#economics', label:'Economic analysis', progress:.82},
] as const;

export const CHAPTER_ENTRY = .46;
export const CHAPTER_EXIT = 1;
export const WHEEL_QUIET_MS = 180;
export const WHEEL_THRESHOLD = 48;
const SETTLED_EPSILON = .012;
export type ChapterDirection = -1 | 1;

export function nearestChapterIndex(progress:number) {
  let best = 0;
  for (let i=1;i<CHAPTERS.length;i++) {
    if (Math.abs(CHAPTERS[i].progress-progress)<Math.abs(CHAPTERS[best].progress-progress)) best=i;
  }
  return best;
}

/** null means outward travel: the caller must let the page continue naturally. */
export function getChapterStep(progress:number, direction:ChapterDirection):number|null {
  if (!Number.isFinite(progress)) return null;
  if (direction===1) {
    const next=CHAPTERS.findIndex(chapter=>chapter.progress>progress+SETTLED_EPSILON);
    return next<0 ? null : next;
  }
  for (let i=CHAPTERS.length-1;i>=0;i--) {
    if (CHAPTERS[i].progress<progress-SETTLED_EPSILON) return i;
  }
  return null;
}

export type WheelState = {
  lastTime:number;
  direction:ChapterDirection|0;
  accumulated:number;
  latched:boolean;
};
export type ChapterWheelInput = {
  deltaY:number;
  deltaX?:number;
  deltaMode?:number;
  time:number;
  busy?:boolean;
  ctrlKey?:boolean;
  viewportHeight?:number;
};
export type ChapterWheelResult = {
  state:WheelState;
  kind:'native'|'consume'|'step';
  index?:number;
};
export const createWheelState = ():WheelState => ({lastTime:-Infinity,direction:0,accumulated:0,latched:false});

/**
 * Feed every wheel event; preventDefault only for consume/step, and scroll to
 * CHAPTERS[index] for step. busy describes the caller's running transition.
 * A gesture stays latched through momentum, including arrival at the last stop.
 * A fresh outward gesture releases the page. Reverse intent can rearm as soon
 * as the transition ends, without waiting for the same-direction quiet period.
 */
export function processWheel(previous:WheelState,input:ChapterWheelInput,progress:number):ChapterWheelResult {
  const native = ():ChapterWheelResult=>({state:createWheelState(),kind:'native'});
  if (!Number.isFinite(progress) || progress<CHAPTER_ENTRY || progress>CHAPTER_EXIT) return native();
  if (input.ctrlKey || !Number.isFinite(input.deltaY) || !Number.isFinite(input.time)) return native();
  if (Math.abs(input.deltaX??0)>Math.abs(input.deltaY) || input.deltaY===0) return native();
  const scale=input.deltaMode===1 ? 16 : input.deltaMode===2 ? (input.viewportHeight??800) : 1;
  const delta=input.deltaY*scale;
  const direction:ChapterDirection=delta>0 ? 1 : -1;
  const quiet=input.time-previous.lastTime>=WHEEL_QUIET_MS || input.time<previous.lastTime;
  const reversed=previous.direction!==0 && previous.direction!==direction;
  const state:WheelState=(quiet || (reversed && !input.busy)) ? createWheelState() : {...previous};
  state.lastTime=input.time;
  // Busy input is part of the existing gesture, even after a long frame gap.
  if (input.busy) {
    state.direction=direction;
    state.accumulated=0;
    state.latched=true;
    return {state,kind:'consume'};
  }
  if (state.latched) return {state,kind:'consume'};
  const index=getChapterStep(progress,direction);
  if (index===null) return native();
  state.direction=direction;
  state.accumulated+=Math.abs(delta);
  if (state.accumulated<WHEEL_THRESHOLD) return {state,kind:'consume'};
  state.accumulated=0;
  state.latched=true;
  return {state,kind:'step',index};
}
