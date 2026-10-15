// custom:hrv-moisture-balance-card: the diverging bar of moisture extracted from the house, recovered by the
// exchanger and put outside, relative to the outdoor air, with the bypass strip and the neutral band.
import { css, html, nothing, type TemplateResult } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { calculateMoisture } from '../calc/recovery';
import { EDITOR_TAG } from '../editor/hrv-card-editor';
import { MOISTURE_SCHEMA } from '../editor/moisture-schema';
import type { CardConfig } from '../lib/config';
import { defineOnce } from '../lib/define';
import { localeFromHass } from '../lib/format';
import { optionValue } from '../lib/options';
import { barStyles, hatch, renderBar, swatch } from './bar';
import { BarCard } from './bar-card';
import { checkConfig } from './base-card';
import {
  BYPASS_COLOR,
  MOISTURE_OPTION_LIST,
  MOISTURE_OPTIONS,
  MOISTURE_REQUIREMENTS,
  moistureView,
  type MoistureSettings,
} from './moisture-view';

export const MOISTURE_CARD_TAG = 'hrv-moisture-balance-card';

/** Checks a moisture card config the way setConfig does. */
export function checkMoistureConfig(config: CardConfig): void {
  checkConfig(config, MOISTURE_REQUIREMENTS, MOISTURE_OPTION_LIST);
}

export class HrvMoistureBalanceCard extends BarCard {
  static override styles = [
    barStyles,
    css`
      .swatches .item + .item {
        margin-left: 12px;
      }
      .bypass {
        margin-top: 6px;
        font-size: 13px;
        color: var(--secondary-text-color);
      }
      .bypass-strip {
        height: 4px;
        border-radius: 2px;
        background: var(--secondary-background-color, #eee);
        overflow: hidden;
        margin-bottom: 2px;
      }
      .bypass-fill {
        height: 100%;
      }
    `,
  ];

  /** The visual editor: the shared editor with this card's schema. */
  static getConfigElement(): HTMLElement {
    const editor = document.createElement(EDITOR_TAG);
    editor.schema = MOISTURE_SCHEMA;
    return editor;
  }

  private settings?: MoistureSettings;

  /** Height in masonry views: title and subtitle, bar, the bypass strip and a legend of up to four lines. */
  override getCardSize(): number {
    return 5;
  }

  protected check(config: CardConfig): void {
    checkMoistureConfig(config);
  }

  protected configure(config: CardConfig): void {
    this.settings = {
      dryingColor: optionValue(config, MOISTURE_OPTIONS.dryingColor),
      gainingColor: optionValue(config, MOISTURE_OPTIONS.gainingColor),
      neutralThreshold: optionValue(config, MOISTURE_OPTIONS.neutralThreshold),
      minScale: optionValue(config, MOISTURE_OPTIONS.minScale),
    };
  }

  protected override render(): TemplateResult | typeof nothing {
    if (!this.config || !this.hass || !this.calculator || !this.settings) return nothing;
    const { inputs } = this.calculator(this.hass);
    // Every input the card reads must have a value, the bypass too (the calculator gives 0 for a unit without one),
    // because the neutral band and the bypass note decide how the figures may be read.
    const humidity = inputs.absoluteHumidity;
    const moisture = inputs.bypass === undefined ? undefined : calculateMoisture(humidity, inputs.supplyFlow);
    const indoorOutdoor =
      moisture && humidity?.extract !== undefined && humidity.outdoor !== undefined
        ? { indoor: humidity.extract, outdoor: humidity.outdoor }
        : undefined;
    const view = moistureView(moisture, indoorOutdoor, inputs.bypass, this.settings, localeFromHass(this.hass));
    return html`<ha-card>
      <div class="head">
        <span class="title-block">
          <span class="title">${view.title}</span>
          ${view.subtitle ? html`<span class="subtitle">${view.subtitle}</span>` : nothing}
        </span>
        <span class="net" style=${styleMap({ color: view.headerColor ?? 'var(--secondary-text-color)' })}
          >${view.header}</span
        >
      </div>
      ${renderBar([view.segments])}
      ${
        view.bypass
          ? html`<div class="bypass">
              <div class="bypass-strip">
                <div
                  class="bypass-fill"
                  style=${styleMap({ width: `${String(view.bypass.position)}%`, background: BYPASS_COLOR })}
                ></div>
              </div>
              <span>${view.bypass.text}</span>
            </div>`
          : nothing
      }
      <div class="legend">
        ${
          view.swatches
            ? html`<span class="swatches">
                <span class="item">${swatch(view.swatches.color)}${view.swatches.recovered}</span>
                <span class="item">${swatch(hatch(view.swatches.color))}${view.swatches.outside}</span>
              </span>`
            : nothing
        }
        ${view.lines.map((line) => html`<span>${line}</span>`)}
      </div>
    </ha-card>`;
  }
}

defineOnce(MOISTURE_CARD_TAG, HrvMoistureBalanceCard);

declare global {
  interface HTMLElementTagNameMap {
    'hrv-moisture-balance-card': HrvMoistureBalanceCard;
  }
}
