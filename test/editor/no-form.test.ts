// Runs in its own happy-dom environment, where Home Assistant's ha-form is not defined at first.
import { describe, expect, test } from 'vitest';
import '../../src/editor/hrv-card-editor';
import { EDITOR } from '../../src/strings';
import { BASIC_CONFIG, SCHEMA } from './fixtures';

describe('hrv-card-editor without ha-form', () => {
  test('card-bundle "Form editor not available": the editor tells the user to use the code editor', async () => {
    const editor = document.createElement('hrv-card-editor');
    editor.schema = SCHEMA;
    editor.setConfig(BASIC_CONFIG);
    document.body.append(editor);
    await editor.updateComplete;
    expect(editor.shadowRoot?.textContent).toContain(EDITOR.noForm);
    expect(editor.shadowRoot?.querySelector('ha-form')).toBeNull();

    // When Home Assistant defines ha-form later, the form replaces the hint.
    customElements.define('ha-form', class extends HTMLElement {});
    await customElements.whenDefined('ha-form');
    await new Promise((resolve) => setTimeout(resolve, 0));
    await editor.updateComplete;
    expect(editor.shadowRoot?.querySelectorAll('ha-form')).toHaveLength(2);
    expect(editor.shadowRoot?.textContent).not.toContain(EDITOR.noForm);
  });
});
