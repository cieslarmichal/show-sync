import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './mocks/server';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationEN from '../i18n/locales/en/translation.json';
import translationPL from '../i18n/locales/pl/translation.json';
import * as z from 'zod';

/**
 * Test Setup File
 *
 * Runs before each test file to set up the testing environment
 */

// Initialize i18next for tests with actual translations
i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  resources: {
    en: {
      translation: translationEN,
    },
    pl: {
      translation: translationPL,
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

// Configure Zod with English locale for tests
z.config(z.locales.en());

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Stop MSW server after all tests
afterAll(() => {
  server.close();
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia (required for some Radix UI components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock IntersectionObserver (required for some components)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as unknown as typeof IntersectionObserver;

// Mock ResizeObserver (required for some Radix UI components)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as unknown as typeof ResizeObserver;
