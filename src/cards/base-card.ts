// The base of the three cards: the config checks and the calculator built once per config, the shared re-render
// rule and the re-render when a smoothing history arrives. Each card adds its own options, view and sizing.
import { LitElement, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { createCalculator, type Calculator } from '../calc/inputs';
import { smoothingStore, type SmoothingHass } from '../calc/smoothing';
import { missingRoles, type CardConfig, type Requirements } from '../lib/config';
import type { HassLike } from '../lib/hass';
import { invalidOptions, type OptionSpec } from '../lib/options';
import { configuredEntityIds, shouldRender } from '../lib/render';
import { configError } from '../strings';

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

export abstract class HrvCard extends LitElement {
  /** The config of a card added from the card picker: empty, so the editor opens for the user to pick sensors. */
  static getStubConfig(): CardConfig {
    return {};
  }

  @property({ attribute: false }) hass?: CardHass;

  @state() protected config?: CardConfig;

  protected calculator?: Calculator;
  private entityIds: readonly string[] = [];
  // The hass of the last render, for the re-render rule; Lit's old value is only the previous update's.
  private rendered?: CardHass;
  private unsubscribe?: () => void;

  /** Throws for a config the card cannot show (missing roles, invalid options). */
  protected abstract check(config: CardConfig): void;

  /** Reads the card's own options from a checked config. */
  protected abstract configure(config: CardConfig): void;

  setConfig(config: CardConfig): void {
    this.check(config);
    this.configure(config);
    this.calculator = createCalculator(config);
    this.entityIds = configuredEntityIds(config);
    this.config = config;
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
