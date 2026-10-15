// custom:hrv-recovery-balance-card: the diverging bar of heat (or cooling) recovered and still lost, split into
// sensible and latent parts, calculated from the unit's raw sensors with the shared recovery calculation.
import { css, html, nothing, type TemplateResult } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { EDITOR_TAG } from '../editor/hrv-card-editor';
import { RECOVERY_SCHEMA } from '../editor/recovery-schema';
import type { CardConfig } from '../lib/config';
import { defineOnce } from '../lib/define';
import { localeFromHass } from '../lib/format';
import { optionValue } from '../lib/options';
import { barStyles, hatch, renderBar, swatch } from './bar';
import { BarCard } from './bar-card';
import { checkConfig } from './base-card';
import {
  RECOVERY_OPTION_LIST,
  RECOVERY_OPTIONS,
  RECOVERY_REQUIREMENTS,
  recoveryView,
  type RecoveryColors,
} from './recovery-view';

export const RECOVERY_CARD_TAG = 'hrv-recovery-balance-card';
export type { CardHass } from './base-card';

/** Checks a recovery card config the way setConfig does. */
export function checkRecoveryConfig(config: CardConfig): void {
  checkConfig(config, RECOVERY_REQUIREMENTS, RECOVERY_OPTION_LIST);
}

export class HrvRecoveryBalanceCard extends BarCard {
  // The legend's lanes: from 400 px of card content one row per lane in aligned columns (name, recovered, lost), so
  // the swatches line up; narrower, a group per lane (name, recovered, lost under each other), side by side when
  // they fit. Each item keeps its swatch, words and value on one line.
  static override styles = [
    barStyles,
    css`
      ha-card {
        container-type: inline-size;
      }
      .parts {
        flex-basis: 100%;
        display: grid;
        grid-template-columns: repeat(3, max-content);
        gap: 2px 16px;
      }
      .part {
        display: contents;
      }
      .lane-name {
        font-weight: 500;
      }
      @container (width < 400px) {
        .parts {
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 6px 16px;
        }
        .part {
          display: grid;
          gap: 2px;
          align-content: start;
        }
      }
    `,
  ];

  /** Height in masonry views: header, the two-lane bar and a legend of up to four lines. */
  override getCardSize(): number {
    return 4;
  }

  /** The visual editor: the shared editor with this card's schema. */
  static getConfigElement(): HTMLElement {
    const editor = document.createElement(EDITOR_TAG);
    editor.schema = RECOVERY_SCHEMA;
    return editor;
  }

  private colors?: RecoveryColors;
  private minScale: number = RECOVERY_OPTIONS.minScale.default;

  protected check(config: CardConfig): void {
    checkRecoveryConfig(config);
  }

  protected configure(config: CardConfig): void {
    this.colors = {
      heating: {
        color: optionValue(config, RECOVERY_OPTIONS.heatingColor),
        latent: optionValue(config, RECOVERY_OPTIONS.heatingLatent),
      },
      cooling: {
        color: optionValue(config, RECOVERY_OPTIONS.coolingColor),
        latent: optionValue(config, RECOVERY_OPTIONS.coolingLatent),
      },
    };
    this.minScale = optionValue(config, RECOVERY_OPTIONS.minScale);
  }

  protected override render(): TemplateResult | typeof nothing {
    if (!this.config || !this.hass || !this.calculator || !this.colors) return nothing;
    const { result } = this.calculator(this.hass);
    const view = recoveryView(result, { colors: this.colors, minScale: this.minScale }, localeFromHass(this.hass));
    const parts = view.legend.filter((entry) => entry.kind === 'part');
    const texts = view.legend.filter((entry) => entry.kind === 'text');
    return html`<ha-card>
      <div class="head">
        <span class="title">${view.title}</span>
        <span class="net" style=${styleMap({ color: view.headerColor ?? 'var(--secondary-text-color)' })}
          >${view.header}</span
        >
      </div>
      ${renderBar(view.lanes)}
      <div class="legend">
        <div class="parts">
          ${parts.map(
            (part) =>
              html`<div class="part">
                <span class="lane-name">${part.label}</span>
                <span class="item">${swatch(part.color)}${part.recovered}</span>
                <span class="item">${swatch(hatch(part.color))}${part.lost}</span>
              </div>`,
          )}
        </div>
        ${texts.map((entry) => html`<span>${entry.text}</span>`)}
      </div>
    </ha-card>`;
  }
}

defineOnce(RECOVERY_CARD_TAG, HrvRecoveryBalanceCard);

declare global {
  interface HTMLElementTagNameMap {
    'hrv-recovery-balance-card': HrvRecoveryBalanceCard;
  }
}
