// The visual editor of the moisture balance card: the unit's humidity sensors per air stream (with the temperature a
// relative humidity needs), the supply flow and the bypass, and behind "Advanced settings" the absolute humidity
// pickers, the calculation, the neutral threshold, the scale and the colours.
import { MOISTURE_OPTIONS } from '../cards/moisture-view';
import { BYPASS_SECTION, CALCULATION_SECTION, colorField, FANS_SECTION, numberField, streamSection } from './fields';
import type { EditorSchema } from './schema';

export const MOISTURE_SCHEMA: EditorSchema = [
  // A temperature is only needed with a relative humidity, so it is not marked required here.
  streamSection('outdoor', { requiredTemperature: false }),
  streamSection('supply', { requiredTemperature: false }),
  streamSection('extract', { requiredTemperature: false }),
  FANS_SECTION,
  BYPASS_SECTION,
  CALCULATION_SECTION,
  numberField('neutral_threshold', MOISTURE_OPTIONS.neutralThreshold, 0.1, 'g/m³'),
  numberField('min_scale', MOISTURE_OPTIONS.minScale, 50, 'g/h'),
  {
    type: 'expandable',
    name: 'colors',
    flatten: true, // drying_color and gaining_color stay top-level options
    schema: [
      colorField('drying_color', MOISTURE_OPTIONS.dryingColor.default),
      colorField('gaining_color', MOISTURE_OPTIONS.gainingColor.default),
    ],
  },
];
