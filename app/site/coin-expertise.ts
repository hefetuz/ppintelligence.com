/**
 * Company-scoped consulting focuses supported by Pretty Penny Intelligence's
 * LinkedIn company description. These are fields of focus, not service
 * packages, delivery stages, or promised outcomes.
 */
import { topics } from './content';
const DEFINITIONS = [
  {
    id: 'strategy',
    number: '01',
    name: 'Business strategy',
    headline: 'Where should your business focus next?',
    summary:
      'Business strategy consulting to help you consider priorities, options and the direction ahead.',
    part: 'strategy',
  },
  {
    id: 'risk',
    number: '02',
    name: 'Risk management',
    headline: 'What should you understand before your next move?',
    summary:
      'Risk management consulting to help you examine exposure and weigh the implications of a decision.',
    part: 'risk',
  },
  {
    id: 'economics',
    number: '03',
    name: 'Economic analysis',
    headline: 'What is shaping the bigger picture?',
    summary:
      'Economic analysis to help you interpret the context and assumptions behind business decisions.',
    part: 'analysis',
  },
] as const;
export const COIN_EXPERTISE = DEFINITIONS.map((definition) => {
  const topic = topics.find((item) => item.id === definition.id);
  return {
    ...definition,
    name: topic?.name ?? definition.name,
    headline: topic?.lead ?? definition.headline,
    summary: topic?.summary ?? definition.summary,
  };
});
