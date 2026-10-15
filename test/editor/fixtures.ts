// A small editor schema with every kind of field the cards use: a section with a title and a basic, a required and
// an advanced field, a section without a title and only advanced fields, and top-level basic and advanced fields.
import type { EditorSchema } from '../../src/editor/schema';

const sensor = { entity: { domain: 'sensor' } };

export const SCHEMA: EditorSchema = [
  {
    type: 'expandable',
    name: 'outdoor',
    title: 'Outdoor air',
    schema: [
      { name: 'temperature', required: true, selector: sensor },
      { name: 'humidity', selector: sensor },
      { name: 'absolute_humidity', advanced: true, selector: sensor },
    ],
  },
  {
    type: 'expandable',
    name: 'calculation',
    schema: [
      { name: 'smoothing', advanced: true, default: 10, selector: { number: { min: 0, max: 60 } } },
      { name: 'air_density', advanced: true, default: 1.2, selector: { number: { min: 0.5, max: 1.5, step: 0.01 } } },
    ],
  },
  { name: 'bypass_position', selector: sensor },
  { name: 'min_scale', advanced: true, default: 500, selector: { number: { min: 50 } } },
];

export const BASIC_CONFIG = {
  type: 'custom:hrv-recovery-balance-card',
  outdoor: { temperature: 'sensor.outdoor_temperature', humidity: 'sensor.outdoor_humidity' },
};

/** A choice field with a default, in a section and at the top level, to check the defaults the form displays. */
export const CHOICE_SCHEMA: EditorSchema = [
  { name: 'exchanger_type', default: 'erv', selector: { select: { options: ['hrv', 'erv'] } } },
  {
    type: 'expandable',
    name: 'calculation',
    flatten: false,
    schema: [{ name: 'mode', advanced: true, default: 'auto', selector: { select: { options: ['auto', 'fixed'] } } }],
  },
];
