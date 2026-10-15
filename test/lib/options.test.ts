import { describe, expect, test } from 'vitest';
import { invalidOptions, optionValue, type OptionSpec } from '../../src/lib/options';

const SMOOTHING = { kind: 'number', path: 'smoothing', min: 0, max: 1440, default: 10 } as const;
const DENSITY = { kind: 'number', path: 'air_density', min: 0.5, max: 1.5, default: 1.2 } as const;
const COLOR = { kind: 'color', path: 'heating.color', default: '#db4437' } as const;
const ENABLED = { kind: 'boolean', path: 'animation.enabled', default: true } as const;
const LAYOUT = { kind: 'choice', path: 'layout', choices: ['auto', 'full', 'compact'], default: 'auto' } as const;
const ALL: OptionSpec[] = [SMOOTHING, DENSITY, COLOR, ENABLED, LAYOUT];

describe('invalidOptions', () => {
  test('card-bundle "Negative smoothing window": names the smoothing window and its allowed range', () => {
    expect(invalidOptions({ smoothing: -5 }, ALL)).toEqual([
      'Invalid option smoothing: expected a number from 0 to 1440',
    ]);
  });

  test('card-bundle "Air density as text": names the air density', () => {
    const [message] = invalidOptions({ air_density: 'heavy' }, ALL);
    expect(message).toContain('air_density');
  });

  test('card-bundle "Option left out": no error', () => {
    expect(invalidOptions({}, ALL)).toEqual([]);
  });

  test('valid values pass', () => {
    const config = {
      smoothing: 0,
      air_density: 1.0,
      heating: { color: 'rgb(219, 68, 55)' },
      animation: { enabled: false },
      layout: 'compact',
    };
    expect(invalidOptions(config, ALL)).toEqual([]);
    for (const color of ['#db4437', 'orange', 'hsl(10, 50%, 40%)', 'var(--accent-color)']) {
      expect(invalidOptions({ heating: { color } }, ALL), color).toEqual([]);
    }
  });

  test('wrong types, out-of-range numbers, unknown choices and unsafe colours are each reported', () => {
    const config = {
      smoothing: '10',
      air_density: 3,
      heating: { color: 'red; display: none' },
      animation: { enabled: 'yes' },
      layout: 'wide',
    };
    expect(invalidOptions(config, ALL)).toEqual([
      'Invalid option smoothing: expected a number from 0 to 1440',
      'Invalid option air_density: expected a number from 0.5 to 1.5',
      'Invalid option heating.color: expected a CSS colour such as #db4437 or rgb(219, 68, 55)',
      'Invalid option animation.enabled: expected true or false',
      'Invalid option layout: expected one of auto, full, compact',
    ]);
  });

  test('only a single valid colour is accepted, because colours are also placed inside gradients', () => {
    const invalid = [
      'red, blue',
      'red 0 3px',
      'rgb(1,2,3',
      'url(x)',
      'var(--a) red',
      'redd',
      'inherit',
      'none',
      '#12345',
      'rgb(1,2,3) red',
      'var(accent)',
      'var(--a, inherit)',
      '#fff;x',
    ];
    for (const color of invalid) expect(invalidOptions({ heating: { color } }, ALL), color).toHaveLength(1);
    const valid = [
      '#DB4437',
      '#fff8',
      'rebeccapurple',
      'Orange',
      'rgba(1, 2, 3, 0.5)',
      'oklch(70% 0.1 30 / 50%)',
      'hsl(120deg 50% 50%)',
      'oklch(70% 0.1 none)',
      'rgb(var(--rgb-primary-color))',
      'var(--accent-color)',
      'var(--accent-color, #03a9f4)',
      'currentcolor',
    ];
    for (const color of valid) expect(invalidOptions({ heating: { color } }, ALL), color).toEqual([]);
  });

  test('a key written without a value (null) counts as left out', () => {
    expect(invalidOptions({ smoothing: null, heating: null }, ALL)).toEqual([]);
    expect(optionValue({ smoothing: null }, SMOOTHING)).toBe(10);
  });

  test('a group that is not an object is reported once, not ignored', () => {
    const colors = [COLOR, { kind: 'color', path: 'heating.color_latent', default: '#f4a09a' } as const];
    for (const heating of ['red', 7, ['#fff']]) {
      expect(invalidOptions({ heating }, colors), JSON.stringify(heating)).toEqual([
        'Invalid option heating: expected a group of options',
      ]);
    }
  });

  test('a number that is not finite is invalid', () => {
    expect(invalidOptions({ smoothing: Number.NaN }, ALL)).toHaveLength(1);
  });
});

describe('optionValue', () => {
  test('the configured value, or the default when the option is left out', () => {
    expect(optionValue({ smoothing: 5 }, SMOOTHING)).toBe(5);
    expect(optionValue({}, SMOOTHING)).toBe(10);
    expect(optionValue({ heating: { color: 'orange' } }, COLOR)).toBe('orange');
    expect(optionValue({}, ENABLED)).toBe(true);
    expect(optionValue({ layout: 'full' }, LAYOUT)).toBe('full');
  });
});
