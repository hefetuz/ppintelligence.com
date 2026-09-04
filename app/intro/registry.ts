import type { IntroDefinition, IntroId } from './types';
import { handsIntro } from './hands';
import { orbitIntro } from './orbit';
import { morphIntro } from './morph';

export const DEFAULT_INTRO: IntroId = 'morph';
export const INTRO_DEFINITIONS: IntroDefinition[] = [orbitIntro, morphIntro, handsIntro];
export const findIntro = (id: string | null) => INTRO_DEFINITIONS.find(item => item.id === id);
