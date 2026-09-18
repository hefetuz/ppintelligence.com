export const BOOKING_URL = 'https://calendly.com/dtudor-prettypennyintelligence/introductory-meeting';
export const COMPANY_LINKEDIN = 'https://www.linkedin.com/company/pretty-penny-intelligence/';
export const FOUNDER_LINKEDIN = 'https://www.linkedin.com/in/denizktudor/';

export const navigation = [
  { path: '/', label: 'Home' },
  { path: '/expertise/', label: 'Expertise' },
  { path: '/about/', label: 'About' },
  { path: '/contact/', label: 'Contact' },
] as const;

export const pageMeta = {
  '/': { title: 'Pretty Penny Intelligence | Make every penny count.', description: 'Independent advisory connecting strategy, risk and technology. A broader perspective on growth, efficiency and the decisions that move your business forward.' },
  '/expertise/': { title: 'Expertise | Pretty Penny Intelligence', description: 'Business strategy and growth, risk and economic analysis, technology and efficiency. Explore the connected expertise of Pretty Penny Intelligence.' },
  '/about/': { title: 'About | Pretty Penny Intelligence', description: 'Meet Deniz Tudor, founder of Pretty Penny Intelligence, and discover the thinking behind an independent business advisory.' },
  '/contact/': { title: 'Let’s talk | Pretty Penny Intelligence', description: 'Start with a 15-minute introductory conversation with Deniz Tudor about your business, your priorities and your next move.' },
} as const;

export type SitePath = keyof typeof pageMeta;

export function resolvePath(pathname: string): SitePath | null {
  const normalized = '/' + pathname.split('/').filter(Boolean).join('/') + (pathname.split('/').filter(Boolean).length ? '/' : '');
  return normalized in pageMeta ? normalized as SitePath : null;
}

export const expertise = [
  {
    id: 'strategy', number: '01', name: 'Strategy & growth', word: 'Direction.',
    lead: 'Ambition, with a way forward.',
    summary: 'Shape your next stage of growth. Connect commercial ambition with the decisions and capabilities that make it possible.',
    description: 'From a new business model to the next stage of scale, see how the moving parts fit together. Bring business development, organisational effectiveness and commercial priorities into one conversation.',
    areas: ['Business strategy & development', 'Growth & scaling', 'Organisational effectiveness', 'M&A considerations'],
    question: 'Where should we go next — and what will it take?',
  },
  {
    id: 'risk', number: '02', name: 'Risk & economic analysis', word: 'Perspective.',
    lead: 'Clarity in a changing world.',
    summary: 'Understand the uncertainty around your decisions, with a connected view of financial, operational and economic risk.',
    description: 'The environment changes. So do the consequences of a decision. Bring risk, economic scenarios and governance into your planning to understand the trade-offs and act with a clearer view.',
    areas: ['Enterprise, operational & financial risk', 'Economic analysis & scenario planning', 'Governance & compliance', 'Regulatory challenges'],
    question: 'What are we exposed to — and what might change?',
  },
  {
    id: 'technology', number: '03', name: 'Technology & efficiency', word: 'Possibility.',
    lead: 'Better ways of working.',
    summary: 'Find opportunities to reduce friction, improve productivity and put technology to work with purpose.',
    description: 'Look at the way work gets done, the information behind decisions and the tools supporting your teams. Explore analytics, automation and technology enablement with attention to governance and accountability.',
    areas: ['Cost reduction & operational efficiency', 'Analytics & decision support', 'Automation & technology enablement', 'AI governance & accountability'],
    question: 'Where can we create more value with what we have?',
  },
] as const;

export const engagements = [
  { number: '01', title: 'Consulting', description: 'An independent perspective on a business challenge, opportunity or transition.' },
  { number: '02', title: 'Speaking & workshops', description: 'Bring strategy, risk and economic thinking into the room. Give your team a shared starting point.' },
  { number: '03', title: 'Training', description: 'Build understanding across the disciplines that shape your business decisions.' },
  { number: '04', title: 'Expert-witness services', description: 'Specialist expertise in business strategy, risk management and economic analysis.' },
] as const;
