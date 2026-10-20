// custom:hrv-ventilation-card: the airflow diagram. Three rows in normal flow: a top row (season, power, RMOT), the
// drawing band with the stream labels, the saving badge and on an ERV the moisture figure over the drawing, and a
// status grid of fixed cells. What
// to show comes from the pure functions in src/diagram/; this element only renders it.
import { css, html, nothing, type TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { RecoveryResult } from '../calc/recovery';
import {
  effectivenessLabel,
  hasBadge,
  moistureFigure,
  savingBadge,
  savingTarget,
  type Badge,
  type MoistureFigure,
} from '../diagram/badge';
import { drawing, drawingIds, type ExchangerType } from '../diagram/drawing';
import { flowSpeed } from '../diagram/flow';
import { isCompact, labelModel, STATUS_CELLS, type DiagramLabel, type LayoutChoice } from '../diagram/labels';
import { DIAGRAM_OPTION_LIST, DIAGRAM_OPTIONS, DIAGRAM_REQUIREMENTS } from '../diagram/options';
import { seasonIcon, type SeasonIcon } from '../diagram/season';
import { bypassStrength, temperatureColors } from '../diagram/streams';
import { DIAGRAM_SCHEMA } from '../editor/diagram-schema';
import { EDITOR_TAG } from '../editor/hrv-card-editor';
import {
  entityAt,
  hasAllHumidity,
  mapStreams,
  STREAMS,
  type CardConfig,
  type RolePath,
  type Stream,
} from '../lib/config';
import { numericValue } from '../lib/availability';
import { defineOnce } from '../lib/define';
import { localeFromHass } from '../lib/format';
import { formatState, stateOf } from '../lib/hass';
import { optionValue } from '../lib/options';
import { DIAGRAM, ROLE_LABELS } from '../strings';
import { checkConfig, HrvCard, sampleStyles } from './base-card';

export const DIAGRAM_CARD_TAG = 'hrv-ventilation-card';

/** Checks a diagram card config the way setConfig does. */
export function checkDiagramConfig(config: CardConfig): void {
  checkConfig(config, DIAGRAM_REQUIREMENTS, DIAGRAM_OPTION_LIST);
}

interface DiagramSettings {
  exchanger: ExchangerType;
  colors: { cold: string; warm: string };
  layout: LayoutChoice;
  showUnavailable: boolean;
  /** The config has every input of the saving badge. */
  badge: boolean;
  /**
   * The saving entities, by mode. Only the badge's tap target depends on their readings and the calculation's mode
   * (savingTarget); what the badge shows does not.
   */
  savings: Record<RecoveryResult['mode'], string | undefined>;
  moistureRecovery?: string;
  /** The effectiveness rings are drawn. */
  rings: boolean;
  /** The moisture ring is drawn too: an ERV with humidity for every stream. */
  moistureRing: boolean;
  temperatures: Record<Stream, string | undefined>;
  bypass?: string;
  flows: { supply?: string; exhaust?: string };
  animate: boolean;
  nominalFlow?: number;
}

/** A label's tooltip: what it is and its state, e.g. "Next bypass change: 01:30". */
const roleTitle = (role: RolePath, text: string): string => {
  const name = ROLE_LABELS[role];
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}: ${text}`;
};

export class HrvVentilationCard extends HrvCard {
  static override styles = css`
    /* The host is the container the label sizes follow: cqi units resolve against an ancestor container. */
    :host {
      display: block;
      container-type: inline-size;
    }
    ha-card {
      padding: 8px 12px;
      color: var(--primary-text-color);
      font-size: clamp(11px, 3.4cqi, 14px);
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 2px 12px;
      min-height: 1.5em;
    }
    /* Season left, power centred on the card, RMOT right, whatever their widths. */
    /* The separators below the top row and above the status grid span the content width, corner stack to corner stack. */
    .top {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 1px solid var(--divider-color);
    }
    /* Each cell centres its content on the row: a label's baseline would leave it above the season icon. */
    .top > * {
      display: flex;
      align-items: center;
    }
    .top > :last-child {
      justify-self: end;
    }
    /*
     * Three equal columns of a fixed width, one subject each, centred under the drawing; every role has a fixed cell
     * (STATUS_CELLS).
     */
    .status {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 9em));
      justify-content: center;
      gap: 2px 16px;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid var(--divider-color);
      color: var(--secondary-text-color);
    }
    /* Each value centred in its column; a label too wide for it ends its value in an ellipsis. */
    .status .cell {
      display: flex;
      justify-content: center;
      min-width: 0;
    }
    .not-planned .value {
      opacity: 0.6;
    }
    .drawing {
      --erv-fill: color-mix(in srgb, var(--secondary-background-color) 75%, #4f86b8);
      position: relative;
      aspect-ratio: 2 / 1;
    }
    .art {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .exchanger {
      fill: var(--secondary-background-color);
      stroke: var(--divider-color);
      stroke-width: 2;
    }
    /* An energy recovery exchanger: blue-grey, mixed from the theme's colour so it stays light or dark with it. */
    .exchanger.erv {
      fill: var(--erv-fill);
    }
    .exchanger-inner {
      fill: none;
      stroke: var(--divider-color);
      stroke-width: 1.5;
    }
    /* The effectiveness rings: the colours are set on the elements (the ring colour, the track mixed from it). */
    .ring,
    .ring-track {
      fill: none;
    }
    .stream {
      fill: none;
    }
    /* Moving air: short dashes in a tint towards the card background, moved along the path. */
    .flow {
      fill: none;
      stroke: var(--card-background-color, var(--primary-background-color));
      stroke-opacity: 0.6;
      stroke-width: 4;
      stroke-linecap: round;
      stroke-dasharray: 3 21;
      animation: hrv-flow linear infinite;
    }
    .supply-air {
      animation-duration: var(--supply-duration);
      animation-play-state: var(--supply-state);
    }
    .exhaust-air {
      animation-duration: var(--exhaust-duration);
      animation-play-state: var(--exhaust-state);
    }
    @keyframes hrv-flow {
      to {
        stroke-dashoffset: -24;
      }
    }
    .still .flow {
      animation: none;
    }
    @media (prefers-reduced-motion: reduce) {
      .flow {
        animation: none;
      }
    }
    .symbol path {
      fill: var(--card-background-color, var(--primary-background-color));
    }
    /* Label positions in % of the drawing band, which has the drawing's 400 by 200 coordinates (see drawing.ts). */
    .corner,
    .on-drawing {
      position: absolute;
      display: flex;
      flex-direction: column;
      line-height: 1.3;
    }
    .bypass-position,
    .moisture-recovery {
      left: 50%;
      transform: translateX(-50%);
    }
    /*
     * Over the exchanger (x 145 to 255, y 26 to 174 of 400 by 200), in its hexagon: only a tooltip and a name for the
     * rings, so it is first in the DOM and everything else on the exchanger stays on top of it.
     */
    .effectiveness {
      top: 13%;
      left: 36.25%;
      width: 27.5%;
      height: 74%;
      clip-path: polygon(28% 0, 72% 0, 100% 50%, 72% 100%, 28% 100%, 0 50%);
    }
    /* Just below the exchanger's inner outline (y 38). */
    .bypass-position {
      top: 21.5%;
    }
    /*
     * Low in the exchanger, under the crossing streams (bottom edge at y 152 of 200): high enough that a four-digit
     * rate fits between the slanted sides on narrow cards, low enough to stay clear of the streams and the badge.
     */
    .moisture-recovery {
      bottom: 24%;
    }
    /*
     * With the rings, a halo in the exchanger's colour around the figure's glyphs: a text stroke painted under the
     * fill (paint-order), so the glyph shapes stay as they are and a ring that meets a glyph on a narrow card is
     * masked around it. The visible halo is half the stroke width, 2 px. The value clips its overflow for the
     * ellipsis, so its padding (undone by the margin) keeps the halo of the first and last glyph from being cut.
     */
    .rings .moisture-recovery {
      -webkit-text-stroke: 4px var(--erv-fill);
      paint-order: stroke fill;
    }
    .rings .moisture-recovery .value {
      padding: 2px;
      margin: -2px;
    }
    /* On the exchanger's centre. */
    .saving {
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    /* Above the arrow tips (y 124), clear of the symbols (x 56 and 344) and of the bypass path; a little smaller. */
    .exhaust-flow,
    .supply-flow {
      bottom: 39%;
      font-size: max(11px, 0.9em);
    }
    .exhaust-flow {
      left: 15.5%;
    }
    .supply-flow {
      right: 15.5%;
    }
    .corner.outdoor {
      top: 0;
      left: 0;
    }
    .corner.extract {
      top: 0;
      right: 0;
      align-items: flex-end;
    }
    .corner.exhaust {
      bottom: 0;
      left: 0;
    }
    .corner.supply {
      bottom: 0;
      right: 0;
      align-items: flex-end;
    }
    /*
     * A label: its icon centred vertically on its value. A flex box applies no text-overflow to its children, so the
     * value carries the ellipsis of a value too long for its cell.
     */
    .label {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      max-width: 100%;
      white-space: nowrap;
    }
    .label .value {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    /* A label's icon: a box as high as its text. Home Assistant's icon sizes its own svg from --mdc-icon-size. */
    .label ha-icon {
      --mdc-icon-size: 1.15em;
      display: flex;
      flex: none;
      width: var(--mdc-icon-size);
      height: var(--mdc-icon-size);
    }
    /* Whatever opens a more-info dialog, and only that. */
    [data-entity] {
      cursor: pointer;
    }
    .hidden {
      visibility: hidden;
    }
    .temperature {
      font-weight: 500;
    }
    /*
     * A hexagon like the exchanger: the outline is the element's background, clipped to the hexagon, with the fill
     * drawn on top by ::before, inset by the outline's width. The colours come from --badge-border and --badge-fill.
     */
    .badge {
      --slant: 0.6em;
      --hexagon: polygon(
        var(--slant) 0,
        calc(100% - var(--slant)) 0,
        100% 50%,
        calc(100% - var(--slant)) 100%,
        var(--slant) 100%,
        0 50%
      );
      position: relative;
      isolation: isolate;
      display: block;
      padding: 3px calc(var(--slant) + 4px);
      white-space: nowrap;
      background: var(--badge-border, var(--divider-color));
      clip-path: var(--hexagon);
    }
    /* The hexagon clips the focus ring, so focus shows as the outline colour (over a tint set inline). */
    .badge:focus-visible {
      outline: none;
      background: var(--primary-color, currentColor);
    }
    .badge::before {
      content: '';
      position: absolute;
      inset: 1.5px;
      z-index: -1;
      background: var(--badge-fill, var(--secondary-background-color));
      clip-path: var(--hexagon);
    }
    /* A box of the icon's size, so its focus ring and its place in the row are those of the icon. */
    ha-icon.season {
      --mdc-icon-size: 22px;
      display: flex;
      width: var(--mdc-icon-size);
      height: var(--mdc-icon-size);
    }
    ${sampleStyles}
  `;

  /** The visual editor: the shared editor with this card's schema. */
  static getConfigElement(): HTMLElement {
    const editor = document.createElement(EDITOR_TAG);
    editor.schema = DIAGRAM_SCHEMA;
    return editor;
  }

  /** The compact layout is on: from the layout option and the card's width as the ResizeObserver last reported it. */
  @state() private compact = false;

  private settings?: DiagramSettings;
  private width?: number;
  private readonly observer = new ResizeObserver((entries) => {
    this.width = entries[0]?.contentRect.width;
    this.updateCompact();
  });
  // Gradient IDs of this instance: several cards on a page share the document's ID space.
  private readonly ids = drawingIds();

  /** Height in masonry views (rows of 50 px): top row, the drawing at a typical column width and the status grid. */
  protected contentSize(): number {
    return 6;
  }

  /** Sections view: full width, height from the content (no rows); narrower than 9 columns the labels get tight. */
  getGridOptions(): { columns: number; min_columns: number } {
    return { columns: 12, min_columns: 9 };
  }

  protected check(config: CardConfig): void {
    checkDiagramConfig(config);
  }

  protected configure(config: CardConfig): void {
    this.settings = {
      exchanger: optionValue(config, DIAGRAM_OPTIONS.exchangerType),
      colors: { cold: optionValue(config, DIAGRAM_OPTIONS.cold), warm: optionValue(config, DIAGRAM_OPTIONS.warm) },
      layout: optionValue(config, DIAGRAM_OPTIONS.layout),
      showUnavailable: optionValue(config, DIAGRAM_OPTIONS.showUnavailable),
      badge: hasBadge(config),
      savings: {
        heating: entityAt(config, 'status.heating_saving'),
        cooling: entityAt(config, 'status.cooling_saving'),
      },
      moistureRecovery: entityAt(config, 'status.moisture_recovery'),
      rings: optionValue(config, DIAGRAM_OPTIONS.showEffectiveness),
      moistureRing:
        optionValue(config, DIAGRAM_OPTIONS.exchangerType) === 'erv' &&
        hasAllHumidity(config, ['outdoor', 'supply', 'extract']),
      temperatures: mapStreams((stream) => entityAt(config, `${stream}.temperature`)),
      bypass: entityAt(config, 'bypass.position'),
      flows: { supply: entityAt(config, 'fans.supply_flow'), exhaust: entityAt(config, 'fans.exhaust_flow') },
      animate: optionValue(config, DIAGRAM_OPTIONS.animation),
      nominalFlow: optionValue(config, DIAGRAM_OPTIONS.nominalFlow),
    };
    // A new layout option may move the breakpoint.
    this.updateCompact();
  }

  /** Renders again only when the compact state changes, not on every resize. */
  private updateCompact(): void {
    if (!this.settings) return;
    const compact = isCompact(this.settings.layout, this.width);
    if (compact !== this.compact) this.compact = compact;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // The observer reports the width on observe, also when the card comes back in a container of another width.
    this.observer.observe(this);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.observer.disconnect();
  }

  /**
   * Opens the more-info dialog of the tapped label, icon or badge (its `data-entity`), on a click or on Enter or
   * Space, as Home Assistant's own labels do.
   */
  private readonly activate = (event: MouseEvent | KeyboardEvent): void => {
    if (this.sample) return;
    if (event instanceof KeyboardEvent) {
      // Not on auto-repeat, and not with a modifier the browser or a screen reader may use.
      const modified = event.ctrlKey || event.altKey || event.metaKey;
      if ((event.key !== 'Enter' && event.key !== ' ') || event.repeat || modified) return;
    }
    const entityId = (event.target as Element).closest<HTMLElement>('[data-entity]')?.dataset['entity'];
    if (entityId === undefined) return;
    event.preventDefault();
    this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId }, bubbles: true, composed: true }));
  };

  /**
   * The attributes of a tappable element: a button opening the entity's dialog. The sample opens nothing, so there
   * it has no entity, no tab stop and the `fallback` role (an image where the element carries readable text).
   */
  private tap(entityId: string | undefined, fallback?: 'img') {
    const entity = this.sample ? undefined : entityId;
    return {
      role: entity ? 'button' : fallback,
      tabindex: entity ? '0' : undefined,
      entity,
    };
  }

  /**
   * A label. One without anything to show keeps its place, invisible and with its text, so a stack and the top row
   * keep their size while a value is unavailable; a next change with nothing planned shows a dimmed dash.
   */
  private label(label: DiagramLabel): TemplateResult {
    const hass = this.shownHass;
    const text = hass ? formatState(hass, label.entityId) : '';
    const tap = this.tap(label.entityId, 'img');
    const kind = label.role.split('.')[1] ?? '';
    const icon = label.icon ? html`<ha-icon .icon=${label.icon} aria-hidden="true"></ha-icon>` : nothing;
    // Nothing planned: a dimmed dash, while the tooltip and the more-info dialog still give the state.
    const value = html`<span class="value">${label.prefix}${label.notPlanned ? DIAGRAM.notPlanned : text}</span>`;
    if (!label.visible) return html`<span class="label ${kind} hidden" aria-hidden="true">${icon}${value}</span>`;
    // Named by its role, since a value such as "18 °C" alone does not say which stream it is.
    return html`<span
      class="label ${kind} ${label.notPlanned ? 'not-planned' : ''}"
      role=${ifDefined(tap.role)}
      tabindex=${ifDefined(tap.tabindex)}
      aria-label="${ROLE_LABELS[label.role]}: ${text}"
      title=${roleTitle(label.role, text)}
      data-entity=${ifDefined(tap.entity)}
      >${icon}${value}</span
    >`;
  }

  /** The top row: the season icon left, power centred on the card, RMOT right. */
  private topRow(labels: readonly DiagramLabel[], season: SeasonIcon | undefined): TemplateResult {
    const cell = (role: RolePath) => {
      const label = labels.find((candidate) => candidate.role === role);
      return label ? this.label(label) : nothing;
    };
    return html`<div class="row top">
      <span>${this.season(season)}</span><span>${cell('status.power')}</span><span>${cell('status.rmot')}</span>
    </div>`;
  }

  /** The status grid: each label in its fixed cell (STATUS_CELLS). */
  private statusGrid(labels: readonly DiagramLabel[]): TemplateResult {
    return html`<div class="status">
      ${labels.map((label) => {
        const cell = STATUS_CELLS[label.role as keyof typeof STATUS_CELLS];
        return html`<div
          class="cell"
          style=${styleMap({ 'grid-column': String(cell.column), 'grid-row': String(cell.row) })}
        >
          ${this.label(label)}
        </div>`;
      })}
    </div>`;
  }

  private season(icon: SeasonIcon | undefined): TemplateResult | typeof nothing {
    if (!icon) return nothing;
    const tap = this.tap(icon.entityId, 'img');
    return html`<ha-icon
      class="season"
      .icon=${icon.icon}
      title=${icon.title}
      aria-label=${icon.title}
      role=${ifDefined(tap.role)}
      tabindex=${ifDefined(tap.tabindex)}
      data-entity=${ifDefined(tap.entity)}
      style=${styleMap({ color: icon.color })}
    ></ha-icon>`;
  }

  private badge(badge: Badge | undefined, target: string | undefined): TemplateResult | typeof nothing {
    if (!badge) return nothing;
    const style =
      badge.tint === undefined
        ? {}
        : {
            '--badge-fill': `color-mix(in srgb, ${badge.tint} 25%, var(--card-background-color, #fff))`,
            '--badge-border': badge.tint,
          };
    // Tapping it opens `target` (see savingTarget); without one it is not tappable.
    const tap = this.tap(target);
    return html`<span
      class="badge ${badge.kind}"
      role=${ifDefined(tap.role)}
      tabindex=${ifDefined(tap.tabindex)}
      data-entity=${ifDefined(tap.entity)}
      style=${styleMap(style)}
      >${badge.text}</span
    >`;
  }

  /**
   * The ERV's moisture recovery figure: the signed rate, styled as a label, with the direction in words in its
   * tooltip.
   * Tapping it opens the moisture recovery entity (status.moisture_recovery); without one it is not tappable, and an
   * image, so its label (with the direction in words) is still read out.
   */
  private moistureFigure(figure: MoistureFigure | undefined): TemplateResult | typeof nothing {
    if (!figure) return nothing;
    const tap = this.tap(this.settings?.moistureRecovery, 'img');
    return html`<div class="on-drawing moisture-recovery">
      <span
        class="label figure"
        title=${figure.title}
        aria-label=${figure.title}
        role=${ifDefined(tap.role)}
        tabindex=${ifDefined(tap.tabindex)}
        data-entity=${ifDefined(tap.entity)}
        ><span class="value">${figure.text}</span></span
      >
    </div>`;
  }

  protected override render(): TemplateResult | typeof nothing {
    const hass = this.shownHass;
    if (!this.config || !hass || !this.settings) return nothing;
    const { settings } = this;
    const { compact } = this;
    const model = labelModel(this.config, hass.states, { showUnavailable: settings.showUnavailable, compact });
    const season = seasonIcon(this.config, hass.states, settings.colors);
    // One calculation for the badge, the moisture figure and the rings, which need the same inputs.
    const result = (settings.badge || settings.rings) && this.calculator ? this.calculator(hass).result : undefined;
    const locale = localeFromHass(hass);
    const badge = settings.badge ? savingBadge(result, settings, locale) : undefined;
    const moisture = moistureFigure(result, settings, locale);
    const { states } = hass;
    const { temperatures, flows } = settings;
    const rings = effectivenessLabel(
      result,
      numericValue(stateOf(states, settings.bypass)),
      settings.moistureRing,
      locale,
    );
    const art = drawing({
      ids: this.ids,
      exchanger: settings.exchanger,
      colors: temperatureColors(
        mapStreams((stream) => stateOf(states, temperatures[stream])),
        settings.colors,
      ),
      bypass: bypassStrength(stateOf(states, settings.bypass)),
      speeds: {
        supply: flowSpeed(stateOf(states, flows.supply), settings.nominalFlow),
        exhaust: flowSpeed(stateOf(states, flows.exhaust), settings.nominalFlow),
      },
      rings: settings.rings
        ? {
            figures: result?.effectiveness ?? {},
            moisture: settings.moistureRing,
            color: result?.mode === 'cooling' ? settings.colors.cold : settings.colors.warm,
          }
        : undefined,
    });

    return html`<ha-card @click=${this.activate} @keydown=${this.activate}>
      ${model.top ? this.topRow(model.top, season) : nothing}
      <div class="drawing ${settings.animate ? '' : 'still'} ${settings.rings ? 'rings' : ''}">
        ${art}
        ${STREAMS.map(
          (stream) =>
            html`<div class="corner ${stream}">${model.corners[stream].map((label) => this.label(label))}</div>`,
        )}
        ${
          settings.rings
            ? html`<div class="on-drawing effectiveness" role="img" aria-label=${rings} title=${rings}></div>`
            : nothing
        }
        <div class="on-drawing bypass-position">${model.centre.map((label) => this.label(label))}</div>
        ${badge ? html`<div class="on-drawing saving">${this.badge(badge, savingTarget(result, settings.savings, states))}</div>` : nothing}
        ${this.moistureFigure(moisture)}
        ${model.flows.map(
          (label) =>
            html`<div class="on-drawing ${label.role === 'fans.supply_flow' ? 'supply-flow' : 'exhaust-flow'}">
              ${this.label(label)}
            </div>`,
        )}
      </div>
      ${model.status ? this.statusGrid(model.status) : nothing} ${this.sampleNote()}
    </ha-card>`;
  }
}

defineOnce(DIAGRAM_CARD_TAG, HrvVentilationCard);

declare global {
  interface HTMLElementTagNameMap {
    'hrv-ventilation-card': HrvVentilationCard;
  }
}
