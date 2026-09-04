import type { IntroDefinition, IntroId } from './types';
import { orbitIntro } from './orbit';

export const DEFAULT_INTRO: IntroId = 'orbit';
export const INTRO_DEFINITIONS: IntroDefinition[] = [orbitIntro];
export const findIntro = (id: string | null) => INTRO_DEFINITIONS.find(item => item.id === id);
