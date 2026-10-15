// The visual editor shared by the three cards: an "Advanced settings" switch above Home Assistant's own `ha-form`.
// A card's getConfigElement() creates this element and sets its `schema`. The switch is editor state only; it is
// never written to the config. Both the switch and the fields are `ha-form`s, so the editor relies on no other
// Home Assistant element.
import { css, html, LitElement, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { CardConfig } from '../lib/config';
import { defineOnce } from '../lib/define';
import type { HassLike } from '../lib/hass';
import { EDITOR } from '../strings';
import {
  hasAdvancedValue,
  isSection,
  visibleSchema,
  type EditorSchema,
  type FormField,
  type FormSchema,
  type FormSection,
} from './schema';

export const EDITOR_TAG = 'hrv-card-editor';

const SWITCH_SCHEMA: FormSchema = [{ name: 'advanced', selector: { boolean: {} } }];
const switchLabel = (): string => EDITOR.advanced;

const SECTION_LABELS: Readonly<Record<string, string>> = EDITOR.sections;
const FIELD_LABELS: Readonly<Record<string, string>> = EDITOR.fields;

/**
 * The label of a section or field: its title, or its name looked up in the section or field strings (separate
 * lists, since a section and a field can share a name, such as the heating colours and the heating season).
 */
function label(item: FormField | FormSection): string {
  if (isSection(item)) return item.title ?? SECTION_LABELS[item.name] ?? item.name;
  return FIELD_LABELS[item.name] ?? item.name;
}

export class HrvCardEditor extends LitElement {
  static override styles = css`
    .hint {
      color: var(--secondary-text-color);
    }
    .switch {
      display: block;
      margin-bottom: 8px;
    }
  `;

  @property({ attribute: false }) hass?: HassLike;

  /** Set by the card before the element is used. */
  @property({ attribute: false }) schema: EditorSchema = [];

  @state() private _config?: CardConfig;

  // The switch, as the data of its form. Replaced only when the switch is set (also when an "off" is refused, so
  // the form draws it on again), not on hass updates.
  @state() private _switch = { advanced: false };

  @state() private _formDefined = customElements.get('ha-form') !== undefined;

  // The schema handed to ha-form, rebuilt only when the schema or the switch changes: a new schema object makes
  // ha-form rebuild its fields, which would collapse the sections the user has opened.
  private _formSchema: FormSchema = [];

  constructor() {
    super();
    if (!this._formDefined) {
      void customElements.whenDefined('ha-form').then(() => {
        this._formDefined = true;
      });
    }
  }

  /** True while the config holds an advanced value: the switch stays on, so that value is never hidden. */
  private get _locked(): boolean {
    return this._config !== undefined && hasAdvancedValue(this.schema, this._config);
  }

  /** Called by Home Assistant with the card's config, also after edits in the code editor. */
  setConfig(config: CardConfig): void {
    this._config = config;
    if (this._locked && !this._switch.advanced) this._switch = { advanced: true };
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (changed.has('schema') && this._locked && !this._switch.advanced) this._switch = { advanced: true };
    if (changed.has('schema') || changed.has('_switch')) {
      this._formSchema = visibleSchema(this.schema, this._switch.advanced);
    }
  }

  private _toggleAdvanced = (event: CustomEvent<{ value: { advanced?: boolean } }>): void => {
    event.stopPropagation();
    this._switch = { advanced: event.detail.value.advanced === true || this._locked };
  };

  private _configChanged = (event: CustomEvent<{ value: CardConfig }>): void => {
    event.stopPropagation();
    const config = event.detail.value;
    this._config = config;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config }, bubbles: true, composed: true }));
  };

  protected override render(): unknown {
    if (!this._config) return nothing;
    if (!this._formDefined) return html`<p class="hint">${EDITOR.noForm}</p>`;
    return html`
      <ha-form
        class="switch"
        .hass=${this.hass}
        .data=${this._switch}
        .schema=${SWITCH_SCHEMA}
        .computeLabel=${switchLabel}
        @value-changed=${this._toggleAdvanced}
      ></ha-form>
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${this._formSchema}
        .computeLabel=${label}
        @value-changed=${this._configChanged}
      ></ha-form>
    `;
  }
}

defineOnce(EDITOR_TAG, HrvCardEditor);

declare global {
  interface HTMLElementTagNameMap {
    'hrv-card-editor': HrvCardEditor;
  }
}
