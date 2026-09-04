import type { IntroDefinition, IntroId } from './types';
import { handsIntro } from './hands';
import { orbitIntro } from './orbit';

export const DEFAULT_INTRO: IntroId = 'original';
export const INTRO_DEFINITIONS: IntroDefinition[] = [orbitIntro, handsIntro];
export const findIntro = (id: string | null) => INTRO_DEFINITIONS.find(item => item.id === id);
