export const NEWSLETTER_DELAY: number;
export const NEWSLETTER_COOLDOWN: number;
export const NEWSLETTER_DISMISSED: string;
export const NEWSLETTER_SEEN: string;
export function shouldOfferNewsletter(options: { seen: string | null; dismissedAt: string | null; now?: number }): boolean;
