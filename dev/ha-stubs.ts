// Stand-ins for the Home Assistant elements the cards use, for the preview page only: `ha-card` (the card frame with
// the theme's background) and `ha-icon` (the season and label icons, drawn from @mdi/js).
import {
  mdiAirFilter,
  mdiCogOutline,
  mdiFan,
  mdiHeatWave,
  mdiHelpCircleOutline,
  mdiLightningBolt,
  mdiShuffleVariant,
  mdiSnowflakeThermometer,
  mdiSunSnowflakeVariant,
  mdiSunThermometer,
  mdiThermometer,
  mdiThermometerLines,
  mdiThermostat,
  mdiTimerOutline,
  mdiWaterRemove,
  mdiWaterSync,
} from '@mdi/js';
import { css, html, LitElement, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';

const ICONS: Readonly<Record<string, string>> = {
  'mdi:sun-thermometer': mdiSunThermometer,
  'mdi:snowflake-thermometer': mdiSnowflakeThermometer,
  'mdi:sun-snowflake-variant': mdiSunSnowflakeVariant,
  'mdi:lightning-bolt': mdiLightningBolt,
  'mdi:thermometer-lines': mdiThermometerLines,
  'mdi:fan': mdiFan,
  'mdi:heat-wave': mdiHeatWave,
  'mdi:shuffle-variant': mdiShuffleVariant,
  'mdi:timer-outline': mdiTimerOutline,
  'mdi:cog-outline': mdiCogOutline,
  'mdi:thermometer': mdiThermometer,
  'mdi:thermostat': mdiThermostat,
  'mdi:air-filter': mdiAirFilter,
  'mdi:water-sync': mdiWaterSync,
  'mdi:water-remove': mdiWaterRemove,
};

@customElement('ha-card')
export class HaCard extends LitElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--ha-card-background, var(--card-background-color));
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      color: var(--primary-text-color);
    }
  `;

  protected override render(): unknown {
    return html`<slot></slot>`;
  }
}

@customElement('ha-icon')
export class HaIcon extends LitElement {
  // As Home Assistant's: an inline host around an inline-flex icon box sized by --mdc-icon-size and aligned to the
  // middle of the line (its ha-svg-icon), so the cards' icon alignment is tested against the real structure.
  static override styles = css`
    :host {
      fill: currentColor;
    }
    .svg-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      position: relative;
      vertical-align: middle;
      width: var(--mdc-icon-size, 24px);
      height: var(--mdc-icon-size, 24px);
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  `;

  @property() icon = '';

  protected override render(): unknown {
    return html`<span class="svg-icon"
      ><svg viewBox="0 0 24 24">${svg`<path d=${ICONS[this.icon] ?? mdiHelpCircleOutline}></path>`}</svg></span
    >`;
  }
}
