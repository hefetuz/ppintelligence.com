import { assetUrl } from './asset-url';
import { coinIllustrationPaths, type CoinIllustrationStyle } from './coin-illustration-style';
import { movementAt, sampleWatchAtlas } from './watch-movement-model.mjs';

type Atlas = {
  id:string;src:string;frames:number;mode:string;min:number;max:number;
  columns:number;rows:number;x:number;y:number;width:number;height:number;
};
type Manifest = {
  width:number;height:number;origin:number[];base:string;foreground:string;
  fallback:string;drawOrder:string[];atlases:Atlas[];
};
type Rotor = { spec:Atlas;image:HTMLImageElement;buffer:HTMLCanvasElement;context:CanvasRenderingContext2D|null;stamp:string };

/** Reprojected solid parts; no screen-space rotation of an isometric bitmap. */
export function createWatchMovementRenderer(wake:()=>void,style:CoinIllustrationStyle='anatomy'){
  const assets=coinIllustrationPaths(style).watch;
  const abort=new AbortController(),images:HTMLImageElement[]=[];
  let dead=false,manifest:Manifest|undefined,base:HTMLImageElement|undefined,foreground:HTMLImageElement|undefined;
  const rotors=new Map<string,Rotor>();
  const load=(name:string)=>{
    const image=new Image();images.push(image);
    image.onload=()=>{if(!dead)wake();};
    image.src=assetUrl(`${assets}/${name}`);
    return image;
  };
  void fetch(assetUrl(`${assets}/watch-manifest.json`),{signal:abort.signal})
    .then(response=>{if(!response.ok)throw new Error('Movement assets unavailable');return response.json() as Promise<Manifest>;})
    .then(spec=>{
      if(dead)return;
      manifest=spec;base=load(spec.base);foreground=load(spec.foreground);
      for(const atlas of spec.atlases){
        const buffer=document.createElement('canvas');buffer.width=atlas.width;buffer.height=atlas.height;
        rotors.set(atlas.id,{spec:atlas,image:load(atlas.src),buffer,context:buffer.getContext('2d'),stamp:''});
      }
    }).catch(()=>{/* Keep the previous illustrated movement if assets fail. */});
  const ready=()=>!!manifest&&images.length===manifest.atlases.length+2&&images.every(image=>image.complete&&image.naturalWidth>0);
  return {
    draw(ctx:CanvasRenderingContext2D,x:number,y:number,scale:number,progress:number){
      if(!ready()||!manifest||!base||!foreground)return false;
      const state=movementAt(progress),left=x-manifest.origin[0]*scale,top=y-manifest.origin[1]*scale;
      const whole=(image:HTMLImageElement)=>ctx.drawImage(image,left,top,manifest!.width*scale,manifest!.height*scale);
      for(const part of manifest.drawOrder){
        if(part==='base'){whole(base);continue;}
        if(part==='foreground'){whole(foreground);continue;}
        const rotor=rotors.get(part);
        if(!rotor?.context)continue;
        const {spec,image,context,buffer}=rotor;
        const sample=sampleWatchAtlas(state.angles[part],spec);
        const blend=Math.round(sample.mix*256)/256,stamp=`${sample.first}:${sample.second}:${blend}`;
        if(stamp!==rotor.stamp){
          context.clearRect(0,0,buffer.width,buffer.height);
          const cell=(index:number,alpha:number)=>{
            context.globalAlpha=alpha;
            context.drawImage(image,(index%spec.columns)*spec.width,Math.floor(index/spec.columns)*spec.height,spec.width,spec.height,0,0,spec.width,spec.height);
          };
          // Premultiplied interpolation preserves the solid part's opacity.
          context.globalCompositeOperation='source-over';cell(sample.first,1-blend);
          context.globalCompositeOperation='lighter';cell(sample.second,blend);
          context.globalCompositeOperation='source-over';context.globalAlpha=1;
          rotor.stamp=stamp;
        }
        ctx.drawImage(buffer,left+spec.x*scale,top+spec.y*scale,spec.width*scale,spec.height*scale);
      }
      ctx.canvas.dataset.watchPhase=progress.toFixed(4);
      return true;
    },
    destroy(){dead=true;abort.abort();for(const image of images)image.onload=image.onerror=null;for(const rotor of rotors.values())rotor.buffer.width=rotor.buffer.height=1;rotors.clear();},
  };
}
