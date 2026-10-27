// The preview page (npm run dev): the three cards from the source, stacked as in a dashboard column at 280, 320, 350, 400
// and 600 px in a light and a dark theme, with mock states from the controls. Vite reloads the page when a source
// file changes.
import './ha-stubs';
import '../src/cards/moisture-balance-card';
import '../src/cards/recovery-balance-card';
import '../src/cards/ventilation-card';
import { ifDefined } from 'lit/directives/if-defined.js';
import { html, render, type TemplateResult } from 'lit';
import type { HrvCard } from '../src/cards/base-card';
import { STREAMS, type Stream } from '../src/lib/config';
import { CONFIGS, id, MockHass, type MockValues, type SeasonChoice } from './mock-hass';

const WIDTHS = [280, 320, 350, 400, 600];
/** Widths of the slots that show the cards with no entities (sample mode). */
const SAMPLE_WIDTHS = [280, 400, 600];
const THEMES = ['light', 'dark'] as const;
const TAGS = ['hrv-ventilation-card', 'hrv-recovery-balance-card', 'hrv-moisture-balance-card'] as const;
type Tag = (typeof TAGS)[number];

const values: MockValues = {
  temperature: { outdoor: 2, supply: 18.5, extract: 21.4, exhaust: 5.1 },
  humidity: { outdoor: 85, supply: 45, extract: 50, exhaust: 80 },
  flow: 180,
  bypass: 0,
  preHeater: 0,
  preHeaterEnergy: 8,
  season: 'heating',
  unavailable: new Set(),
};

type Scenario = Pick<MockValues, 'temperature' | 'humidity' | 'flow' | 'bypass' | 'season'> &
  Partial<Pick<MockValues, 'preHeater'>>;

/**
 * Typical states of a unit with an enthalpy exchanger (about 85 % sensible efficiency): the button fills in all
 * temperatures, humidities, the flow, the bypass and the season, and leaves the card options alone.
 */
const SCENARIOS: Readonly<Record<string, Scenario>> = {
  'heating (winter)': {
    temperature: { outdoor: 0, supply: 18.3, extract: 21.5, exhaust: 3.5 },
    humidity: { outdoor: 90, supply: 44, extract: 50, exhaust: 95 },
    flow: 180,
    bypass: 0,
    season: 'heating',
  },
  'cooling (summer)': {
    temperature: { outdoor: 30, supply: 24.9, extract: 24, exhaust: 29.1 },
    humidity: { outdoor: 50, supply: 58, extract: 55, exhaust: 47 },
    flow: 220,
    bypass: 0,
    season: 'cooling',
  },
  'bypass 50 % (off season)': {
    temperature: { outdoor: 16, supply: 19, extract: 23, exhaust: 20 },
    humidity: { outdoor: 70, supply: 60, extract: 50, exhaust: 58 },
    flow: 200,
    bypass: 50,
    season: 'between',
  },
  // Frost: the pre-heater warms the outdoor air before the exchanger: 600 W at 180 m³/h is +10 K, so the exchanger's
  // inlet is about 2 °C and the exhaust and supply air lie between that and the extract air. Pick a kind and a maximum
  // power to see the coil.
  'frost (pre-heater on)': {
    temperature: { outdoor: -8, supply: 18.5, extract: 21.5, exhaust: 5 },
    humidity: { outdoor: 90, supply: 40, extract: 50, exhaust: 85 },
    flow: 180,
    bypass: 0,
    preHeater: 600,
    season: 'heating',
  },
  // Outdoor and extract 2 K and 0.3 g/m³ apart: below the effectiveness gradients, so the rings are empty tracks.
  'small gradient': {
    temperature: { outdoor: 16, supply: 17.4, extract: 18, exhaust: 16.6 },
    humidity: { outdoor: 58, supply: 55, extract: 53.5, exhaust: 58 },
    flow: 150,
    bypass: 0,
    season: 'between',
  },
  // Humid summer day: the outdoor air is more humid than the extract air, so on an ERV both moisture figures show the
  // house gaining moisture (water-remove on the recovered figure, water-plus on the put-outside figure).
  'humid summer (gaining)': {
    temperature: { outdoor: 30, supply: 26.5, extract: 25, exhaust: 28.5 },
    humidity: { outdoor: 75, supply: 66, extract: 50, exhaust: 62 },
    flow: 200,
    bypass: 0,
    season: 'cooling',
  },
  'bypass 100 % (night cooling)': {
    temperature: { outdoor: 14, supply: 14.5, extract: 24, exhaust: 23.8 },
    humidity: { outdoor: 80, supply: 78, extract: 50, exhaust: 51 },
    flow: 300,
    bypass: 100,
    season: 'cooling',
  },
};

function applyScenario(scenario: Scenario): void {
  values.temperature = { ...scenario.temperature };
  values.humidity = { ...scenario.humidity };
  values.flow = scenario.flow;
  values.bypass = scenario.bypass;
  values.season = scenario.season;
  // The pre-heater is off unless the scenario heats (frost); the chosen kind stays, like the other card options.
  values.preHeater = scenario.preHeater ?? 0;
  if (scenario.preHeater !== undefined) {
    // The coil needs the role: switch a "none" kind to the power sensor, and keep any other kind as chosen.
    if (options.preHeaterKind === 'none') {
      options.preHeaterKind = 'power sensor';
      updateConfig();
    }
  }
  updateStates();
  renderControls();
}

type PreHeaterKind = 'none' | 'power sensor' | 'on/off entity';
const PRE_HEATER_KINDS: readonly PreHeaterKind[] = ['none', 'power sensor', 'on/off entity'];

type VentilationChoice = 'active' | 'disabled';
const VENTILATION_CHOICES: readonly VentilationChoice[] = ['active', 'disabled'];

type FanLevelKind = 'sensor' | 'fan entity' | 'select';
const FAN_LEVEL_KINDS: readonly FanLevelKind[] = ['sensor', 'fan entity', 'select'];
const FAN_LEVEL_ENTITIES: Readonly<Record<FanLevelKind, string>> = {
  sensor: id.level,
  'fan entity': id.levelFan,
  select: id.levelSelect,
};

const options = {
  config: 'full',
  exchanger: 'hrv',
  showEffectiveness: false,
  layout: 'auto',
  showUnavailable: false,
  animation: true,
  nominalFlow: 0,
  fanLevelKind: 'sensor' as FanLevelKind,
  preHeaterKind: 'none' as PreHeaterKind,
  /** The rated power in W; 0 = none (the option is left out). */
  preHeaterMax: 0,
  // No smoothing by default, so the bars follow the controls at once.
  smoothing: 0,
};

/** Entities the availability control can switch off. */
const SWITCHABLE: Readonly<Record<string, string>> = {
  'outdoor RH': id.humidity('outdoor'),
  'exhaust T': id.temperature('exhaust'),
  'supply flow': id.supplyFlow,
  power: id.power,
  'bypass mode': id.bypassMode,
  'pre-heater power': id.preHeater,
  'pre-heater on/off': id.preHeaterOn,
  'pre-heater energy': id.preHeaterEnergy,
  'pre-heater T after': id.preHeaterAfter,
};

function element(elementId: string): HTMLElement {
  const found = document.getElementById(elementId);
  if (!found) throw new Error(`#${elementId} is missing from index.html`);
  return found;
}

const mock = new MockHass();
/** Each card, with the box that shows its config error in its place, as Home Assistant's error card does. */
const cards: { tag: Tag; card: HrvCard; error: HTMLElement; dark: boolean; sample: boolean }[] = [];

/** The `pre_heater` group of the diagram's config: none, or the power sensor or the on/off entity with the energy. */
function preHeaterConfig(): Record<string, unknown> {
  if (options.preHeaterKind === 'none') return {};
  return {
    pre_heater: {
      power: options.preHeaterKind === 'power sensor' ? id.preHeater : id.preHeaterOn,
      energy: id.preHeaterEnergy,
      temperature_after: id.preHeaterAfter,
      ...(options.preHeaterMax >= 1 && options.preHeaterMax <= 4000 ? { max_power: options.preHeaterMax } : {}),
    },
  };
}

function cardConfig(tag: Tag, sample: boolean): Record<string, unknown> {
  // No entities: the card shows its sample values (the mock states are still merged under them).
  if (sample) {
    const bare = { type: `custom:${tag}` };
    return tag === 'hrv-ventilation-card'
      ? { ...bare, exchanger_type: options.exchanger, show_effectiveness: options.showEffectiveness }
      : bare;
  }
  const base = CONFIGS[options.config] ?? {};
  // The fan level entity follows the chosen kind, where the config has fans.
  const fans = base['fans'] as Record<string, unknown> | undefined;
  const shared = {
    type: `custom:${tag}`,
    ...base,
    ...(fans ? { fans: { ...fans, level: FAN_LEVEL_ENTITIES[options.fanLevelKind] } } : {}),
    smoothing: options.smoothing,
  };
  // The recovery bar follows the diagram's pre-heater kind: none, or the power sensor or the on/off entity as power.
  if (tag === 'hrv-recovery-balance-card') {
    if (options.preHeaterKind === 'none') return shared;
    const power = options.preHeaterKind === 'power sensor' ? id.preHeater : id.preHeaterOn;
    return { ...shared, pre_heater: { power, temperature_after: id.preHeaterAfter } };
  }
  if (tag !== 'hrv-ventilation-card') return shared;
  return {
    ...shared,
    exchanger_type: options.exchanger,
    show_effectiveness: options.showEffectiveness,
    ...preHeaterConfig(),
    layout: options.layout,
    show_unavailable: options.showUnavailable,
    animation: {
      enabled: options.animation,
      ...(options.nominalFlow > 0 ? { nominal_flow: options.nominalFlow } : {}),
    },
  };
}

function updateStates(): void {
  const light = mock.build(values, false);
  // One state map for both themes, so a state object stays the same between them.
  const dark = { ...light, themes: { darkMode: true } };
  for (const { card, dark: isDark } of cards) card.hass = isDark ? dark : light;
}

function updateConfig(): void {
  for (const { tag, card, error, sample } of cards) {
    try {
      card.setConfig(cardConfig(tag, sample));
      card.hidden = false;
      error.hidden = true;
    } catch (thrown) {
      card.hidden = true;
      error.hidden = false;
      error.textContent = thrown instanceof Error ? thrown.message : String(thrown);
    }
  }
}

const number = (
  label: string,
  value: number,
  set: (value: number) => void,
  step = 1,
  bounds?: { min: number; max: number },
): TemplateResult =>
  html`<label
    >${label}
    <input
      type="number"
      step=${step}
      min=${ifDefined(bounds?.min)}
      max=${ifDefined(bounds?.max)}
      .value=${String(value)}
      @input=${(event: Event) => {
        const parsed = Number((event.target as HTMLInputElement).value);
        if (Number.isFinite(parsed)) {
          set(parsed);
          updateStates();
        }
      }}
  /></label>`;

const slider = (label: string, value: number, max: number, set: (value: number) => void): TemplateResult =>
  html`<label
    >${label}
    <input
      type="range"
      min="0"
      max=${max}
      .value=${String(value)}
      @input=${(event: Event) => {
        set(Number((event.target as HTMLInputElement).value));
        updateStates();
        renderControls();
      }}
    />
    ${value}</label
  >`;

function select<T extends string>(
  label: string,
  choices: readonly T[],
  value: T,
  set: (value: T) => void,
): TemplateResult {
  return html`<label
    >${label}
    <select
      @change=${(event: Event) => {
        set((event.target as HTMLSelectElement).value as T);
      }}
    >
      ${choices.map((choice) => html`<option .selected=${choice === value}>${choice}</option>`)}
    </select></label
  >`;
}

const checkbox = (label: string, checked: boolean, set: (checked: boolean) => void): TemplateResult =>
  html`<label
    ><input
      type="checkbox"
      .checked=${checked}
      @change=${(event: Event) => {
        set((event.target as HTMLInputElement).checked);
      }}
    />${label}</label
  >`;

function renderControls(): void {
  const stream = (name: Stream): TemplateResult =>
    html`<fieldset>
      <legend>${name}</legend>
      ${number(
        'T',
        values.temperature[name],
        (value) => {
          values.temperature[name] = value;
        },
        0.1,
      )}
      ${number('RH', values.humidity[name], (value) => {
        values.humidity[name] = value;
      })}
    </fieldset>`;
  render(
    html`
      <fieldset>
        <legend>scenario</legend>
        ${Object.entries(SCENARIOS).map(
          ([name, scenario]) =>
            html`<button
              type="button"
              @click=${() => {
                applyScenario(scenario);
              }}
            >
              ${name}
            </button>`,
        )}
      </fieldset>
      ${STREAMS.map(stream)}
      <fieldset>
        <legend>fans and bypass</legend>
        ${slider('flow', values.flow, 450, (value) => {
          values.flow = value;
        })}
        ${select<FanLevelKind>('fan level kind', FAN_LEVEL_KINDS, options.fanLevelKind, (value) => {
          options.fanLevelKind = value;
          updateConfig();
        })}
        ${select<VentilationChoice>(
          'ventilation',
          VENTILATION_CHOICES,
          values.ventilationDisabled ? 'disabled' : 'active',
          (value) => {
            values.ventilationDisabled = value === 'disabled';
            updateStates();
          },
        )}
        ${slider('bypass %', values.bypass, 100, (value) => {
          values.bypass = value;
        })}
        ${select<SeasonChoice>('season', ['heating', 'cooling', 'between'], values.season, (value) => {
          values.season = value;
          updateStates();
        })}
      </fieldset>
      <fieldset>
        <legend>card</legend>
        ${select('config', Object.keys(CONFIGS), options.config, (value) => {
          options.config = value;
          updateConfig();
        })}
        ${select('exchanger', ['hrv', 'erv'], options.exchanger, (value) => {
          options.exchanger = value;
          updateConfig();
        })}
        ${checkbox('show effectiveness', options.showEffectiveness, (checked) => {
          options.showEffectiveness = checked;
          updateConfig();
        })}
        ${select('layout', ['auto', 'full', 'compact'], options.layout, (value) => {
          options.layout = value;
          updateConfig();
        })}
        ${checkbox('show unavailable', options.showUnavailable, (checked) => {
          options.showUnavailable = checked;
          updateConfig();
        })}
        ${checkbox('animation', options.animation, (checked) => {
          options.animation = checked;
          updateConfig();
        })}
        ${number('nominal flow (0 = none)', options.nominalFlow, (value) => {
          options.nominalFlow = value;
          updateConfig();
        })}
        ${number('smoothing min', options.smoothing, (value) => {
          options.smoothing = value;
          updateConfig();
        })}
      </fieldset>
      <fieldset>
        <legend>pre-heater</legend>
        ${select<PreHeaterKind>('kind', PRE_HEATER_KINDS, options.preHeaterKind, (value) => {
          options.preHeaterKind = value;
          updateConfig();
        })}
        ${slider('power W', values.preHeater ?? 0, 1500, (value) => {
          values.preHeater = value;
        })}
        ${number(
          'max W (0 = none)',
          options.preHeaterMax,
          (value) => {
            options.preHeaterMax = value;
            updateConfig();
          },
          1,
          { min: 0, max: 4000 },
        )}
        ${number('energy kWh', values.preHeaterEnergy ?? 8, (value) => {
          values.preHeaterEnergy = value;
        })}
      </fieldset>
      <fieldset>
        <legend>unavailable</legend>
        ${Object.entries(SWITCHABLE).map(([label, entityId]) =>
          checkbox(label, values.unavailable.has(entityId), (checked) => {
            const unavailable = new Set(values.unavailable);
            if (checked) unavailable.add(entityId);
            else unavailable.delete(entityId);
            values.unavailable = unavailable;
            updateStates();
          }),
        )}
      </fieldset>
    `,
    element('controls'),
  );
}

function renderCards(): void {
  const main = element('cards');
  for (const theme of THEMES) {
    const section = document.createElement('section');
    section.className = `theme ${theme}`;
    section.innerHTML = `<h2>${theme}</h2>`;
    const addSlot = (width: number, label: string, sample: boolean): void => {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.style.width = `${String(width)}px`;
      slot.innerHTML = `<span>${label}</span>`;
      for (const tag of TAGS) {
        const card = document.createElement(tag) as HrvCard;
        const error = document.createElement('pre');
        error.className = 'error';
        error.hidden = true;
        slot.append(card, error);
        cards.push({ tag, card, error, dark: theme === 'dark', sample });
      }
      section.append(slot);
    };
    for (const width of WIDTHS) addSlot(width, `${String(width)} px`, false);
    const heading = document.createElement('h2');
    heading.textContent = `${theme}, no entities (sample values)`;
    section.append(heading);
    for (const width of SAMPLE_WIDTHS) addSlot(width, `sample, ${String(width)} px`, true);
    main.append(section);
  }
  updateConfig();
  updateStates();
}

renderControls();
renderCards();
