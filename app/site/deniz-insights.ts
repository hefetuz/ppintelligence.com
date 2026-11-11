import type { PublicInsight } from './content-types';
export type SpeakingRecord = {
  id: string;
  title: string;
  event: string;
  role: string;
  summary: string;
  date?: string;
  dateLabel?: string;
  status: 'past' | 'upcoming';
  format?: 'conference' | 'media';
  href?: string;
  action?: string;
  media?: { src: string; alt: string };
};
// CMS-only release: no bundled legacy editorial fallback.
export const additionalPublications: PublicInsight[] = [];
export const speakingRecords: SpeakingRecord[] = [];
export const chessEssay: PublicInsight = {
  "id": "business-strategy-chess",
  "type": "article",
  "title": "Business Strategy and Chess",
  "summary": "A personal reflection on leadership, stakeholder goals and teaching others how to win.",
  "topics": [
    "strategy"
  ],
  "date": "2026-11",
  "attribution": {
    "name": "Deniz K. Tudor",
    "role": "author"
  },
  "host": "Substack",
  "sourceUrl": "https://deniztudor.substack.com/p/business-strategy-and-chess",
  "featured": false,
  "destination": {
    "kind": "external",
    "url": "https://deniztudor.substack.com/p/business-strategy-and-chess"
  }
};
