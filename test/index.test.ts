import { afterEach, describe, expect, test, vi } from 'vitest';

const TAGS = ['hrv-ventilation-card', 'hrv-recovery-balance-card', 'hrv-moisture-balance-card'];

afterEach(() => {
  vi.restoreAllMocks();
});

// The first import transforms the whole bundle, which can take more than the default 5 s while the browser tests
// run in parallel.
describe('the bundle entry', { timeout: 20_000 }, () => {
  test('card-bundle "Module loaded once": the three elements are defined and listed in the card picker', async () => {
    window.customCards = [{ type: 'other-card', name: 'Other', description: '', preview: false }];
    await import('../src/index');
    for (const tag of TAGS) expect(customElements.get(tag), tag).toBeDefined();
    expect(window.customCards.map((entry) => entry.type)).toEqual(['other-card', ...TAGS]);
    for (const entry of window.customCards.slice(1)) {
      expect(entry.name).toMatch(/^HRV /);
      expect(entry.description.length).toBeGreaterThan(20);
      expect(entry.preview).toBe(false);
    }
  });

  test('card-bundle "Module loaded twice": no error, each element and picker entry once', async () => {
    await import('../src/index');
    const first = TAGS.map((tag) => customElements.get(tag));
    // A second copy of the module, as when it is loaded under another URL: new classes for the same tags.
    vi.resetModules();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await expect(import('../src/index')).resolves.toBeDefined();
    expect(TAGS.map((tag) => customElements.get(tag))).toEqual(first);
    expect(window.customCards?.filter((entry) => TAGS.includes(entry.type))).toHaveLength(3);
    expect(warn).toHaveBeenCalled();
  });

  test('the stub config is empty, so the editor opens for the user to pick sensors', async () => {
    await import('../src/index');
    for (const tag of TAGS) {
      const element = customElements.get(tag) as unknown as { getStubConfig(): object };
      expect(element.getStubConfig(), tag).toEqual({});
    }
  });
});
