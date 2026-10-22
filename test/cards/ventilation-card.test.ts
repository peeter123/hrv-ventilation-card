import { afterEach, describe, expect, test } from 'vitest';
import { checkDiagramConfig, HrvVentilationCard } from '../../src/cards/ventilation-card';
import type { CardHass } from '../../src/cards/base-card';
import { entityAt, type CardConfig } from '../../src/lib/config';
import type { HassEntityState } from '../../src/lib/hass';
import { nb } from '../nbsp';

const state = (entity_id: string, value: string, unit?: string): HassEntityState => ({
  entity_id,
  state: value,
  attributes: unit ? { unit_of_measurement: unit } : {},
  last_updated: '2026-10-14T12:00:00Z',
});

const CONFIG: CardConfig = {
  type: 'custom:hrv-ventilation-card',
  outdoor: { temperature: 'sensor.hrv_outdoor_t' },
  supply: { temperature: 'sensor.hrv_supply_t' },
  extract: { temperature: 'sensor.hrv_extract_t' },
  exhaust: { temperature: 'sensor.hrv_exhaust_t' },
  bypass: { position: 'sensor.hrv_bypass' },
};

function hassWith(bypass: string): CardHass {
  const states = [
    state('sensor.hrv_outdoor_t', '0', '°C'),
    state('sensor.hrv_supply_t', '18', '°C'),
    state('sensor.hrv_extract_t', '21', '°C'),
    state('sensor.hrv_exhaust_t', '3', '°C'),
    state('sensor.hrv_bypass', bypass, '%'),
  ];
  return {
    states: Object.fromEntries(states.map((s) => [s.entity_id, s])),
    locale: { language: 'en', number_format: 'language' },
    callWS: () => new Promise(() => undefined),
  };
}

/** Renders the card with the bypass position's state and any extra states. */
async function render(config: CardConfig, bypass: string, extra: readonly HassEntityState[] = []) {
  const card = document.createElement('hrv-ventilation-card');
  card.setConfig(config);
  const base = hassWith(bypass);
  card.hass = { ...base, states: { ...base.states, ...Object.fromEntries(extra.map((s) => [s.entity_id, s])) } };
  document.body.append(card);
  await card.updateComplete;
  const root = card.shadowRoot;
  if (!root) throw new Error('no shadow root');
  return { card, root };
}

afterEach(() => {
  document.body.innerHTML = '';
});

/** A keydown as the browser sends it, bubbling out of the shadow root. */
const keydown = (element: Element, key: string, init: KeyboardEventInit = {}): void => {
  element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true, ...init }));
};

const opacity = (root: ShadowRoot, selector: string): string | null | undefined =>
  root.querySelector(selector)?.getAttribute('opacity');

describe('the drawing', () => {
  test('bypass 0: no bypass path, the outdoor air goes through the exchanger at full strength', async () => {
    const { root } = await render(CONFIG, '0');
    expect(root.querySelector('svg .bypass')).toBeNull();
    expect(opacity(root, 'svg .supply')).toBe('1');
    expect(root.querySelector('svg .exhaust')).not.toBeNull();
  });

  test('airflow-diagram-card "Bypass half open": both paths at 0.5', async () => {
    const { root } = await render(CONFIG, '50');
    expect(opacity(root, 'svg .bypass')).toBe('0.5');
    expect(opacity(root, 'svg .supply')).toBe('0.5');
  });

  test('airflow-diagram-card "Bypass fully open": only the bypass path, the exhaust stream unchanged', async () => {
    const { root } = await render(CONFIG, '100');
    expect(opacity(root, 'svg .bypass')).toBe('1');
    expect(root.querySelector('svg .supply')).toBeNull();
    expect(root.querySelector('svg .exhaust')).not.toBeNull();
  });

  test('airflow-diagram-card "No bypass entity": no bypass path', async () => {
    const { bypass: _bypass, ...config } = CONFIG;
    const { root } = await render(config, '50');
    expect(root.querySelector('svg .bypass')).toBeNull();
  });

  test('two card instances use different gradient and clip IDs, and each stream refers to its own', async () => {
    const first = await render(CONFIG, '50');
    const second = await render(CONFIG, '50');
    const ids = (root: ShadowRoot) => [...root.querySelectorAll('linearGradient')].map((gradient) => gradient.id);
    const [a, b] = [ids(first.root), ids(second.root)];
    expect(a).toHaveLength(2);
    expect(b).toHaveLength(2);
    expect(a.filter((id) => b.includes(id))).toEqual([]);
    const clips = (root: ShadowRoot) => [...root.querySelectorAll('clipPath')].map((clip) => clip.id);
    expect(clips(first.root)).toHaveLength(1);
    expect(clips(second.root)).toHaveLength(1);
    expect(clips(first.root)).not.toEqual(clips(second.root));
    for (const { root } of [first, second]) {
      const [supply, exhaust] = ids(root);
      expect(root.querySelector('svg .supply')?.getAttribute('stroke')).toBe(`url(#${supply ?? ''})`);
      expect(root.querySelector('svg .bypass')?.getAttribute('stroke')).toBe(`url(#${supply ?? ''})`);
      expect(root.querySelector('svg .exhaust')?.getAttribute('stroke')).toBe(`url(#${exhaust ?? ''})`);
    }
  });

  test('the stream ends take the temperature colours: winter outdoor cold, extract warm', async () => {
    const { root } = await render(CONFIG, '0');
    const stops = [...root.querySelectorAll('stop')].map((stop) => stop.getAttribute('style'));
    expect(stops[0]).toContain('#039be5'); // outdoor
    expect(stops[2]).toContain('#db4437'); // extract
  });

  test('the drawing loads no image files and has no fixed colours in its markup', async () => {
    const { root } = await render(CONFIG, '50');
    expect(root.querySelector('img, image')).toBeNull();
    const svgText = root.querySelector('svg')?.outerHTML ?? '';
    expect(svgText).not.toMatch(/(fill|stroke)="[^u"]/);
  });

  test("the drawing's styles take every fill and stroke colour from a theme variable", () => {
    const css = [HrvVentilationCard.styles]
      .flat()
      .map((style) => ('cssText' in style ? style.cssText : ''))
      .join('');
    const rules = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].filter(([, selector]) =>
      /\.(exchanger|stream|symbol|art|flow)/.test(selector ?? ''),
    );
    expect(rules.length).toBeGreaterThan(2);
    for (const [, selector, body] of rules) {
      for (const [, value] of (body ?? '').matchAll(/(?:^|;)\s*(?:fill|stroke)\s*:\s*([^;]+)/g)) {
        // A theme variable, or a colour mixed from one (the ERV exchanger).
        expect(value?.trim(), selector).toMatch(/^(var\(|none$|color-mix\(in srgb, var\()/);
      }
    }
  });

  test('airflow-diagram-card "Default type": without exchanger_type the exchanger is an HRV', async () => {
    const { root } = await render(CONFIG, '0');
    expect(root.querySelector('svg .exchanger')?.getAttribute('class')).toBe('exchanger hrv');
  });

  test('airflow-diagram-card "ERV": exchanger_type erv gives the ERV exchanger', async () => {
    const { root } = await render({ ...CONFIG, exchanger_type: 'erv' }, '0');
    // The fill itself, and its contrast in both themes, is checked in the browser test.
    expect(root.querySelector('svg .exchanger')?.getAttribute('class')).toBe('exchanger erv');
  });

  test('a bypass position such as 7 % gives rounded opacities', async () => {
    const { root } = await render(CONFIG, '7');
    expect(opacity(root, 'svg .bypass')).toBe('0.07');
    expect(opacity(root, 'svg .supply')).toBe('0.93');
  });
});

// Every input of the calculation, so the badge and an ERV's figure show.
const CALCULATION: CardConfig = {
  ...CONFIG,
  outdoor: { temperature: 'sensor.hrv_outdoor_t', absolute_humidity: 'sensor.hrv_ah_out' },
  supply: { temperature: 'sensor.hrv_supply_t', absolute_humidity: 'sensor.hrv_ah_sup' },
  extract: { temperature: 'sensor.hrv_extract_t', absolute_humidity: 'sensor.hrv_ah_ext' },
  fans: { supply_flow: 'sensor.hrv_flow' },
  seasons: { heating: 'binary_sensor.hrv_heating', cooling: 'binary_sensor.hrv_cooling' },
  smoothing: 0,
};
const ROLES = {
  heating_saving: 'sensor.hrv_heating_saving',
  cooling_saving: 'sensor.hrv_cooling_saving',
  moisture_recovery: 'sensor.hrv_moisture',
};

// `extra` states replace the defaults of the same entity; a bypass above 0 puts the calculation in cooling mode.
async function renderInputs(config: CardConfig, bypass = '0', extra: readonly HassEntityState[] = []) {
  return render(config, bypass, [
    state('sensor.hrv_ah_out', '4', 'g/m³'),
    state('sensor.hrv_ah_sup', '6', 'g/m³'),
    state('sensor.hrv_ah_ext', '8', 'g/m³'),
    state('sensor.hrv_flow', '200', 'm³/h'),
    state('binary_sensor.hrv_heating', 'off'),
    state('binary_sensor.hrv_cooling', 'off'),
    state(ROLES.heating_saving, '400', 'W'),
    state(ROLES.cooling_saving, '0', 'W'),
    state(ROLES.moisture_recovery, '400', 'g/h'),
    ...extra,
  ]);
}

async function renderCalculation(config: CardConfig, bypass = '0', extra: readonly HassEntityState[] = []) {
  const { card, root } = await renderInputs(config, bypass, extra);
  const find = (selector: string): HTMLElement => {
    const found = root.querySelector<HTMLElement>(selector);
    if (!found) throw new Error(`no ${selector}`);
    return found;
  };
  return { card, root, badge: find('.saving .badge'), figure: () => find('.moisture-recovery .figure') };
}

describe('the labels', () => {
  const moreInfo = (card: HTMLElement): string[] => {
    const opened: string[] = [];
    card.addEventListener('hass-more-info', (event) => {
      opened.push((event as CustomEvent<{ entityId: string }>).detail.entityId);
    });
    return opened;
  };
  const labelWith = (root: ShadowRoot, text: string): HTMLElement => {
    const found = [...root.querySelectorAll<HTMLElement>('.label')].find((label) => label.textContent.includes(text));
    if (!found) throw new Error(`no label with ${text}`);
    return found;
  };

  test('airflow-diagram-card "Tapping a label" opens the more-info dialog of its entity', async () => {
    const { card, root } = await render(CONFIG, '50');
    const opened = moreInfo(card);
    labelWith(root, '18 °C').click();
    expect(opened).toEqual(['sensor.hrv_supply_t']);
  });

  describe('the fan level', () => {
    const fan = (value: string, attributes: Record<string, unknown> = {}): HassEntityState => ({
      ...state('fan.hrv_unit', value),
      attributes,
    });
    const MEDIUM = fan('on', { percentage: 66, percentage_step: 33.333333333333336 });
    const withLevel = (entity: string): CardConfig => ({ ...CONFIG, fans: { level: entity } });
    const levelLabel = (root: ShadowRoot): HTMLElement | null => root.querySelector<HTMLElement>('.label.level');

    test('airflow-diagram-card "Three-speed fan at medium": the level name, in the label and the tooltip', async () => {
      const { root } = await render(withLevel('fan.hrv_unit'), '0', [MEDIUM]);
      expect(levelLabel(root)?.textContent.trim()).toBe('Medium');
      expect(levelLabel(root)?.title).toBe('Fan level: Medium');
      expect(levelLabel(root)?.getAttribute('aria-label')).toBe('fan level: Medium');
    });

    test('airflow-diagram-card "Tapping a fan level from a fan entity" opens that fan entity', async () => {
      const { card, root } = await render(withLevel('fan.hrv_unit'), '0', [MEDIUM]);
      const opened = moreInfo(card);
      levelLabel(root)?.click();
      expect(opened).toEqual(['fan.hrv_unit']);
    });

    test('airflow-diagram-card "Fan level sensor": the state as Home Assistant formats it', async () => {
      const { root } = await render(withLevel('sensor.hrv_level'), '0', [state('sensor.hrv_level', 'Medium')]);
      expect(levelLabel(root)?.textContent.trim()).toBe('Medium');
      expect(levelLabel(root)?.title).toBe('Fan level: Medium');
    });

    test('an unavailable fan entity is hidden, or shown as unavailable with show_unavailable', async () => {
      const unavailable = fan('unavailable');
      const hidden = await render(withLevel('fan.hrv_unit'), '0', [unavailable]);
      expect(levelLabel(hidden.root)?.classList.contains('hidden')).toBe(true);
      const shown = await render({ ...withLevel('fan.hrv_unit'), show_unavailable: true }, '0', [unavailable]);
      expect(levelLabel(shown.root)?.classList.contains('hidden')).toBe(false);
      expect(levelLabel(shown.root)?.textContent.trim()).not.toBe('');
    });

    test('a fan entity set as another role shows the state as Home Assistant formats it', async () => {
      const config: CardConfig = { ...CONFIG, fans: { supply_flow: 'fan.hrv_unit' } };
      const { root } = await render(config, '0', [MEDIUM]);
      const label = root.querySelector<HTMLElement>('.label.supply_flow');
      expect(label?.textContent).not.toContain('Medium');
      expect(label?.textContent.trim()).toBe('on');
    });
  });

  test('Enter and Space on a label open the dialog too; other keys do not', async () => {
    const { card, root } = await render(CONFIG, '50');
    const opened = moreInfo(card);
    const label = labelWith(root, '50 %');
    for (const key of ['Enter', ' ', 'a']) keydown(label, key);
    expect(opened).toEqual(['sensor.hrv_bypass', 'sensor.hrv_bypass']);
  });

  test('held keys and keys with a modifier do not open the dialog', async () => {
    const { card, root } = await render(CONFIG, '50');
    const opened = moreInfo(card);
    const label = labelWith(root, '50 %');
    keydown(label, 'Enter', { repeat: true });
    keydown(label, 'Enter', { ctrlKey: true });
    expect(opened).toEqual([]);
  });

  test('a label is named by its role and value', async () => {
    const { root } = await render(CONFIG, '50');
    expect(labelWith(root, '18 °C').getAttribute('aria-label')).toBe('supply air temperature: 18 °C');
  });

  test('a hidden label keeps its place but is not shown to assistive technology or tappable', async () => {
    const { card, root } = await render(CONFIG, '0');
    const opened = moreInfo(card);
    const hidden = root.querySelector<HTMLElement>('.bypass-position .hidden');
    expect(hidden?.getAttribute('aria-hidden')).toBe('true');
    expect(hidden?.hasAttribute('tabindex')).toBe(false);
    hidden?.click();
    expect(opened).toEqual([]);
  });

  describe('the badge and the moisture figure', () => {
    const press = (element: HTMLElement): void => {
      element.click();
      keydown(element, 'Enter');
    };

    test('airflow-diagram-card "Tapping between seasons" opens the heating season sensor', async () => {
      const { card, root } = await renderCalculation(CALCULATION);
      const opened = moreInfo(card);
      root.querySelector<HTMLElement>('ha-icon.season')?.click();
      expect(opened).toEqual(['binary_sensor.hrv_heating']);
    });

    test('airflow-diagram-card "Moisture recovery figure on ERV": right of the exchanger of an ERV, not on an HRV', async () => {
      const erv = await renderCalculation({ ...CALCULATION, exchanger_type: 'erv' });
      // 200 m³/h * (6 - 4) g/m³ recovered.
      expect(erv.figure().textContent.trim()).toBe('400g/h');
      expect(erv.figure().title).toBe(nb('Moisture recovered: 400 g/h'));
      expect(erv.figure().querySelector<HTMLElement & { icon?: string }>('ha-icon')?.icon).toBe('mdi:water-sync');
      for (const config of [CALCULATION, { ...CALCULATION, exchanger_type: 'hrv' }]) {
        const { root } = await renderCalculation(config);
        expect(root.querySelector('.moisture-recovery')).toBeNull();
      }
    });

    test('airflow-diagram-card "Heating saving opened while heating": the badge opens the heating saving', async () => {
      const { card, badge } = await renderCalculation({ ...CALCULATION, status: ROLES });
      const opened = moreInfo(card);
      press(badge);
      expect(opened).toEqual([ROLES.heating_saving, ROLES.heating_saving]);
      expect(badge.getAttribute('role')).toBe('button');
      expect(badge.getAttribute('tabindex')).toBe('0');
    });

    test('airflow-diagram-card "Cooling saving opened while cooling": the badge opens the cooling saving', async () => {
      const { card, badge } = await renderCalculation({ ...CALCULATION, status: ROLES }, '50', [
        state(ROLES.heating_saving, '0', 'W'),
        state(ROLES.cooling_saving, '400', 'W'),
      ]);
      const opened = moreInfo(card);
      press(badge);
      expect(opened).toEqual([ROLES.cooling_saving, ROLES.cooling_saving]);
      expect(badge.getAttribute('role')).toBe('button');
      expect(badge.getAttribute('tabindex')).toBe('0');
    });

    test('airflow-diagram-card "Higher saving opened": also against the calculation mode, in kW', async () => {
      const { card, badge } = await renderCalculation({ ...CALCULATION, status: ROLES }, '50', [
        state(ROLES.heating_saving, '1.2', 'kW'),
        state(ROLES.cooling_saving, '0', 'kW'),
      ]);
      const opened = moreInfo(card);
      press(badge);
      expect(opened).toEqual([ROLES.heating_saving, ROLES.heating_saving]);
    });

    test('airflow-diagram-card "Saving state not a number": the badge opens the saving of the mode', async () => {
      const { card, badge } = await renderCalculation({ ...CALCULATION, status: ROLES }, '50', [
        state(ROLES.heating_saving, 'unavailable'),
      ]);
      const opened = moreInfo(card);
      press(badge);
      expect(opened).toEqual([ROLES.cooling_saving, ROLES.cooling_saving]);
    });

    test('airflow-diagram-card "Mode without its saving entity": not tappable, in either mode', async () => {
      const cases: [string, CardConfig][] = [
        ['0', { cooling_saving: ROLES.cooling_saving }],
        ['50', { heating_saving: ROLES.heating_saving }],
      ];
      for (const [bypass, status] of cases) {
        const { card, badge } = await renderCalculation({ ...CALCULATION, status }, bypass);
        const opened = moreInfo(card);
        press(badge);
        expect(opened).toEqual([]);
        for (const attribute of ['role', 'tabindex', 'data-entity']) expect(badge.hasAttribute(attribute)).toBe(false);
        document.body.innerHTML = '';
      }
    });

    test('airflow-diagram-card "No saving entity": the badge opens nothing, not the supply air temperature', async () => {
      const { card, badge } = await renderCalculation(CALCULATION);
      const opened = moreInfo(card);
      press(badge);
      expect(opened).toEqual([]);
      for (const attribute of ['role', 'tabindex', 'data-entity']) expect(badge.hasAttribute(attribute)).toBe(false);
    });

    test('the ERV moisture figure opens the moisture recovery entity, and nothing without it', async () => {
      const erv = { ...CALCULATION, exchanger_type: 'erv' };
      const configured = await renderCalculation({ ...erv, status: { moisture_recovery: ROLES.moisture_recovery } });
      const opened = moreInfo(configured.card);
      press(configured.figure());
      expect(opened).toEqual([ROLES.moisture_recovery, ROLES.moisture_recovery]);
      expect(configured.figure().getAttribute('tabindex')).toBe('0');
      const bare = await renderCalculation(erv);
      const none = moreInfo(bare.card);
      press(bare.figure());
      expect(none).toEqual([]);
      for (const attribute of ['tabindex', 'data-entity']) expect(bare.figure().hasAttribute(attribute)).toBe(false);
      // An image, so its label, which says the direction the icon shows, is still read out.
      expect(bare.figure().getAttribute('role')).toBe('img');
      expect(bare.figure().getAttribute('aria-label')).toBe(nb('Moisture recovered: 400 g/h'));
    });

    test('airflow-diagram-card "Roles configured": the same badge and figure, and no label or grid cell', async () => {
      const erv = { ...CALCULATION, exchanger_type: 'erv' };
      const plain = await renderCalculation(erv);
      const [badgeText, figureText] = [plain.badge.textContent, plain.figure().textContent];
      document.body.innerHTML = '';
      const { root, badge, figure } = await renderCalculation({ ...erv, status: ROLES });
      expect(badge.textContent).toBe(badgeText);
      expect(figure().textContent).toBe(figureText);
      // Only the season sensors make the top row; the two roles add no label there or in the grid.
      expect(root.querySelectorAll('.top .label')).toHaveLength(0);
      expect(root.querySelector('.status')).toBeNull();
      expect(
        root.querySelectorAll(
          '.label:not(.figure)[data-entity="sensor.hrv_heating_saving"], .label:not(.figure)[data-entity="sensor.hrv_moisture"]',
        ),
      ).toHaveLength(0);
    });
  });

  test('airflow-diagram-card "Entity precision": labels show hass.formatEntityState', async () => {
    const card = document.createElement('hrv-ventilation-card');
    card.setConfig(CONFIG);
    card.hass = { ...hassWith('0'), formatEntityState: (stateObj) => `[${stateObj.state}]` };
    document.body.append(card);
    await card.updateComplete;
    const texts = [...(card.shadowRoot?.querySelectorAll('.corner .label') ?? [])].map((label) => label.textContent);
    expect(texts).toEqual(['[0]', '[18]', '[21]', '[3]']); // outdoor, supply, extract, exhaust
  });
});

describe('the animated flow', () => {
  const FLOWS: CardConfig = {
    ...CONFIG,
    fans: { supply_flow: 'sensor.hrv_supply_flow', exhaust_flow: 'sensor.hrv_exhaust_flow' },
  };

  async function renderFlows(config: CardConfig, supply: string, exhaust: string) {
    const flows = [state('sensor.hrv_supply_flow', supply, 'm³/h'), state('sensor.hrv_exhaust_flow', exhaust, 'm³/h')];
    const { card, root } = await render(config, '50', flows);
    const style = root.querySelector('svg')?.getAttribute('style') ?? '';
    return { card, root, style };
  }

  test('every drawn path has a moving overlay at the same strength', async () => {
    const { root } = await render(CONFIG, '50');
    const overlays = [...root.querySelectorAll('.flow')];
    expect(overlays.map((overlay) => overlay.getAttribute('class'))).toEqual([
      'flow supply-air',
      'flow supply-air',
      'flow exhaust-air',
    ]);
    const paths = [...root.querySelectorAll('.stream')];
    expect(overlays.map((overlay) => overlay.getAttribute('d'))).toEqual(paths.map((path) => path.getAttribute('d')));
    expect(overlays.map((overlay) => overlay.getAttribute('opacity'))).toEqual(['0.5', '0.5', '1']);
  });

  test('airflow-diagram-card "Flow relative to nominal": the exhaust moves twice as fast as the supply', async () => {
    const config = { ...FLOWS, animation: { nominal_flow: 400 } };
    const { style } = await renderFlows(config, '200', '400');
    expect(style).toMatch(/--supply-duration:\s*3s/);
    expect(style).toMatch(/--exhaust-duration:\s*1\.5s/);
  });

  test('airflow-diagram-card "Fans stopped": the supply stream stands still, the exhaust keeps moving', async () => {
    const { style } = await renderFlows(FLOWS, '0', '180');
    expect(style).toMatch(/--supply-state:\s*paused/);
    expect(style).toMatch(/--exhaust-state:\s*running/);
  });

  test('a new flow changes only the speed properties, so the overlays stay in place', async () => {
    const { card, root } = await renderFlows({ ...FLOWS, animation: { nominal_flow: 400 } }, '200', '400');
    const overlay = root.querySelector('.flow');
    const base = card.hass;
    if (!base) throw new Error('no hass');
    card.hass = {
      ...base,
      states: { ...base.states, 'sensor.hrv_supply_flow': state('sensor.hrv_supply_flow', '100', 'm³/h') },
    };
    await card.updateComplete;
    expect(root.querySelector('.flow')).toBe(overlay);
    expect(root.querySelector('svg')?.getAttribute('style')).toMatch(/--supply-duration:\s*6s/);
  });

  test('airflow-diagram-card "Turned off in config": the animation stops, the paths stay', async () => {
    const { root } = await render({ ...CONFIG, animation: { enabled: false } }, '50');
    expect(root.querySelector('.drawing')?.classList.contains('still')).toBe(true);
    expect(root.querySelectorAll('.stream')).toHaveLength(3);
    const css = [HrvVentilationCard.styles]
      .flat()
      .map((style) => ('cssText' in style ? style.cssText : ''))
      .join('');
    expect(css).toMatch(/\.still \.flow\s*\{\s*animation: none;?\s*\}/);
    const on = await render(CONFIG, '50');
    expect(on.root.querySelector('.drawing')?.classList.contains('still')).toBe(false);
  });
});

describe('the effectiveness rings', () => {
  // The ERV with every input of the calculation and the rings on. By default the temperatures give 85.71 % and the
  // absolute humidities 50 %.
  const ERV_RINGS: CardConfig = { ...CALCULATION, exchanger_type: 'erv', show_effectiveness: true };
  // Outdoor 0 and extract 20 degrees, supply 18.4, absolute humidity 2, 12 and 8.5 g/m3: total 78.14 %, moisture 65 %.
  const EFFECTIVE = [
    state('sensor.hrv_supply_t', '18.4', '°C'),
    state('sensor.hrv_extract_t', '20', '°C'),
    state('sensor.hrv_ah_out', '2', 'g/m³'),
    state('sensor.hrv_ah_sup', '8.5', 'g/m³'),
    state('sensor.hrv_ah_ext', '12', 'g/m³'),
  ];
  const attribute = (root: ShadowRoot, selector: string, name: string): string | null | undefined =>
    root.querySelector(selector)?.getAttribute(name);
  /** The dash of a ring: its length in % and the gap. */
  const dash = (root: ShadowRoot, name: 'total' | 'moisture'): string | null | undefined =>
    attribute(root, `svg .ring.${name}`, 'stroke-dasharray');
  const ringClasses = (root: ShadowRoot): string[] =>
    [...root.querySelectorAll('svg .ring, svg .ring-track')]
      .map((element) => element.getAttribute('class') ?? '')
      .sort();
  const box = (root: ShadowRoot): HTMLElement | null => root.querySelector<HTMLElement>('.on-drawing.effectiveness');
  test('airflow-diagram-card "Heating with both figures": the rings run 78.14 and 65 of 100 on pathLength 100', async () => {
    const { root } = await renderInputs(ERV_RINGS, '0', EFFECTIVE);
    expect(dash(root, 'total')).toBe('78.14 100');
    expect(dash(root, 'moisture')).toBe('65 100');
    for (const ring of root.querySelectorAll('svg .ring')) expect(ring.getAttribute('pathLength')).toBe('100');
    // The total ring has a full-length track (the empty rim is the moisture ring's), and the streams are drawn after
    // (over) the rings. The moisture ring is clipped to the rim, between the fill and the outlines.
    expect(root.querySelectorAll('svg .ring-track')).toHaveLength(1);
    const order = [...root.querySelectorAll('svg path, svg polygon')].map(
      (shape) => shape.getAttribute('class')?.split(' ')[0],
    );
    expect(order.lastIndexOf('ring')).toBeLessThan(order.indexOf('stream'));
    expect(order.indexOf('exchanger')).toBeLessThan(order.indexOf('ring'));
    expect(order.indexOf('ring')).toBeLessThan(order.indexOf('outline'));
    expect(order.indexOf('exchanger-inner')).toBeLessThan(order.indexOf('ring-track'));
    const clip = root.querySelector('clipPath');
    expect(attribute(root, 'svg .ring.moisture', 'clip-path')).toBe(`url(#${clip?.id ?? ''})`);
    expect(attribute(root, 'svg .ring.total', 'style')).toContain('#db4437');
    expect(attribute(root, 'svg .ring.total', 'style')).toContain('--primary-text-color');
  });

  test('airflow-diagram-card "Option off": no rings, tracks or box', async () => {
    const { show_effectiveness: _off, ...left } = ERV_RINGS;
    for (const config of [left, { ...ERV_RINGS, show_effectiveness: false }]) {
      const { root } = await renderInputs(config, '0', EFFECTIVE);
      expect(ringClasses(root)).toEqual([]);
      expect(box(root)).toBeNull();
      document.body.innerHTML = '';
    }
  });

  test('the option without the calculation inputs (no supply flow) draws no rings and no box', async () => {
    const { root } = await renderInputs({ ...ERV_RINGS, fans: {} }, '0', EFFECTIVE);
    expect(ringClasses(root)).toEqual([]);
    expect(box(root)).toBeNull();
  });

  test('the box comes before the other boxes in the DOM', async () => {
    const { root } = await renderInputs(ERV_RINGS, '40', EFFECTIVE);
    const boxes = [...root.querySelectorAll('.on-drawing')];
    expect(boxes.indexOf(box(root) as Element)).toBe(0);
    expect(boxes.length).toBeGreaterThan(1);
  });

  test('airflow-diagram-card "Not a boolean": show_effectiveness "yes" is a configuration error', () => {
    expect(() => {
      checkDiagramConfig({ ...CONFIG, show_effectiveness: 'yes' });
    }).toThrow('Invalid option show_effectiveness: expected true or false');
    expect(() => {
      checkDiagramConfig({ ...CONFIG, show_effectiveness: true });
    }).not.toThrow();
  });

  test('airflow-diagram-card "HRV with humidity sensors": only the inner ring and its track', async () => {
    const { root } = await renderInputs({ ...ERV_RINGS, exchanger_type: 'hrv' }, '0', EFFECTIVE);
    expect(ringClasses(root)).toEqual(['ring total', 'ring-track total']);
  });

  test('airflow-diagram-card "ERV without humidity": only the inner ring and its track', async () => {
    const config = {
      ...CONFIG,
      fans: CALCULATION['fans'],
      show_effectiveness: true,
      exchanger_type: 'erv',
      smoothing: 0,
    };
    const { root } = await renderInputs(config, '0');
    expect(ringClasses(root)).toEqual(['ring total', 'ring-track total']);
    // Supply 18 degrees, extract 21, outdoor 0: 85.71 %.
    expect(dash(root, 'total')).toBe('85.71 100');
  });

  test('airflow-diagram-card "Cooling mode": the inner ring takes the configured cold colour', async () => {
    const cooling = [
      state('sensor.hrv_outdoor_t', '30', '°C'),
      state('sensor.hrv_supply_t', '25', '°C'),
      state('sensor.hrv_extract_t', '22', '°C'),
      // Muggy outdoor air: more enthalpy than the extract air.
      state('sensor.hrv_ah_out', '20', 'g/m³'),
    ];
    const config = { ...ERV_RINGS, colors: { cold: '#112233', warm: '#aa0000' } };
    const { root } = await renderInputs(config, '0', cooling);
    const ring = attribute(root, 'svg .ring.total', 'style');
    expect(ring).toContain('#112233');
    expect(ring).not.toContain('#aa0000');
  });

  test('airflow-diagram-card "Small temperature gradient": the inner ring is empty and its track is drawn', async () => {
    const { root } = await renderInputs(ERV_RINGS, '0', [
      ...EFFECTIVE,
      state('sensor.hrv_outdoor_t', '20', '°C'),
      state('sensor.hrv_extract_t', '22', '°C'),
      // Equal humidities, so the enthalpy gradient is small as well.
      state('sensor.hrv_ah_out', '8', 'g/m³'),
      state('sensor.hrv_ah_ext', '8', 'g/m³'),
    ]);
    expect(dash(root, 'total')).toBe('0 100');
    expect(root.querySelector('svg .ring-track.total')).not.toBeNull();
    expect(dash(root, 'moisture')).toBe('0 100');
  });

  test('airflow-diagram-card "Input unavailable": both rings are empty and their tracks are drawn', async () => {
    const { root } = await renderInputs(ERV_RINGS, '0', [...EFFECTIVE, state('sensor.hrv_flow', 'unavailable')]);
    expect(dash(root, 'total')).toBe('0 100');
    expect(dash(root, 'moisture')).toBe('0 100');
    expect(root.querySelectorAll('svg .ring-track')).toHaveLength(1);
  });

  test('airflow-diagram-card "Bypass closed": the box is an image named by effectivenessLabel', async () => {
    const { root } = await renderInputs(ERV_RINGS, '0', EFFECTIVE);
    const text = nb('Effectiveness: heat 78 % (2,153 / 2,755 W), moisture 65 % (1,300 / 2,000 g/h)');
    expect(box(root)?.getAttribute('role')).toBe('img');
    expect(box(root)?.getAttribute('aria-label')).toBe(text);
    expect(box(root)?.title).toBe(text);
  });

  test('airflow-diagram-card "Bypass modulating": the box names the bypass position of the calculation too', async () => {
    const { root } = await renderInputs(ERV_RINGS, '40', [
      ...EFFECTIVE,
      state('sensor.hrv_supply_t', '12.2', '°C'),
      // No moisture gradient left.
      state('sensor.hrv_ah_sup', '2', 'g/m³'),
      state('sensor.hrv_ah_ext', '2', 'g/m³'),
    ]);
    const text = nb('Effectiveness: free cooling 39 % (525 / 1,346 W), moisture not measurable (bypass 40 %)');
    expect(box(root)?.title).toBe(text);
  });

  test('airflow-diagram-card "Rings without a figure": the box says so when there is no calculation', async () => {
    const { root } = await renderInputs(ERV_RINGS, '0', [...EFFECTIVE, state('sensor.hrv_flow', 'unavailable')]);
    expect(box(root)?.title).toBe('Effectiveness: not measurable, moisture not measurable');
  });

  test('airflow-diagram-card "Rings by exchanger type": an HRV box names the temperature only', async () => {
    const { root } = await renderInputs({ ...ERV_RINGS, exchanger_type: 'hrv' }, '0', EFFECTIVE);
    expect(box(root)?.title).toBe(nb('Effectiveness: heat 78 % (2,153 / 2,755 W)'));
  });

  test('airflow-diagram-card "Rings are labelled": a tap on the box opens nothing, the badge and the figure keep theirs', async () => {
    const { card, root } = await renderInputs({ ...ERV_RINGS, status: ROLES }, '0', EFFECTIVE);
    const opened: string[] = [];
    card.addEventListener('hass-more-info', (event) => {
      opened.push((event as CustomEvent<{ entityId: string }>).detail.entityId);
    });
    const exchanger = box(root);
    exchanger?.click();
    keydown(exchanger as Element, 'Enter');
    expect(opened).toEqual([]);
    expect(exchanger?.hasAttribute('data-entity')).toBe(false);
    expect(exchanger?.hasAttribute('tabindex')).toBe(false);
    root.querySelector<HTMLElement>('.saving .badge')?.click();
    root.querySelector<HTMLElement>('.moisture-recovery .figure')?.click();
    expect(opened).toEqual([ROLES.heating_saving, ROLES.moisture_recovery]);
  });
});

describe('the pre-heater coil', () => {
  const HEATER = 'sensor.hrv_pre_heater';
  const WITH_HEATER: CardConfig = { ...CONFIG, pre_heater: { power: HEATER, max_power: 1000 } };
  const opened = (card: HTMLElement): string[] => {
    const entities: string[] = [];
    card.addEventListener('hass-more-info', (event) => {
      entities.push((event as CustomEvent<{ entityId: string }>).detail.entityId);
    });
    return entities;
  };
  const box = (root: ShadowRoot): HTMLElement | null => root.querySelector<HTMLElement>('.on-drawing.pre-heater');

  test('airflow-diagram-card "Coil drawn": the coil and its box exist, and the glow follows the level', async () => {
    const { root } = await render(WITH_HEATER, '0', [state(HEATER, '250', 'W')]);
    expect(root.querySelector('svg .coil.on')).not.toBeNull();
    expect(box(root)).not.toBeNull();
    // A quarter of the power glows brighter than a quarter: 30 + 70 x 0.25 = 47.5 %.
    expect(root.querySelector('svg .coil-glow')?.getAttribute('opacity')).toBe('0.475');
    expect(root.querySelector('svg .coil.on')?.getAttribute('style')).toContain('47.5%');
  });

  test('airflow-diagram-card "Pre-heater on": the top row shows power then the pre-heater; a tap opens its entity', async () => {
    const config: CardConfig = { ...WITH_HEATER, status: { power: 'sensor.hrv_power' } };
    const { card, root } = await render(config, '0', [
      state('sensor.hrv_power', '32', 'W'),
      state(HEATER, '1000', 'W'),
    ]);
    const labels = [...root.querySelectorAll<HTMLElement>('.top .centre .label')];
    expect(labels.map((label) => label.textContent.trim())).toEqual(['32 W', '1000 W']);
    expect(labels[1]?.title).toBe('Pre-heater: 1000 W');
    const entities = opened(card);
    labels[1]?.click();
    expect(entities).toEqual([HEATER]);
  });

  test('airflow-diagram-card "Partial glow": the warm share is 30 + 70 x level, 100 % at full', async () => {
    for (const [power, share, opacity, white] of [
      ['1000', '100%', '1', '55%'],
      ['100', '37%', '0.37', '95.5%'],
    ] as const) {
      const { root } = await render(WITH_HEATER, '0', [state(HEATER, power, 'W')]);
      expect(root.querySelector('svg .coil.on')?.getAttribute('style')).toContain(share);
      // The core is lightened towards white (45 % at full), the halo stays the pure glow colour.
      expect(root.querySelector('svg .coil.on')?.getAttribute('style')).toContain(`${white}, white`);
      expect(root.querySelector('svg .coil-glow')?.getAttribute('style')).not.toContain('white');
      expect(root.querySelector('svg .coil-glow')?.getAttribute('opacity')).toBe(opacity);
      document.body.innerHTML = '';
    }
  });

  test('airflow-diagram-card "Glow pulse": the glow pulses while the coil is on and animation is on, not otherwise', async () => {
    const css = [HrvVentilationCard.styles]
      .flat()
      .map((style) => ('cssText' in style ? style.cssText : ''))
      .join('');
    // The pulse is a CSS animation of the glow copy, stopped by the same two switches as the flow animation.
    expect(css).toMatch(/\.coil-glow\s*\{[^}]*animation: hrv-glow 2\.5s ease-in-out infinite/);
    expect(css).toMatch(/\.still \.coil-glow\s*\{\s*animation: none;?\s*\}/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^}]*\.coil-glow\s*\{\s*animation: none/);
    const lit = [state(HEATER, '250', 'W')];
    const on = await render(WITH_HEATER, '0', lit);
    expect(on.root.querySelector('.drawing')?.classList.contains('still')).toBe(false);
    expect(on.root.querySelector('svg .coil-glow')?.getAttribute('style')).toContain('--glow-opacity:0.475');
    document.body.innerHTML = '';
    const still = await render({ ...WITH_HEATER, animation: { enabled: false } }, '0', lit);
    expect(still.root.querySelector('.drawing')?.classList.contains('still')).toBe(true);
    document.body.innerHTML = '';
    const off = await render(WITH_HEATER, '0', [state(HEATER, '0', 'W')]);
    expect(off.root.querySelector('svg .coil-glow')).toBeNull();
  });

  test('airflow-diagram-card "Glow colour": a warm orange by default, pre_heater.glow_color when set', async () => {
    const lit = [state(HEATER, '1000', 'W')];
    const { root } = await render(WITH_HEATER, '0', lit);
    expect(root.querySelector('svg .coil-glow')?.getAttribute('style')).toContain('#ff9800');
    expect(root.querySelector('svg .coil.on')?.getAttribute('style')).toContain('#ff9800');
    document.body.innerHTML = '';
    const custom: CardConfig = { ...CONFIG, pre_heater: { power: HEATER, glow_color: 'rgb(255, 0, 0)' } };
    const changed = await render(custom, '0', lit);
    expect(changed.root.querySelector('svg .coil-glow')?.getAttribute('style')).toContain('rgb(255, 0, 0)');
    expect(changed.root.querySelector('svg .coil.on')?.getAttribute('style')).toContain('rgb(255, 0, 0)');
  });

  test('airflow-diagram-card "Off": the coil is drawn dim, without a glow, also while unavailable', async () => {
    for (const value of ['0', 'unavailable']) {
      const { root } = await render(WITH_HEATER, '0', [state(HEATER, value, 'W')]);
      expect(root.querySelector('svg .coil.off')).not.toBeNull();
      expect(root.querySelector('svg .coil-glow')).toBeNull();
      document.body.innerHTML = '';
    }
  });

  test('airflow-diagram-card "No pre-heater": no coil and no box', async () => {
    const { root } = await render(CONFIG, '0');
    expect(root.querySelector('svg .coil')).toBeNull();
    expect(root.querySelector('svg .coil-glow')).toBeNull();
    expect(box(root)).toBeNull();
  });

  test('airflow-diagram-card "Hover": the box is named by the formatted state', async () => {
    const { root } = await render(WITH_HEATER, '0', [state(HEATER, '350', 'W')]);
    // The state text is Home Assistant's own (here the fallback without formatEntityState, a plain space).
    expect(box(root)?.title).toBe('Pre-heater: 350 W');
    expect(box(root)?.getAttribute('aria-label')).toBe('Pre-heater: 350 W');
  });

  test('airflow-diagram-card "Tap": the box opens the power entity', async () => {
    const { card, root } = await render(WITH_HEATER, '0', [state(HEATER, '350', 'W')]);
    const entities = opened(card);
    box(root)?.click();
    keydown(box(root) as Element, 'Enter');
    expect(box(root)?.getAttribute('role')).toBe('button');
    expect(entities).toEqual([HEATER, HEATER]);
  });
});

describe('checkDiagramConfig', () => {
  const check = (config: CardConfig) => () => {
    checkDiagramConfig(config);
  };

  test('airflow-diagram-card "Temperature missing" names the exhaust air temperature', () => {
    expect(check({ ...CONFIG, exhaust: {} })).toThrow('Missing required entities: exhaust air temperature');
    expect(check({ type: 'custom:hrv-ventilation-card' })).toThrow(
      'Missing required entities: outdoor air temperature, supply air temperature, extract air temperature, exhaust air temperature',
    );
  });

  test('airflow-diagram-card "Optional role missing": four temperatures are enough', () => {
    expect(check(CONFIG)).not.toThrow();
  });

  test('an unknown layout is reported with the choices', () => {
    expect(check({ ...CONFIG, layout: 'wide' })).toThrow('Invalid option layout: expected one of auto, full, compact');
  });

  test('airflow-diagram-card "Unknown type": exchanger_type rotary names the option and both choices', () => {
    expect(check({ ...CONFIG, exchanger_type: 'rotary' })).toThrow(
      'Invalid option exchanger_type: expected one of hrv, erv',
    );
    expect(check({ ...CONFIG, exchanger_type: 'hrv' })).not.toThrow();
    expect(check({ ...CONFIG, exchanger_type: 'erv' })).not.toThrow();
  });

  test('card-bundle "Invalid options are reported" for every kind of option the diagram has', () => {
    expect(check({ ...CONFIG, smoothing: -5 })).toThrow('Invalid option smoothing: expected a number from 0 to 1440');
    expect(check({ ...CONFIG, air_density: 'heavy' })).toThrow('Invalid option air_density');
    expect(check({ ...CONFIG, animation: { nominal_flow: 0 } })).toThrow(
      'Invalid option animation.nominal_flow: expected a number from 1 to 100000',
    );
    expect(check({ ...CONFIG, colors: { warm: 'inherit' } })).toThrow('Invalid option colors.warm');
    expect(check({ ...CONFIG, animation: { enabled: 'no' } })).toThrow(
      'Invalid option animation.enabled: expected true or false',
    );
    expect(check({ ...CONFIG, show_unavailable: 1 })).toThrow('Invalid option show_unavailable');
    expect(check({ ...CONFIG, colors: 'blue' })).toThrow('Invalid option colors: expected a group of options');
  });

  test('airflow-diagram-card "Pre-heater roles": both roles are optional and map to their entities', () => {
    expect(check(CONFIG)).not.toThrow();
    const pre = { power: 'sensor.pre_heater_power', energy: 'sensor.pre_heater_energy' };
    expect(check({ ...CONFIG, pre_heater: pre })).not.toThrow();
    expect(entityAt({ ...CONFIG, pre_heater: pre }, 'pre_heater.power')).toBe('sensor.pre_heater_power');
    expect(entityAt({ ...CONFIG, pre_heater: pre }, 'pre_heater.energy')).toBe('sensor.pre_heater_energy');
  });

  test('airflow-diagram-card "Invalid maximum": pre_heater.max_power outside 1 to 4000 is a configuration error', () => {
    expect(check({ ...CONFIG, pre_heater: { max_power: 0 } })).toThrow(
      'Invalid option pre_heater.max_power: expected a number from 1 to 4000',
    );
    expect(check({ ...CONFIG, pre_heater: { max_power: 4001 } })).toThrow('Invalid option pre_heater.max_power');
    expect(check({ ...CONFIG, pre_heater: { max_power: 4000 } })).not.toThrow();
  });

  test('airflow-diagram-card "Invalid glow colour": pre_heater.glow_color must be a CSS colour', () => {
    expect(check({ ...CONFIG, pre_heater: { glow_color: 'inherit' } })).toThrow('Invalid option pre_heater.glow_color');
    expect(check({ ...CONFIG, pre_heater: { glow_color: 5 } })).toThrow('Invalid option pre_heater.glow_color');
    expect(check({ ...CONFIG, pre_heater: { glow_color: '#ff9800' } })).not.toThrow();
    expect(check({ ...CONFIG, pre_heater: { glow_color: 'var(--orange-color, orange)' } })).not.toThrow();
  });

  test('card-bundle "Option left out": every option may be left out or empty', () => {
    expect(check({ ...CONFIG, layout: null, animation: { nominal_flow: null }, colors: null })).not.toThrow();
  });

  test('setConfig throws the same errors, so Home Assistant shows an error card', () => {
    const card = document.createElement('hrv-ventilation-card');
    expect(() => {
      card.setConfig({ ...CONFIG, layout: 'wide' });
    }).toThrow('Invalid option layout');
  });

  test('airflow-diagram-card "Editing the card": a fan or select fan level ID loads without error', () => {
    for (const level of ['fan.hrv_unit', 'select.hrv_fan_level']) {
      const card = document.createElement('hrv-ventilation-card');
      expect(() => {
        card.setConfig({ ...CONFIG, fans: { level } });
      }, level).not.toThrow();
    }
  });
});

describe('the pre-heater energy cell', () => {
  test('airflow-diagram-card "Pre-heater energy cell": a heat wave icon and the energy in the second column, third row', async () => {
    const config: CardConfig = { ...CONFIG, pre_heater: { energy: 'sensor.hrv_heater_energy' } };
    const { root } = await render(config, '0', [state('sensor.hrv_heater_energy', '12', 'kWh')]);
    const label = root.querySelector<HTMLElement>('.status .label.pre-heater-energy');
    expect(label?.textContent.trim()).toBe('12 kWh');
    expect(label?.title).toBe('Pre-heater energy: 12 kWh');
    expect(label?.querySelector<HTMLElement & { icon?: string }>('ha-icon')?.icon).toBe('mdi:heat-wave');
    expect(label?.closest('.cell')?.getAttribute('style')).toMatch(/grid-column:\s*2.*grid-row:\s*3/);
  });
});

describe('rows keep their size', () => {
  test('airflow-diagram-card "All status values unavailable": the strip keeps every label, invisible', async () => {
    const config = { ...CONFIG, status: { operating_mode: 'sensor.hrv_mode', filter_days: 'sensor.hrv_filter' } };
    const { root } = await render(config, '0');
    const strip = [...(root.querySelector('.status')?.querySelectorAll('.label') ?? [])];
    expect(strip).toHaveLength(2);
    expect(strip.every((label) => label.classList.contains('hidden'))).toBe(true);
    expect(strip.every((label) => label.getAttribute('aria-hidden') === 'true')).toBe(true);
  });
});
