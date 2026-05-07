// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { i18n } from '$lib/i18n/index.svelte';

describe('i18n document language sync', () => {
  beforeEach(() => {
    localStorage.clear();
    i18n.locale = 'en';
  });

  it('syncs the html lang attribute when the locale changes', () => {
    expect(document.documentElement.lang).toBe('en');

    i18n.locale = 'ko';
    expect(document.documentElement.lang).toBe('ko');

    i18n.locale = 'ja';
    expect(document.documentElement.lang).toBe('ja');
  });

  it('persists the selected locale', () => {
    i18n.locale = 'ko';

    expect(localStorage.getItem('retro-pixel-locale')).toBe('ko');
  });
});
