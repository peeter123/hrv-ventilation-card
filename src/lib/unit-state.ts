// States the unit itself reports. They are values of the unit's sensors, not text of the cards, so they live
// outside strings.ts (test/strings.test.ts exempts this file from the hard-coded text check).

/** The state of a next-change sensor while the unit has no change planned. */
export const NOT_PLANNED_STATE = 'n/a';
