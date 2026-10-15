import { afterEach, describe, expect, test } from 'vitest';
import { checkDiagramConfig, HrvVentilationCard } from '../../src/cards/ventilation-card';
import type { CardHass } from '../../src/cards/base-card';
import type { CardConfig } from '../../src/lib/config';
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

async function render(config: CardConfig, bypass: string) {
  const card = document.createElement('hrv-ventilation-card');
  card.setConfig(config);
  card.hass = hassWith(bypass);
  document.body.append(card);
  await card.updateComplete;
  const root = card.shadowRoot;
  if (!root) throw new Error('no shadow root');
  return { card, root };
}

afterEach(() => {
  document.body.innerHTML = '';
});

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

  test('two card instances use different gradient IDs, and each stream refers to its own', async () => {
    const first = await render(CONFIG, '50');
    const second = await render(CONFIG, '50');
    const ids = (root: ShadowRoot) => [...root.querySelectorAll('linearGradient')].map((gradient) => gradient.id);
    const [a, b] = [ids(first.root), ids(second.root)];
    expect(a).toHaveLength(2);
    expect(b).toHaveLength(2);
    expect(a.filter((id) => b.includes(id))).toEqual([]);
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

  test('airflow-diagram-card "ERV": exchanger_type erv gives the ERV exchanger, with its own fill', async () => {
    const { root } = await render({ ...CONFIG, exchanger_type: 'erv' }, '0');
    expect(root.querySelector('svg .exchanger')?.getAttribute('class')).toBe('exchanger erv');
    const css = [HrvVentilationCard.styles]
      .flat()
      .map((style) => ('cssText' in style ? style.cssText : ''))
      .join('');
    expect(css).toMatch(/\.exchanger\.erv\s*\{\s*fill: color-mix\(in srgb, var\(--secondary-background-color\)/);
  });

  test('a bypass position such as 7 % gives rounded opacities', async () => {
    const { root } = await render(CONFIG, '7');
    expect(opacity(root, 'svg .bypass')).toBe('0.07');
    expect(opacity(root, 'svg .supply')).toBe('0.93');
  });
});

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

  test('Enter and Space on a label open the dialog too; other keys do not', async () => {
    const { card, root } = await render(CONFIG, '50');
    const opened = moreInfo(card);
    const label = labelWith(root, '50 %');
    for (const key of ['Enter', ' ', 'a'])
      label.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true }));
    expect(opened).toEqual(['sensor.hrv_bypass', 'sensor.hrv_bypass']);
  });

  test('held keys and keys with a modifier do not open the dialog', async () => {
    const { card, root } = await render(CONFIG, '50');
    const opened = moreInfo(card);
    const label = labelWith(root, '50 %');
    label.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true, composed: true }));
    label.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true, composed: true }));
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
    const ROLES = { saving: 'sensor.hrv_saving', moisture_recovery: 'sensor.hrv_moisture' };

    async function renderCalculation(config: CardConfig) {
      const card = document.createElement('hrv-ventilation-card');
      card.setConfig(config);
      const base = hassWith('0');
      const extra = [
        state('sensor.hrv_ah_out', '4', 'g/m³'),
        state('sensor.hrv_ah_sup', '6', 'g/m³'),
        state('sensor.hrv_ah_ext', '8', 'g/m³'),
        state('sensor.hrv_flow', '200', 'm³/h'),
        state('binary_sensor.hrv_heating', 'off'),
        state('binary_sensor.hrv_cooling', 'off'),
        state(ROLES.saving, '400', 'W'),
        state(ROLES.moisture_recovery, '400', 'g/h'),
      ];
      card.hass = { ...base, states: { ...base.states, ...Object.fromEntries(extra.map((s) => [s.entity_id, s])) } };
      document.body.append(card);
      await card.updateComplete;
      const root = card.shadowRoot;
      if (!root) throw new Error('no shadow root');
      const find = (selector: string): HTMLElement => {
        const found = root.querySelector<HTMLElement>(selector);
        if (!found) throw new Error(`no ${selector}`);
        return found;
      };
      return { card, root, badge: find('.saving .badge'), figure: () => find('.moisture-recovery .figure') };
    }

    const press = (element: HTMLElement): void => {
      element.click();
      element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
    };

    test('airflow-diagram-card "Tapping between seasons" opens the heating season sensor', async () => {
      const { card, root } = await renderCalculation(CALCULATION);
      const opened = moreInfo(card);
      root.querySelector<HTMLElement>('ha-icon.season')?.click();
      expect(opened).toEqual(['binary_sensor.hrv_heating']);
    });

    test('airflow-diagram-card "Moisture recovery figure on ERV": at the bottom of an ERV, not on an HRV', async () => {
      const erv = await renderCalculation({ ...CALCULATION, exchanger_type: 'erv' });
      // 200 m³/h * (6 - 4) g/m³ recovered.
      expect(erv.figure().textContent.trim()).toBe(nb('400 g/h'));
      expect(erv.figure().title).toBe(nb('Moisture recovered: 400 g/h'));
      expect(erv.figure().querySelector<HTMLElement & { icon?: string }>('ha-icon')?.icon).toBe('mdi:water-outline');
      for (const config of [CALCULATION, { ...CALCULATION, exchanger_type: 'hrv' }]) {
        const { root } = await renderCalculation(config);
        expect(root.querySelector('.moisture-recovery')).toBeNull();
      }
    });

    test('airflow-diagram-card "Saving entity configured": the badge opens the saving entity', async () => {
      const { card, badge } = await renderCalculation({ ...CALCULATION, status: { saving: ROLES.saving } });
      const opened = moreInfo(card);
      press(badge);
      expect(opened).toEqual([ROLES.saving, ROLES.saving]);
      expect(badge.getAttribute('role')).toBe('button');
      expect(badge.getAttribute('tabindex')).toBe('0');
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
      for (const attribute of ['role', 'tabindex', 'data-entity'])
        expect(bare.figure().hasAttribute(attribute)).toBe(false);
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
        root.querySelectorAll('.label[data-entity^="sensor.hrv_saving"], .label[data-entity^="sensor.hrv_moisture"]'),
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
    const card = document.createElement('hrv-ventilation-card');
    card.setConfig(config);
    const base = hassWith('50');
    const flows = [state('sensor.hrv_supply_flow', supply, 'm³/h'), state('sensor.hrv_exhaust_flow', exhaust, 'm³/h')];
    card.hass = { ...base, states: { ...base.states, ...Object.fromEntries(flows.map((s) => [s.entity_id, s])) } };
    document.body.append(card);
    await card.updateComplete;
    const root = card.shadowRoot;
    if (!root) throw new Error('no shadow root');
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

  test('card-bundle "Option left out": every option may be left out or empty', () => {
    expect(check({ ...CONFIG, layout: null, animation: { nominal_flow: null }, colors: null })).not.toThrow();
  });

  test('setConfig throws the same errors, so Home Assistant shows an error card', () => {
    const card = document.createElement('hrv-ventilation-card');
    expect(() => {
      card.setConfig({ ...CONFIG, layout: 'wide' });
    }).toThrow('Invalid option layout');
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
