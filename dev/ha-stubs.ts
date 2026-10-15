// Stand-ins for the Home Assistant elements the cards use, for the preview page only: `ha-card` (the card frame with
// the theme's background) and `ha-icon` (the season and label icons, drawn from @mdi/js).
import {
  mdiAirFilter,
  mdiCogOutline,
  mdiFan,
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
  'mdi:shuffle-variant': mdiShuffleVariant,
  'mdi:timer-outline': mdiTimerOutline,
  'mdi:cog-outline': mdiCogOutline,
  'mdi:thermometer': mdiThermometer,
  'mdi:thermostat': mdiThermostat,
  'mdi:air-filter': mdiAirFilter,
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
  static override styles = css`
    :host {
      display: inline-flex;
      width: var(--mdc-icon-size, 24px);
      height: var(--mdc-icon-size, 24px);
    }
    svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }
  `;

  @property() icon = '';

  protected override render(): unknown {
    return html`<svg viewBox="0 0 24 24">${svg`<path d=${ICONS[this.icon] ?? mdiHelpCircleOutline}></path>`}</svg>`;
  }
}
