'use client';
/* oxlint-disable next/no-img-element -- Self-contained brand SVG is the failure/SSR fallback. */
import { Component, type ReactNode } from 'react';
import { assetUrl } from '../asset-url';

export function HeroStaticArt() {
  return (
    <div className="hero-static-art">
      <img
        src={assetUrl('models/pretty-penny-minted-v1-poster.png')}
        alt="Pretty Penny gold coin"
        width={164}
        height={164}
        decoding="async"
        loading="lazy"
        fetchPriority="low"
      />
    </div>
  );
}

export class HeroArtworkBoundary extends Component<
  { children: ReactNode; onFailure: () => void; fallback?: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed
      ? (this.props.fallback ?? <HeroStaticArt />)
      : this.props.children;
  }
}
