// The diverging bar shared by the recovery and moisture cards: a zero line in the centre, positive parts growing
// right and negative parts growing left, stacked in the order given. Half of the bar represents the scale.

/** Scales are rounded up to a multiple of this (W for the recovery bar, g/h for the moisture bar). */
const SCALE_STEP = 250;

/** A segment's position in percent of the bar's width. */
export interface Segment {
  left: number;
  width: number;
}

// Sums of computed values carry float noise (750.0000000000001); round it away before rounding up to a step.
const roundNoise = (value: number): number => Math.round(value * 1e6) / 1e6;
const finite = (value: number): number => (Number.isFinite(value) ? value : 0);

/**
 * The value that fills one half of the bar: the sum of the absolute values rounded up to a multiple of
 * SCALE_STEP, but at least `minScale`. Values and a minimum that are not finite numbers count as 0.
 */
export function barScale(values: readonly number[], minScale: number): number {
  const total = roundNoise(values.reduce((sum, value) => sum + Math.abs(finite(value)), 0));
  return Math.max(finite(minScale), Math.ceil(total / SCALE_STEP) * SCALE_STEP);
}

/**
 * Lays the values out from the centre of the bar, in order: each positive value continues right of the previous
 * positive one, each negative value continues left of the previous negative one. Positions come from the running
 * sum on each side, clamped to that side's half, so a scale smaller than the values cannot push a segment out of
 * the bar. With a scale of 0 or less, or a value that is not finite, the segment has width 0.
 */
export function layoutSegments(values: readonly number[], scale: number): Segment[] {
  const half = (amount: number): number => (scale > 0 ? (Math.min(amount, scale) / scale) * 50 : 0);
  let rightSum = 0;
  let leftSum = 0;
  return values.map((raw) => {
    const value = finite(raw);
    if (value >= 0) {
      const start = half(rightSum);
      rightSum += value;
      return { left: 50 + start, width: half(rightSum) - start };
    }
    const start = half(leftSum);
    leftSum -= value;
    const end = half(leftSum);
    return { left: 50 - end, width: end - start };
  });
}
