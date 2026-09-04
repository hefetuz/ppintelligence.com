import type { IntroDefinition, IntroId } from './types';
import { handsIntro } from './hands';

export const DEFAULT_INTRO: IntroId = 'hands';
export const INTRO_DEFINITIONS: IntroDefinition[] = [handsIntro];
export const findIntro = (id: string | null) => INTRO_DEFINITIONS.find(item => item.id === id);
