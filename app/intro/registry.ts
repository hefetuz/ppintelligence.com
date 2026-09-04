import type { IntroDefinition, IntroId } from './types';

export const DEFAULT_INTRO: IntroId = 'original';
export const INTRO_DEFINITIONS: IntroDefinition[] = [];
export const findIntro = (id: string | null) => INTRO_DEFINITIONS.find(item => item.id === id);
