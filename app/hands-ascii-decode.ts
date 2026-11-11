import { createAsciiReveal } from 'ascii-reveal/core';

/** The library owns the Decode glyphs and its radial center wave. */
export function createHandsAsciiDecode(mount: HTMLElement, blueprint = false) {
  const layer = document.createElement('div');
  const image = document.createElement('img');
  image.alt = '';
  layer.setAttribute('aria-hidden', 'true');
  Object.assign(layer.style, {position:'fixed',inset:'0',zIndex:'60',pointerEvents:'none',display:'none',color:'#c5cdd5'});
  Object.assign(image.style, {position:'absolute',inset:'0',width:'100%',height:'100%',objectFit:'fill'});
  layer.appendChild(image);
  mount.appendChild(layer);
  let controller: ReturnType<typeof createAsciiReveal> | undefined;
  let disposed = false;
  return {
    snapshot(source: HTMLCanvasElement, _x:number, _y:number, _width:number, _height:number) {
      if (!disposed) image.src = source.toDataURL('image/png');
    },
    async reveal() {
      await image.decode().catch(() => {});
      if (disposed) return;
      layer.style.display = 'block';
      controller = createAsciiReveal(layer, {
        preset:blueprint ? 'blueprint' : 'decode', origin:'center', duration:blueprint ? 'cinematic' : 'fast', speed:blueprint ? 0.85 : 1.2,
        lazy:false, media:'img', fallback:true,
      });
      await controller.reveal();
    },
    update(_now?:number) {},
    diagnostics() {return {preset:blueprint ? 'blueprint' : 'decode',origin:'center',engine:'ascii-reveal'};},
    destroy() {disposed=true;controller?.destroy();layer.remove();},
  };
}
