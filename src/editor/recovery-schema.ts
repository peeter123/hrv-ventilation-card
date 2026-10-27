// The visual editor of the recovery balance card: the unit's sensors per air stream, the supply flow and the bypass,
// and behind "Advanced settings" the absolute humidity pickers, the calculation, the scale and the colours.
import { RECOVERY_OPTIONS } from '../cards/recovery-view';
import {
  BYPASS_SECTION,
  CALCULATION_SECTION,
  colorField,
  FANS_SECTION,
  numberField,
  sensorField,
  streamSection,
  switchableField,
} from './fields';
import type { EditorSchema } from './schema';

export const RECOVERY_SCHEMA: EditorSchema = [
  streamSection('outdoor', { requiredTemperature: true }),
  streamSection('supply', { requiredTemperature: true }),
  streamSection('extract', { requiredTemperature: true }),
  FANS_SECTION,
  BYPASS_SECTION,
  {
    type: 'expandable',
    name: 'pre_heater',
    schema: [
      switchableField('power'),
      sensorField('temperature_after'),
      sensorField('humidity_after'),
      colorField('color', RECOVERY_OPTIONS.preHeaterColor.default),
    ],
  },
  CALCULATION_SECTION,
  numberField('min_scale', RECOVERY_OPTIONS.minScale, 50, 'W'),
  {
    type: 'expandable',
    name: 'heating',
    schema: [
      colorField('color', RECOVERY_OPTIONS.heatingColor.default),
      colorField('color_latent', RECOVERY_OPTIONS.heatingLatent.default),
    ],
  },
  {
    type: 'expandable',
    name: 'cooling',
    schema: [
      colorField('color', RECOVERY_OPTIONS.coolingColor.default),
      colorField('color_latent', RECOVERY_OPTIONS.coolingLatent.default),
    ],
  },
];
