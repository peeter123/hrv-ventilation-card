/// <reference types="vite/client" />
import { describe, expect, test } from 'vitest';
import * as strings from '../src/strings';
import { configError, DIAGRAM, MOISTURE, NO_VALUE, RECOVERY, ROLE_LABELS } from '../src/strings';
import { nb } from './nbsp';

// Every source file except strings.ts, as text. unit-state.ts holds the one state the unit reports ('n/a' for no
// change planned), which is a sensor value that happens to equal the card's NO_VALUE text, not UI text.
const sources = import.meta.glob<string>(['../src/**/*.ts', '!../src/strings.ts', '!../src/lib/unit-state.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

// A marker for template parameters: the fixed parts of each text are what is left between markers.
const MARK = '\u0000';
const figures = (gaining: boolean) => ({
  gaining,
  extracted: MARK,
  recovered: MARK,
  outside: MARK,
  toString: () => MARK,
});

/** Every text in strings.ts, with each template filled in with MARK for its parameters. */
function filledTexts(): string[] {
  const texts: string[] = [];
  const visit = (value: unknown): void => {
    if (typeof value === 'string') {
      texts.push(value);
    } else if (typeof value === 'function') {
      const fn = value as (...args: unknown[]) => unknown;
      for (const arg of [figures(true), figures(false), false]) {
        try {
          const result = fn(...Array<unknown>(Math.max(fn.length, 1)).fill(arg));
          if (typeof result === 'string') texts.push(result);
        } catch {
          // a template that needs other arguments (configError) is covered by its own test
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      Object.values(value).forEach(visit);
    }
  };
  visit(strings);
  return texts;
}

/** Every text in strings.ts, and every fixed fragment of its templates. */
function uiTexts(): string[] {
  const texts = filledTexts().flatMap((text) => text.split(MARK));
  // Keep texts a card could not contain by accident: with a space, or capitalised, and with three letters or more.
  const kept = texts
    .map((text) => text.trim())
    .filter((text) => /[A-Za-z].*[A-Za-z].*[A-Za-z]/.test(text) && (/\s/.test(text) || /^[A-Z]/.test(text)));
  return [...new Set([...kept, NO_VALUE])];
}

const escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Comments are not UI text. Line comments only after a line start or whitespace, so URLs in strings survive.
const withoutComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
// UI text can only be in string literals ('...', "...", `...` with its templates); identifiers such as a type named
// Layout are not text.
const STRING_LITERAL = /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g;
const literals = (code: string): string => (code.match(STRING_LITERAL) ?? []).join('\n');

describe('UI text lives in strings.ts', () => {
  const texts = uiTexts();

  test('there are sources to check and texts to look for', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(0);
    expect(texts).toContain('Heat Recovery');
    expect(texts).toContain('Moisture Recovery');
    expect(texts).toContain('Recovered');
    expect(texts).toContain('RMOT');
  });

  test.each(Object.entries(sources))('%s contains no text from strings.ts', (_path, source) => {
    const code = literals(withoutComments(source));
    const found = texts.filter((text) => new RegExp(`(?<![\\w])${escape(text)}(?![\\w])`).test(code));
    expect(found).toEqual([]);
  });

  test('the check finds a hard-coded text, in a string or a template, but not in comments or identifiers', () => {
    const source = "const title = 'Heat Recovery'; // Cooling Recovery in a comment is fine";
    const found = texts.filter((text) => literals(withoutComments(source)).includes(text));
    expect(found).toContain('Heat Recovery');
    expect(found).not.toContain('Cooling Recovery');
    const template = 'html`<span>House drying</span>`';
    expect(texts.filter((text) => literals(template).includes(text))).toContain('House drying');
    expect(literals('type Layout = string; let Recovered = 1;')).toBe('');
  });
});

describe('texts', () => {
  test('a configuration error names the missing roles', () => {
    expect(configError(['supply.humidity'])).toBe('Missing required entities: supply air humidity');
    expect(configError(['fans.supply_flow', 'exhaust.temperature'])).toBe(
      'Missing required entities: supply flow, exhaust air temperature',
    );
  });

  test('card-bundle "Card titles and legend items in title case": minor words only when not first', () => {
    const figures = { gaining: false, extracted: '1', recovered: '1', outside: '1' };
    const titles = [RECOVERY, MOISTURE].flatMap((texts) =>
      Object.entries(texts)
        .filter(([key]) => key.startsWith('title'))
        .map(([, title]) => title as string),
    );
    expect(titles).toHaveLength(5);
    const legend = [
      RECOVERY.laneSensible,
      RECOVERY.laneLatent,
      RECOVERY.recovered('1'),
      RECOVERY.cooling('1'),
      RECOVERY.lost('1'),
      RECOVERY.missed('1'),
      RECOVERY.scale('1'),
      MOISTURE.flow(figures),
      MOISTURE.flow({ ...figures, gaining: true }),
      ...[false, true].flatMap((gaining) => [MOISTURE.swatchRecovered(gaining), MOISTURE.swatchOutside(gaining)]),
      MOISTURE.humidities('1', '1'),
      MOISTURE.scale('1'),
    ];
    const minor = new Set('a an and as at but by for in nor of on or the to with'.split(' '));
    // A minor word that belongs to its verb is capitalised with it.
    const PHRASAL = new Set(['Brings In']);
    const units = new Set(['W', 'g/h', 'g/m³']);
    for (const text of [...titles, ...legend]) {
      const words = text
        .split(/\s+/)
        .map((word) => word.replace(/^[^\p{L}]+/u, ''))
        .filter((word) => word !== '' && !units.has(word));
      words.forEach((word, index) => {
        const phrasal = index > 0 && PHRASAL.has(`${words[index - 1] ?? ''} ${word}`);
        if (index > 0 && minor.has(word.toLowerCase()) && !phrasal) {
          expect(word, `minor word "${word}" in "${text}"`).toBe(word.toLowerCase());
          return;
        }
        expect(word[0], `"${word}" in "${text}"`).toBe(word[0]?.toUpperCase());
      });
    }
  });

  test('card-bundle "Moisture title": the direction subtitles are in sentence case', () => {
    for (const subtitle of Object.values(MOISTURE.subtitles)) {
      const [first, ...rest] = subtitle.split(/\s+/).map((word) => word.replace(/^[^\p{L}]+/u, ''));
      expect(first?.[0], subtitle).toBe(first?.[0]?.toUpperCase());
      for (const word of rest) expect(word, subtitle).toBe(word.toLowerCase());
    }
  });

  test('card-bundle "Numbers stay with their units": a no-break space joins every value to its unit', () => {
    const units = new RegExp(`${MARK}(\\s)(W|g/h|g/m³|%)(?!\\p{L})`, 'gu');
    const joins = filledTexts().flatMap((text) => [...text.matchAll(units)].map((match) => match[1]));
    expect(joins.length).toBeGreaterThan(20);
    expect(joins.every((space) => space === '\u00a0')).toBe(true);
  });

  test('every role label is plain lower-case text', () => {
    for (const label of Object.values(ROLE_LABELS)) expect(label).toMatch(/^[a-z ]+$/);
  });

  test('recovery-balance-card "Positive potential" header', () => {
    expect(RECOVERY.header('300', '400', '75')).toBe(nb('Recovered 300 W of 400 W (75 %)'));
    expect(RECOVERY.headerNoPotential('0')).toBe(nb('Recovered 0 W'));
  });

  test('moisture-balance-card "Drying header" and the bypass suffix', () => {
    const drying = { gaining: false, extracted: '250', recovered: '150', outside: '100' };
    expect(MOISTURE.title).toBe('Moisture Recovery');
    expect(MOISTURE.subtitles.drying).toBe('House drying');
    expect(MOISTURE.header(drying) + MOISTURE.percent('60')).toBe(nb('Recovered 150 of 250 g/h (60 %)'));
    expect(MOISTURE.percent('60', '40')).toBe(nb(' (60 %, with bypass 40 %)'));
    expect(MOISTURE.flow(drying)).toBe(nb('Extracted 250 → Recovered 150 + Outside 100 g/h'));
  });

  test('moisture-balance-card "Gaining legend" starts with "Outdoor Air Brings In"', () => {
    const gaining = { gaining: true, extracted: '120', recovered: '80', outside: '40' };
    expect(MOISTURE.flow(gaining)).toBe(nb('Outdoor Air Brings In 120 → Kept Out 80 + Enters 40 g/h'));
    expect(MOISTURE.header(gaining)).toBe(nb('Kept out 80 of 120 g/h'));
  });

  test('the bypass explanation keeps the wording of the current card', () => {
    expect(MOISTURE.bypass('40')).toBe(
      nb('Bypass 40 % — part of the supply air skips the exchanger, so less is recovered (intended, free cooling)'),
    );
  });

  test('airflow-diagram-card "Rings are labelled": the effectiveness texts have a no-break space before %', () => {
    const { effectiveness, effectivenessPercent } = DIAGRAM;
    expect(effectivenessPercent('92')).toBe('92 %');
    expect(effectiveness('92')).toBe('Effectiveness: temperature 92');
    expect(effectiveness('92', '65', '40')).toBe('Effectiveness: temperature 92, moisture 65 (bypass 40 %)');
  });

  test('the no-value text', () => {
    expect(NO_VALUE).toBe('n/a');
  });
});
