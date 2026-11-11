'use client';
/* oxlint-disable next/no-img-element -- Self-hosted SVG snapshots need no raster optimization. */

import { useEffect, useRef } from 'react';
import { assetUrl } from '../asset-url';

type FigureName =
  | 'question-folio'
  | 'evidence-bench'
  | 'option-selector'
  | 'perspective'
  | 'balance'
  | 'decision'
  | 'compass'
  | 'conveyor'
  | 'worktable'
  | 'reading-rack'
  | 'value-iris'
  | 'perspective-sculpture'
  | 'possibility-tangram'
  | 'possibility-kaleidoscope'
  | 'value-transmission';
type FigureHandle = { set: (value: number) => void; destroy: () => void };
type FigureDefinition = {
  name: FigureName;
  means: string;
  range: [number, number, number];
  mount: (
    context: {
      stage: HTMLElement;
      svg: SVGSVGElement;
      read: { textContent: string | null };
    },
    value: number,
  ) => FigureHandle;
};
type HairlineKernel = {
  inject: (root: Document) => void;
  mk: (
    tag: string,
    attributes: Record<string, string>,
    parent: HTMLElement,
  ) => SVGSVGElement;
  setReducedMotion: (enabled: boolean) => void;
};

declare global {
  interface Window {
    HL?: HairlineKernel;
    hairline?: (definition: FigureDefinition) => void;
  }
}

const definitions = new Map<FigureName, FigureDefinition>();
const figureLoads = new Map<FigureName, Promise<FigureDefinition>>();
let kernelLoad: Promise<HairlineKernel> | undefined;

function loadKernel() {
  if (kernelLoad) return kernelLoad;
  kernelLoad = new Promise<HairlineKernel>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = assetUrl('illustrations/hairline-kernel.js');
    script.async = true;
    script.onload = () => {
      const kernel = window.HL;
      if (!kernel) {
        script.remove();
        reject(new Error('Hairline did not initialize'));
        return;
      }
      kernel.inject(document);
      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      );
      const updateMotion = () => kernel.setReducedMotion(reducedMotion.matches);
      updateMotion();
      reducedMotion.addEventListener('change', updateMotion);
      window.hairline = (definition) =>
        definitions.set(definition.name, definition);
      resolve(kernel);
    };
    script.onerror = () => {
      script.remove();
      reject(new Error('Hairline could not load'));
    };
    document.head.appendChild(script);
  }).catch((error) => {
    kernelLoad = undefined;
    throw error;
  });
  return kernelLoad;
}

function loadFigure(name: FigureName) {
  const pending = figureLoads.get(name);
  if (pending) return pending;
  const definitionLoad = loadKernel()
    .then(
      () =>
        new Promise<FigureDefinition>((resolve, reject) => {
          const script = document.createElement('script');
          script.type = 'module';
          script.src = assetUrl(`illustrations/${name}.js`);
          script.onload = () => {
            const definition = definitions.get(name);
            if (definition) resolve(definition);
            else {
              script.remove();
              reject(new Error('Hairline figure could not initialize'));
            }
          };
          script.onerror = () => {
            script.remove();
            reject(new Error('Hairline figure could not load'));
          };
          document.head.appendChild(script);
        }),
    )
    .catch((error) => {
      figureLoads.delete(name);
      throw error;
    });
  figureLoads.set(name, definitionLoad);
  return definitionLoad;
}

export function HairlineFigure({
  name,
  label,
  caption,
  className = '',
}: {
  name: FigureName;
  label: string;
  caption: string;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const readRef = useRef<HTMLOutputElement>(null);

  useEffect(() => {
    const host = hostRef.current,
      stage = stageRef.current,
      readout = readRef.current;
    if (!host || !stage || !readout) return;
    let cancelled = false,
      handle: FigureHandle | undefined,
      started = false;
    const start = async () => {
      if (started) return;
      started = true;
      try {
        const [kernel, definition] = await Promise.all([
          loadKernel(),
          loadFigure(name),
        ]);
        if (cancelled) return;
        const svg = kernel.mk(
          'svg',
          { viewBox: '0 0 400 320', 'aria-hidden': 'true' },
          stage,
        );
        const read = {
          get textContent() {
            return readout.textContent;
          },
          set textContent(value: string | null) {
            readout.textContent = value === 'rest' ? 'At rest' : value;
          },
        };
        handle = definition.mount({ stage, svg, read }, definition.range[1]);
        host.dataset.ready = 'true';
      } catch {
        if (!cancelled) {
          stage.replaceChildren();
          host.dataset.ready = 'static';
        }
      }
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          void start();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(host);
    return () => {
      cancelled = true;
      observer.disconnect();
      handle?.destroy();
      host.removeAttribute('data-ready');
    };
  }, [name]);

  return (
    <figure
      className={`hairline-figure hairline-figure--${name} ${className}`}
      ref={hostRef}
      aria-label={label}
    >
      <div className="hairline-artwork">
        <img
          className="hairline-rest"
          src={assetUrl(`illustrations/${name}-rest.svg`)}
          alt=""
          width="400"
          height="320"
          loading="lazy"
          decoding="async"
        />
        <div className="hairline-stage" data-hairline={name} ref={stageRef} />
      </div>
      <figcaption>
        <span>{caption}</span>
        <output ref={readRef} aria-hidden="true">
          At rest
        </output>
      </figcaption>
    </figure>
  );
}
