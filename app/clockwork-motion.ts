import {clockPhase} from './clockwork-model';

const TAU=Math.PI*2;

/** Physical subjects hand off once; economics keeps ownership through the CTA. */
export function mechanismFocusAt(progress:number){
  const p=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;
  const strategy=1-clockPhase(p,.59,.64);
  const analysis=clockPhase(p,.73,.78);
  return {strategy,risk:(1-strategy)*(1-analysis),analysis};
}

/** Artwork and captions share the same physical deck centres in either direction. */
export function mechanismDeckLayout(progress:number,centerY:number,radius:number,spread:number,detailed=true){
  const focus=mechanismFocusAt(progress);
  const gap=detailed?radius*.66*spread:0;
  const middleY=centerY+gap*(focus.strategy-focus.analysis);
  return {
    strategyY:middleY-gap,riskY:middleY,analysisY:middleY+gap,
    middleY,gap,focus,
  };
}

/** An onscreen clock: pauses preserve phase; long frame gaps cannot fast-forward it. */
export function advanceMechanismClock(seconds:number,delta:number,playing:boolean){
  const current=Number.isFinite(seconds)?Math.max(0,seconds):0;
  return current+(playing&&Number.isFinite(delta)?Math.max(0,Math.min(delta,1/30)):0);
}

/** Independent, calm instrument cycles. Scroll chooses the subject, never its phase. */
export function mechanismMotionAt(seconds:number){
  const time=Number.isFinite(seconds)?Math.max(0,seconds):0;
  return {
    strategy:.5-.42*Math.cos(TAU*(time%18)/18),
    analysis:.5-.40*Math.cos(TAU*(time%24)/24),
    // The escapement model advances two illustrative beats per second. Its
    // individual rotation atlases wrap without resetting the going train.
    watch:time/16,
  };
}
