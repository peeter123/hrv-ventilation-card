// The base of the three cards: the config checks and the calculator built once per config, the shared re-render
// rule and the re-render when a smoothing history arrives. Each card adds its own options, view and sizing.
import { css, html, LitElement, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { createCalculator, type Calculator } from '../calc/inputs';
import { smoothingStore, type SmoothingHass } from '../calc/smoothing';
import { missingRoles, type CardConfig, type Requirements } from '../lib/config';
import type { HassLike } from '../lib/hass';
import { invalidOptions, type OptionSpec } from '../lib/options';
import { configuredEntityIds, shouldRender } from '../lib/render';
import { SAMPLE_STATES, setsAnyRole, withSample } from '../lib/sample';
import { configError, SAMPLE_NOTE } from '../strings';

/** The `hass` the cards need: states for the inputs, the locale, and callWS for the smoothing history. */
export type CardHass = HassLike & SmoothingHass;

/**
 * Checks a config the way setConfig does: throws an error naming the missing roles or the invalid options, which
 * Home Assistant shows as an error card.
 */
export function checkConfig(config: CardConfig, requirements: Requirements, options: readonly OptionSpec[]): void {
  const missing = missingRoles(config, requirements);
  if (missing.length > 0) throw new Error(configError(missing));
  const invalid = invalidOptions(config, options);
  if (invalid.length > 0) throw new Error(invalid.join('; '));
}

/** The sample note's style, shared by the three cards: a small muted line of its own at the bottom right. */
export const sampleStyles = css`
  .sample-note {
    margin-top: 4px;
    text-align: right;
    font-size: 12px;
    color: var(--secondary-text-color);
  }
`;

export abstract class HrvCard extends LitElement {
  /** The config of a card added from the card picker: empty, so the card opens in sample mode and the editor lets the user pick sensors. */
  static getStubConfig(): CardConfig {
    return {};
  }

  @property({ attribute: false }) hass?: CardHass;

  @state() protected config?: CardConfig;

  protected calculator?: Calculator;
  /** The config sets no entity role: the card shows the sample, with no tap targets, and says so. */
  protected sample = false;
  // The hass with the sample states, for the hass it was built from.
  private shown?: { from: CardHass; hass: CardHass };
  private entityIds: readonly string[] = [];
  // The hass of the last render, for the re-render rule; Lit's old value is only the previous update's.
  private rendered?: CardHass;
  private unsubscribe?: () => void;

  /** Throws for a config the card cannot show (missing roles, invalid options). */
  protected abstract check(config: CardConfig): void;

  /** Reads the card's own options from a checked config. */
  protected abstract configure(config: CardConfig): void;

  setConfig(config: CardConfig): void {
    const sample = !setsAnyRole(config);
    // The sample has every role, so checking it checks the user's options only (the card's own check, one path).
    const effective = sample ? withSample(config) : config;
    this.check(effective);
    // No smoothing in the sample: no history request, and the figures are the ones of the sample states.
    const used = sample ? { ...effective, smoothing: 0 } : config;
    this.configure(used);
    this.calculator = createCalculator(used);
    this.entityIds = configuredEntityIds(used);
    this.sample = sample;
    this.shown = undefined;
    this.config = used;
  }

  /** The hass to render with: the real one, or in sample mode the real states plus the sample's (built once per hass). */
  protected get shownHass(): CardHass | undefined {
    const { hass } = this;
    if (!this.sample || !hass) return hass;
    if (this.shown?.from !== hass)
      this.shown = { from: hass, hass: { ...hass, states: { ...hass.states, ...SAMPLE_STATES } } };
    return this.shown.hass;
  }

  /** The "Sample values" note, or nothing outside sample mode. */
  protected sampleNote(): TemplateResult | typeof nothing {
    return this.sample ? html`<div class="sample-note">${SAMPLE_NOTE}</div>` : nothing;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // A smoothing history that finishes loading changes the figures without a state change.
    this.unsubscribe = smoothingStore.subscribe(() => {
      this.requestUpdate();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  protected override shouldUpdate(changed: PropertyValues): boolean {
    return shouldRender(changed, this.hass, this.rendered, this.entityIds);
  }

  protected override updated(): void {
    this.rendered = this.hass;
  }
}
