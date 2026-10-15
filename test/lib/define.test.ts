import { afterEach, describe, expect, test, vi } from 'vitest';
import { defineOnce } from '../../src/lib/define';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('defineOnce', () => {
  test('defines a tag once; defining the same class again is silent', () => {
    class First extends HTMLElement {}
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    defineOnce('hrv-define-test-a', First);
    defineOnce('hrv-define-test-a', First);
    expect(customElements.get('hrv-define-test-a')).toBe(First);
    expect(warn).not.toHaveBeenCalled();
  });

  test('a second copy of a class keeps the first and warns', () => {
    class First extends HTMLElement {}
    class Second extends HTMLElement {}
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    defineOnce('hrv-define-test-b', First);
    expect(() => {
      defineOnce('hrv-define-test-b', Second);
    }).not.toThrow();
    expect(customElements.get('hrv-define-test-b')).toBe(First);
    expect(warn).toHaveBeenCalledOnce();
  });
});
