'use client';

import { useEffect, useRef } from 'react';

/** Native pointer coordinates are the artwork's fingertip, not its centre. */
export default function ArtCursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const cursor = ref.current;
    if (!cursor) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    let ready = false;
    const image = new Image();
    image.onload = () => { ready = true; };
    image.src = '/cursor.png';
    const hide = () => {
      cursor.dataset.visible = 'false';
      cursor.dataset.pressed = 'false';
      document.documentElement.classList.remove('art-cursor-active');
    };
    const move = (event: PointerEvent) => {
      if (!fine.matches || event.pointerType !== 'mouse' || !ready) { hide(); return; }
      // Immediate tracking: adding pointer lag would disconnect the touch effect.
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      cursor.dataset.visible = 'true';
      cursor.dataset.action = (event.target as Element)?.closest('a, button') ? 'true' : 'false';
      document.documentElement.classList.add('art-cursor-active');
    };
    const press = () => { cursor.dataset.pressed = 'true'; };
    const release = () => { cursor.dataset.pressed = 'false'; };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', press, { passive: true });
    window.addEventListener('pointerup', release, { passive: true });
    window.addEventListener('pointercancel', release, { passive: true });
    window.addEventListener('blur', hide);
    document.documentElement.addEventListener('pointerleave', hide);
    window.addEventListener('keydown', hide);
    fine.addEventListener('change', hide);
    return () => {
      hide(); image.onload = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', press);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', hide);
      document.documentElement.removeEventListener('pointerleave', hide);
      window.removeEventListener('keydown', hide);
      fine.removeEventListener('change', hide);
    };
  }, []);
  return <div ref={ref} className="art-cursor" aria-hidden="true"><img src="/cursor.png" alt="" width={339} height={538} draggable={false} /></div>;
}
