import { createHandsAsciiDecode } from './hands-ascii-decode';

export type WarmHeroAsciiGroup = 'atmosphere' | 'hands';
type ImageGroups = Record<WarmHeroAsciiGroup, HTMLImageElement[]>;

/** Freeze each entrance group once, then let the ASCII effect reveal that
 * snapshot. No live readbacks, workers, or per-frame image resampling. */
export function createWarmHeroAscii(mount: HTMLElement, images: ImageGroups) {
  let destroyed = false;
  let sampledSize = '';
  let snapshots = 0;
  mount.dataset.asciiEntrance = 'running';
  let sky: HTMLCanvasElement | null = null;
  const saved = new Map<HTMLImageElement, string>();
  const active = new Map<
    WarmHeroAsciiGroup,
    {
      canvas: HTMLCanvasElement;
      context: CanvasRenderingContext2D;
      reveal: ReturnType<typeof createHandsAsciiDecode>;
      promise?: Promise<void>;
    }
  >();
  const finished = new Set<WarmHeroAsciiGroup>();
  for (const image of [...images.atmosphere, ...images.hands]) {
    saved.set(image, image.style.visibility);
    image.style.visibility = 'hidden';
  }
  const restore = (group: WarmHeroAsciiGroup) => {
    for (const image of images[group])
      image.style.visibility = saved.get(image) ?? '';
  };
  const sample = (group: WarmHeroAsciiGroup) => {
    const state = active.get(group);
    if (!state) return;
    const width = document.documentElement.clientWidth;
    const height = innerHeight;
    const scale = Math.min(1, 1024 / Math.max(width, height));
    const pixelWidth = Math.max(1, Math.round(width * scale));
    const pixelHeight = Math.max(1, Math.round(height * scale));
    state.canvas.width = pixelWidth;
    state.canvas.height = pixelHeight;
    const ctx = state.context;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, width, height);
    for (const image of images[group]) {
      if (!image.complete || !image.naturalWidth) continue;
      const box = image.getBoundingClientRect();
      if (!box.width || !box.height) continue;
      const hand = image.closest<HTMLElement>('.reference-hand-pose');
      const cloud = image.closest<HTMLElement>('.reference-cloud');
      ctx.save();
      if (hand) {
        const clip = hand.getBoundingClientRect();
        const left = hand.classList.contains('reference-hand-left');
        ctx.beginPath();
        ctx.rect(
          clip.x + (left ? 0 : clip.width / 2),
          clip.y,
          clip.width / 2,
          clip.height,
        );
        ctx.clip();
      }
      // The depth renderer sets source image opacity to zero. Read only the
      // authored plane opacity, never that renderer-owned source opacity.
      ctx.globalAlpha = (cloud ? Number(getComputedStyle(cloud).opacity) : 1) * Number(getComputedStyle(image).opacity);
      // Capture the same shallow cloud lens once; never animate CSS blur.
      if (cloud && !cloud.classList.contains('reference-cloud-far'))
        ctx.filter = 'blur(3.5px)';
      if (image.closest('.reference-sky')) {
        // Match the existing full-hero cover crop without stretching the sky.
        const scale = Math.max(
          box.width / image.naturalWidth,
          box.height / image.naturalHeight,
        );
        const w = image.naturalWidth * scale,
          h = image.naturalHeight * scale;
        sky ??= document.createElement('canvas');
        if (sky.width !== pixelWidth) sky.width = pixelWidth;
        if (sky.height !== pixelHeight) sky.height = pixelHeight;
        const skyContext = sky.getContext('2d');
        if (!skyContext) {
          ctx.restore();
          continue;
        }
        skyContext.setTransform(scale, 0, 0, scale, 0, 0);
        skyContext.clearRect(0, 0, width, height);
        skyContext.drawImage(
          image,
          box.x + (box.width - w) / 2,
          box.y + (box.height - h) / 2,
          w,
          h,
        );
        skyContext.save();
        skyContext.globalCompositeOperation = 'destination-in';
        const phone = width <= 650;
        skyContext.translate(box.x + box.width / 2, box.y + box.height / 2);
        skyContext.scale(
          box.width * (phone ? 0.8 : 0.68),
          box.height * (phone ? 0.43 : 0.54),
        );
        const mask = skyContext.createRadialGradient(0, 0, 0, 0, 0, 1);
        mask.addColorStop(phone ? 0.15 : 0.12, '#000');
        mask.addColorStop(0.36, phone ? '#000000c0' : '#000000d1');
        mask.addColorStop(0.64, phone ? '#00000040' : '#00000059');
        mask.addColorStop(phone ? 0.95 : 0.94, '#00000000');
        skyContext.fillStyle = mask;
        skyContext.fillRect(-3, -3, 6, 6);
        skyContext.restore();
        ctx.drawImage(sky, 0, 0, pixelWidth, pixelHeight, 0, 0, width, height);
      } else ctx.drawImage(image, box.x, box.y, box.width, box.height);
      ctx.restore();
    }
    // Match the static radial masks used by the real sketch planes.
    const sketch = group === 'hands'
      ? images[group].find(image => image.closest('.reference-hand-pose'))?.closest<HTMLElement>('.reference-scene')
      : images[group].find(image => image.closest('.reference-cloud-far'))?.closest<HTMLElement>('.reference-cloud-far');
    if (sketch) {
      const box = sketch.getBoundingClientRect();
      if (box.width && box.height) {
        ctx.save(); ctx.globalCompositeOperation = 'destination-in';
        ctx.translate(box.x + box.width*.5, box.y + box.height*.48);
        ctx.scale(box.width*(group === 'hands' ? .47 : .7), box.height*(group === 'hands' ? .95 : .86));
        const mask = ctx.createRadialGradient(0,0,0,0,0,1);
        if (group === 'hands') {mask.addColorStop(0,'#000');mask.addColorStop(1,'#000');}
        else {mask.addColorStop(.2,'#000');mask.addColorStop(.54,'#000b');mask.addColorStop(1,'#0000');}
        ctx.fillStyle = mask;ctx.fillRect(-3,-3,6,6);ctx.restore();
      }
    }
    state.reveal.snapshot(state.canvas, 0, 0, width, height);
    sampledSize = `${width}:${height}`;
    mount.dataset.asciiSnapshots = String(++snapshots);
    mount.dataset.asciiSamplePixels = String(pixelWidth * pixelHeight);
  };
  const finish = (group: WarmHeroAsciiGroup) => {
    if (finished.has(group)) return;
    finished.add(group);
    restore(group);
    const state = active.get(group);
    if (state) {
      mount.dataset[`${group}AsciiStats`] = JSON.stringify(
        state.reveal.diagnostics(),
      );
      state.reveal.destroy();
      state.canvas.width = state.canvas.height = 1;
      active.delete(group);
    }
    mount.dataset[`${group}Reveal`] = 'image';
    if (finished.size === 2) {
      mount.dataset.asciiEntrance = 'complete';
      if (sky) sky.width = sky.height = 1;
      sky = null;
    }
  };
  const prepareGroup = async (group: WarmHeroAsciiGroup) => {
    if (destroyed || finished.has(group) || active.has(group)) return;
    await Promise.all(
      images[group].map((image) => image.decode().catch(() => {})),
    );
    if (destroyed || finished.has(group) || active.has(group)) return;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      finish(group);
      return;
    }
    const reveal = createHandsAsciiDecode(mount, group === 'hands');
    active.set(group, { canvas, context, reveal });
    sample(group);
  };
  return {
    async prepare() {
      await prepareGroup('atmosphere');
      await prepareGroup('hands');
      if (!destroyed) mount.dataset.asciiPrepared = 'true';
    },
    async reveal(group: WarmHeroAsciiGroup): Promise<void> {
      if (destroyed || finished.has(group)) return Promise.resolve();
      const previous = active.get(group);
      if (previous?.promise) return previous.promise;
      await prepareGroup(group);
      if (destroyed || finished.has(group)) return;
      const state = active.get(group);
      if (!state) return;
      mount.dataset[`${group}Reveal`] = 'ascii';
      state.promise = state.reveal
        .reveal()
        .catch(() => {
          state.reveal.destroy();
        })
        .then(() => {
          if (!destroyed) finish(group);
        });
      return state.promise;
    },
    update(now = performance.now()) {
      if (destroyed || !active.size) return;
      if (
        sampledSize !== `${document.documentElement.clientWidth}:${innerHeight}`
      )
        for (const group of active.keys()) sample(group);
      for (const state of active.values()) state.reveal.update(now);
    },
    complete() {
      for (const state of active.values()) state.reveal.destroy();
      for (const group of ['atmosphere', 'hands'] as const) finish(group);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      for (const state of active.values()) {
        state.reveal.destroy();
        state.canvas.width = state.canvas.height = 1;
      }
      active.clear();
      if (sky) sky.width = sky.height = 1;
      sky = null;
      for (const [image, visibility] of saved)
        image.style.visibility = visibility;
      delete mount.dataset.asciiEntrance;
    },
  };
}
