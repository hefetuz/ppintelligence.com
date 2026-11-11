'use client';
/* oxlint-disable next/no-img-element -- Static Pages serves approved local and CMS image URLs directly. */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/sharp-icons';
import { siteHref } from './links';

export type LatestItem = {
  id: string;
  title: string;
  summary: string;
  label: string;
  date?: string;
  href?: string;
  action: string;
  external?: boolean;
  image?: { src: string; alt: string; position?: string; mobilePosition?: string };
};

export function InsightFeatureCard({ item, className = '', eager = false }: { item: LatestItem; className?: string; eager?: boolean }) {
  return (
    <article className={`insights-latest__card ${className}`.trim()}>
      {item.image && <img className="insights-latest__photo" src={item.image.src.startsWith('https://') ? item.image.src : siteHref(item.image.src)} alt={item.image.alt}
        style={{ '--highlight-position': item.image.position, '--highlight-position-mobile': item.image.mobilePosition } as CSSProperties}
        loading={eager ? 'eager' : 'lazy'} decoding="async" />}
      <div className="insights-latest__copy">
        <span className="insights-latest__label">{item.label}</span>
        <h3>{item.title}</h3>
        <p>{item.summary}</p>
        <footer>
          {item.date && <span>{item.date}</span>}
          {item.href && <a className="action-button action-button--compact action-button--on-dark" href={item.href} {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{item.action}<span className="sr-only">: {item.title}</span></a>}
        </footer>
      </div>
    </article>
  );
}

export function InsightsLatest({ title, items }: { title: string; items: LatestItem[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    const update = () => {
      const start = element.scrollLeft < 2;
      const end = element.scrollLeft + element.clientWidth >= element.scrollWidth - 2;
      setEdges(previous => previous.start === start && previous.end === end ? previous : { start, end });
    };
    update();
    element.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update); observer.observe(element);
    return () => { element.removeEventListener('scroll', update); observer.disconnect(); };
  }, [items.length]);
  if (!items.length) return null;
  const move = (direction: number) => {
    const element = rail.current; if (!element) return;
    element.scrollBy({ left: direction * element.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  return <section className="insights-latest" aria-label={title}>
    <header><h2>{title}</h2>{items.length > 1 && <div className="insights-latest__controls"><button type="button" aria-label="Previous speaking highlight" disabled={edges.start} onClick={() => move(-1)}><ChevronLeftIcon size={18}/></button><button type="button" aria-label="Next speaking highlight" disabled={edges.end} onClick={() => move(1)}><ChevronRightIcon size={18}/></button></div>}</header>
    <div ref={rail} className="insights-latest__rail">
      {items.map((item, index) => <InsightFeatureCard key={item.id} item={item} eager={index === 0} />)}
    </div>
  </section>;
}
