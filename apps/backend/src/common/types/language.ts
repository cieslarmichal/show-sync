export const languages = {
  en: 'en',
  pl: 'pl',
} as const;

export type Language = (typeof languages)[keyof typeof languages];
