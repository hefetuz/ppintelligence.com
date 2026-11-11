import type { ReactNode } from 'react';
import './architecture-preview.css';

export function ArchitecturePreview({ children }: { children: ReactNode }) {
  return <div className="classical-preview">{children}</div>;
}
