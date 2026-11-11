import { assetUrl } from './asset-url';
import {coinSystems,iso,depthOf,pathOf,lineOnTop,ring,type Point3,type Projection} from './coin-systems-motion.mjs';

export const SERVICE_INSTRUMENT_ASSETS = 'illustrations/coin-systems-v2';
export type ServiceInstrument = 'strategy' | 'risk' | 'analysis';
type Atlas = {src:string;frames:number;columns:number;rows:number;x:number;y:number;width:number;height:number;pixelScale:number};
type TranslationMotion = {kind:'translate';base:string;moving:string;axis:[number,number];rest:number;offset:number;amplitude:number};
type StrokeSpec={id:string;d:string;stroke:string;width:number;clips:string[]};
type PartSpec={id:string;key:number;lines:StrokeSpec[];sprite?:{x:number;y:number;width:number;height:number;left:number;top:number}};
type ContinuousSpec={src:string;pixelScale:number;projection:Projection;registration:number;parts:PartSpec[]};
type LayerSpec = {id:ServiceInstrument;rest:string;atlas?:Atlas;mobileAtlas?:Atlas;period:number;motion?:TranslationMotion;continuous?:ContinuousSpec};
type Manifest = {width:number;height:number;origin:[number,number];layers:LayerSpec[]};
type Layer = {spec:LayerSpec;rest:HTMLImageElement;base?:HTMLImageElement;moving?:HTMLImageElement;atlas?:HTMLImageElement;atlasSpec?:Atlas;buffer?:HTMLCanvasElement;context?:CanvasRenderingContext2D|null;stamp:string;parts?:HTMLImageElement;offsets?:Map<string,Point3>;paths?:Map<string,Path2D>;clips?:Map<string,Path2D>;time?:number};

/** Cached rigid surfaces and live vector strokes share the authored projection.
 * Motion is evaluated at actual time, with no temporal sampling or crossfade. */
export function createServiceInstrumentRenderer(wake:()=>void,fill:'solid'|'outline'='outline') {
  const assets=fill==='outline'?`${SERVICE_INSTRUMENT_ASSETS}/outline`:SERVICE_INSTRUMENT_ASSETS;
  const controller=new AbortController(),images=new Set<HTMLImageElement>();
  const layers=new Map<ServiceInstrument,Layer>();
  let dead=false,manifest:Manifest|undefined,prepared=false;
  const load=(file:string)=>{
    const image=new Image();images.add(image);
    image.onload=()=>{if(!dead)wake();};
    image.src=assetUrl(`${assets}/${file}`);
    return image;
  };
  const loaded=(image:HTMLImageElement|undefined)=>!!image&&image.complete&&image.naturalWidth>0;
  const prepare=()=>{
    prepared=true;
    for(const layer of layers.values()){
      if(layer.spec.motion)continue;
      if(layer.spec.continuous){
        layer.parts??=load(layer.spec.continuous.src);
        layer.offsets??=new Map();layer.paths??=new Map();layer.clips??=new Map();
        continue;
      }
      const spec=innerWidth<760?layer.spec.mobileAtlas:layer.spec.atlas;
      if(!spec)continue;
      if(layer.atlasSpec?.src===spec.src)continue;
      if(layer.atlas){layer.atlas.onload=layer.atlas.onerror=null;images.delete(layer.atlas);}
      layer.atlasSpec=spec;layer.atlas=load(spec.src);layer.stamp='';
      layer.buffer??=document.createElement('canvas');
      layer.buffer.width=Math.round(spec.width*spec.pixelScale);
      layer.buffer.height=Math.round(spec.height*spec.pixelScale);
      layer.context=layer.buffer.getContext('2d');
    }
  };
  void fetch(assetUrl(`${assets}/manifest.json`),{signal:controller.signal})
    .then(response=>{if(!response.ok)throw new Error('Service instruments unavailable');return response.json() as Promise<Manifest>;})
    .then(spec=>{
      if(dead)return;
      manifest=spec;
      for(const layer of spec.layers)layers.set(layer.id,{spec:layer,rest:load(layer.rest),...(layer.motion?{base:load(layer.motion.base),moving:load(layer.motion.moving)}:{}),stamp:''});
      if(prepared)prepare();
      wake();
    })
    .catch(()=>{/* The existing intact movement remains the loading fallback. */});
  return {
    ready:()=>!!manifest&&layers.size===3&&Array.from(layers.values()).every(layer=>loaded(layer.rest)),
    prepare,
    draw(ctx:CanvasRenderingContext2D,id:ServiceInstrument,x:number,y:number,scale:number,seconds:number){
      const layer=layers.get(id);
      if(!manifest||!layer||!loaded(layer.rest))return false;
      const left=x-manifest.origin[0]*scale,top=y-manifest.origin[1]*scale;
      const motion=layer.spec.motion;
      const continuous=layer.spec.continuous;
      if(continuous&&loaded(layer.parts)){
        const {projection:P,registration,pixelScale}=continuous;
        const time=((seconds%layer.spec.period)+layer.spec.period)%layer.spec.period;
        const offsets=layer.offsets!,paths=layer.paths!,clips=layer.clips!;
        if(layer.time!==time){
          const system=coinSystems[id];
          system.animate(null,system.stateAt(time),{k:{iso,pathOf,lineOnTop,ring},P,
            move:(name,offset)=>offsets.set(name,offset),
            path:(name,d)=>paths.set(name,new Path2D(d)),
          });
          layer.time=time;
        }
        const zero=iso([0,0,0],P),origin=manifest.origin;
        const ordered=continuous.parts.map(part=>{
          const offset=offsets.get(part.id)??[0,0,0];
          return {part,offset,key:part.key+depthOf(offset,P)};
        }).sort((a,b)=>a.key-b.key);
        for(const {part,offset}of ordered){
          const at=iso(offset,P),dx=(at[0]-zero[0])*registration,dy=(at[1]-zero[1])*registration;
          const sprite=part.sprite;
          if(sprite)ctx.drawImage(layer.parts!,sprite.x,sprite.y,sprite.width,sprite.height,left+(sprite.left+dx)*scale,top+(sprite.top+dy)*scale,sprite.width/pixelScale*scale,sprite.height/pixelScale*scale);
          if(!part.lines.length)continue;
          ctx.save();
          ctx.translate(left+(origin[0]+dx)*scale,top+(origin[1]+dy)*scale);
          ctx.scale(registration*scale,registration*scale);ctx.translate(-zero[0],-zero[1]);
          ctx.lineCap='round';ctx.lineJoin='round';
          for(const line of part.lines){
            ctx.save();
            for(const d of line.clips){if(!clips.has(d))clips.set(d,new Path2D(d));ctx.clip(clips.get(d)!);}
            ctx.strokeStyle=line.stroke;ctx.lineWidth=line.width/registration;
            if(!paths.has(line.id))paths.set(line.id,new Path2D(line.d));
            ctx.stroke(paths.get(line.id)!);ctx.restore();
          }
          ctx.restore();
        }
        ctx.canvas.dataset[`service${id[0].toUpperCase()+id.slice(1)}Time`]=time.toFixed(4);
        ctx.canvas.dataset.instrumentRenderer='continuous-parts';
        ctx.canvas.dataset.instrumentFill=fill;
        return true;
      }
      if(motion&&loaded(layer.base)&&loaded(layer.moving)){
        // These two assemblies are rigid translations. Drawing their authored
        // SVG derivatives separately keeps every fine line sharp at any time.
        const phase=(((seconds/layer.spec.period)%1)+1)%1;
        const distance=motion.offset+motion.amplitude*Math.cos(phase*Math.PI*2)-motion.rest;
        ctx.drawImage(layer.base!,left,top,manifest.width*scale,manifest.height*scale);
        ctx.drawImage(layer.moving!,left+motion.axis[0]*distance*scale,top+motion.axis[1]*distance*scale,manifest.width*scale,manifest.height*scale);
        ctx.canvas.dataset[`service${id[0].toUpperCase()+id.slice(1)}Frame`]=String(Math.floor(phase*1000));
        return true;
      }
      const spec=layer.atlasSpec;
      if(spec&&loaded(layer.atlas)&&layer.buffer&&layer.context){
        // The last sample is followed by the first, with no dwell or reset.
        const position=(((seconds/layer.spec.period)%1)+1)%1*spec.frames;
        const first=Math.floor(position),second=(first+1)%spec.frames;
        const blend=Math.round((position-first)*256)/256,stamp=`${first}:${second}:${blend}`;
        const frameKey=`service${id[0].toUpperCase()+id.slice(1)}Frame`;
        const frameValue=String(first);
        if(ctx.canvas.dataset[frameKey]!==frameValue)ctx.canvas.dataset[frameKey]=frameValue;
        if(layer.stamp!==stamp){
          const {context,buffer}=layer,w=buffer.width,h=buffer.height;
          context.clearRect(0,0,w,h);
          const cell=(index:number,alpha:number)=>{
            context.globalAlpha=alpha;
            context.drawImage(layer.atlas!,index%spec.columns*w,Math.floor(index/spec.columns)*h,w,h,0,0,w,h);
          };
          context.globalCompositeOperation='source-over';cell(first,1-blend);
          context.globalCompositeOperation='lighter';cell(second,blend);
          context.globalCompositeOperation='source-over';context.globalAlpha=1;layer.stamp=stamp;
        }
        ctx.drawImage(layer.buffer,left+spec.x*scale,top+spec.y*scale,spec.width*scale,spec.height*scale);
      }else{
        ctx.drawImage(layer.rest,left,top,manifest.width*scale,manifest.height*scale);
      }
      return true;
    },
    destroy(){
      dead=true;controller.abort();
      for(const image of images)image.onload=image.onerror=null;
      for(const layer of layers.values())if(layer.buffer)layer.buffer.width=layer.buffer.height=1;
      layers.clear();images.clear();
    },
  };
}
