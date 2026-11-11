import { assetUrl } from './asset-url';
import { coinIllustrationPaths, type CoinIllustrationStyle } from './coin-illustration-style';

type Atlas={src:string;frames:number;columns:number;rows:number;x:number;y:number;width:number;height:number;pixelScale?:number};
type LayerSpec={id:'strategy'|'analysis';rest:string;atlas?:Atlas;mobileAtlas?:Atlas};
type Manifest={width:number;height:number;origin:number[];layers:LayerSpec[];invitation?:string};
type Layer={spec:LayerSpec;rest:HTMLImageElement;atlasSpec?:Atlas;atlas?:HTMLImageElement;buffer?:HTMLCanvasElement;context?:CanvasRenderingContext2D|null;stamp:string};

/** Geometry is projected offline; only adjacent complete-deck frames are blended. */
export function createConsultingCalibreRenderer(wake:()=>void,style:CoinIllustrationStyle='anatomy'){
  const base=coinIllustrationPaths(style).calibre;
  const controller=new AbortController(),images:HTMLImageElement[]=[];
  let dead=false,manifest:Manifest|undefined,invitation:HTMLImageElement|undefined;
  const layers=new Map<string,Layer>();
  const load=(file:string)=>{
    const image=new Image();images.push(image);
    image.onload=()=>{if(!dead)wake();};
    image.src=assetUrl(`${base}/${file}`);return image;
  };
  const prepare=()=>{
    if(!manifest)return;
    for(const layer of layers.values()){
      const spec=innerWidth<760&&layer.spec.mobileAtlas?layer.spec.mobileAtlas:layer.spec.atlas;
      if(!spec||layer.atlasSpec?.src===spec.src)continue;
      if(layer.atlas){layer.atlas.onload=layer.atlas.onerror=null;const index=images.indexOf(layer.atlas);if(index>=0)images.splice(index,1);}
      layer.atlasSpec=spec;layer.atlas=load(spec.src);layer.stamp='';
      layer.buffer=document.createElement('canvas');
      layer.buffer.width=spec.width*(spec.pixelScale??1);layer.buffer.height=spec.height*(spec.pixelScale??1);
      layer.context=layer.buffer.getContext('2d');
    }
  };
  void fetch(assetUrl(`${base}/manifest.json`),{signal:controller.signal})
    .then(response=>{if(!response.ok)throw new Error('Calibre unavailable');return response.json() as Promise<Manifest>;})
    .then(spec=>{if(dead)return;manifest=spec;for(const layer of spec.layers)layers.set(layer.id,{spec:layer,rest:load(layer.rest),stamp:''});if(spec.invitation)invitation=load(spec.invitation);wake();})
    .catch(()=>{/* The existing watch illustration remains a complete fallback. */});
  const loaded=(image:HTMLImageElement|undefined)=>!!image&&image.complete&&image.naturalWidth>0;
  return {
    ready:()=>!!manifest&&layers.size===2&&Array.from(layers.values()).every(layer=>loaded(layer.rest)),
    prepare,
    draw(ctx:CanvasRenderingContext2D,id:'strategy'|'analysis',x:number,y:number,scale:number,progress:number,finale=0){
      if(!manifest)return false;
      const layer=layers.get(id);if(!layer||!loaded(layer.rest))return false;
      const left=x-manifest.origin[0]*scale,top=y-manifest.origin[1]*scale;
      const whole=(image:HTMLImageElement)=>ctx.drawImage(image,left,top,manifest!.width*scale,manifest!.height*scale);
      const spec=layer.atlasSpec;
      if(spec&&layer.atlas&&loaded(layer.atlas)&&layer.buffer&&layer.context){
        const position=Math.max(0,Math.min(1,progress))*(spec.frames-1);
        const first=Math.floor(position),second=Math.min(spec.frames-1,first+1);
        const blend=Math.round((position-first)*256)/256,stamp=`${first}:${second}:${blend}`;
        if(layer.stamp!==stamp){
          const {context,buffer,atlas}=layer;
          context.clearRect(0,0,buffer.width,buffer.height);
          const pixelWidth=buffer.width,pixelHeight=buffer.height;
          const cell=(index:number,alpha:number)=>{context.globalAlpha=alpha;context.drawImage(atlas,(index%spec.columns)*pixelWidth,Math.floor(index/spec.columns)*pixelHeight,pixelWidth,pixelHeight,0,0,pixelWidth,pixelHeight);};
          context.globalCompositeOperation='source-over';cell(first,1-blend);
          context.globalCompositeOperation='lighter';cell(second,blend);
          context.globalCompositeOperation='source-over';context.globalAlpha=1;layer.stamp=stamp;
        }
        ctx.drawImage(layer.buffer,left+spec.x*scale,top+spec.y*scale,spec.width*scale,spec.height*scale);
      }else whole(layer.rest);
      // This is a transparent inlay on the existing comparator dial, so the
      // same gears and hand keep moving beneath it throughout the invitation.
      if(id==='analysis'&&finale>0&&loaded(invitation)){ctx.save();ctx.globalAlpha*=finale;whole(invitation!);ctx.restore();}
      return true;
    },
    destroy(){dead=true;controller.abort();for(const image of images)image.onload=image.onerror=null;for(const layer of layers.values())if(layer.buffer)layer.buffer.width=layer.buffer.height=1;layers.clear();},
  };
}
