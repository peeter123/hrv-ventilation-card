// The visual editor of the airflow diagram card: the exchanger type, one picker per role, grouped per air stream,
// fans, bypass, status and seasons, and the animation switch; behind "Advanced settings" the niche status and bypass
// pickers (with the entities the badge and the moisture figure open), the nominal flow, the calculation, the colours,
// the layout and whether to show unavailable values.
import { DIAGRAM_OPTIONS } from '../diagram/options';
import { EDITOR } from '../strings';
import {
  binarySensorField,
  booleanField,
  CALCULATION_SECTION,
  choiceField,
  colorField,
  numberField,
  sensorField,
  streamSection,
} from './fields';
import type { EditorSchema } from './schema';

const ADVANCED = { advanced: true };

export const DIAGRAM_SCHEMA: EditorSchema = [
  choiceField('exchanger_type', DIAGRAM_OPTIONS.exchangerType, EDITOR.exchangerTypes, { advanced: false }),
  streamSection('outdoor', { requiredTemperature: true, advancedAbsolute: false }),
  streamSection('supply', { requiredTemperature: true, advancedAbsolute: false }),
  streamSection('extract', { requiredTemperature: true, advancedAbsolute: false }),
  streamSection('exhaust', { requiredTemperature: true, advancedAbsolute: false }),
  {
    type: 'expandable',
    name: 'fans',
    schema: [sensorField('level'), sensorField('supply_flow'), sensorField('exhaust_flow')],
  },
  {
    type: 'expandable',
    name: 'bypass',
    schema: [sensorField('position'), sensorField('mode'), sensorField('next_change', ADVANCED)],
  },
  {
    type: 'expandable',
    name: 'status',
    schema: [
      sensorField('operating_mode'),
      sensorField('target_temperature', ADVANCED),
      sensorField('temperature_profile', ADVANCED),
      sensorField('next_fan_change', ADVANCED),
      sensorField('filter_days'),
      sensorField('power'),
      sensorField('rmot'),
      sensorField('heating_saving', ADVANCED),
      sensorField('cooling_saving', ADVANCED),
      sensorField('moisture_recovery', ADVANCED),
    ],
  },
  { type: 'expandable', name: 'seasons', schema: [binarySensorField('heating'), binarySensorField('cooling')] },
  {
    type: 'expandable',
    name: 'animation',
    schema: [
      booleanField('enabled', DIAGRAM_OPTIONS.animation),
      numberField('nominal_flow', DIAGRAM_OPTIONS.nominalFlow, 1),
    ],
  },
  booleanField('show_effectiveness', DIAGRAM_OPTIONS.showEffectiveness),
  CALCULATION_SECTION,
  {
    type: 'expandable',
    name: 'colors',
    schema: [colorField('cold', DIAGRAM_OPTIONS.cold.default), colorField('warm', DIAGRAM_OPTIONS.warm.default)],
  },
  choiceField('layout', DIAGRAM_OPTIONS.layout, EDITOR.layouts),
  booleanField('show_unavailable', DIAGRAM_OPTIONS.showUnavailable, ADVANCED),
];
