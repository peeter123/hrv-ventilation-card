import { expect, test } from 'vitest';
import { DIAGRAM_SCHEMA } from '../../src/editor/diagram-schema';
import { MOISTURE_SCHEMA } from '../../src/editor/moisture-schema';
import { RECOVERY_SCHEMA } from '../../src/editor/recovery-schema';
import { isSection, type EditorSchema } from '../../src/editor/schema';
import { EDITOR } from '../../src/strings';

const SECTIONS: Readonly<Record<string, string>> = EDITOR.sections;
const FIELDS: Readonly<Record<string, string>> = EDITOR.fields;

/** The names of the fields and of the sections without a title of their own. */
function missingLabels(schema: EditorSchema): string[] {
  return schema.flatMap((item) => {
    if (!isSection(item)) return FIELDS[item.name] === undefined ? [`field ${item.name}`] : [];
    const own = item.title === undefined && SECTIONS[item.name] === undefined ? [`section ${item.name}`] : [];
    return [...own, ...missingLabels(item.schema)];
  });
}

test.each([
  ['diagram', DIAGRAM_SCHEMA],
  ['moisture', MOISTURE_SCHEMA],
  ['recovery', RECOVERY_SCHEMA],
])('every field and section of the %s editor has a label, so no raw key shows', (_name, schema) => {
  expect(missingLabels(schema)).toEqual([]);
});
