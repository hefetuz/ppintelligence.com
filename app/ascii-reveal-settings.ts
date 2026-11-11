import type { AsciiRevealOptions } from 'ascii-reveal/core';

/** The approved hero copy settings, shared with every page reveal. */
export const SITE_ASCII_SETTINGS = {
  preset: 'blueprint',
  speed: 1,
  origin: 'center',
  duration: 'fast',
  fallback: true,
} satisfies AsciiRevealOptions;
