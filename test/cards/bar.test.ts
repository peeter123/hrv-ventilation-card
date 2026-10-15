import { describe, expect, test } from 'vitest';
import { fillBox } from '../../src/cards/bar';

/** Where the fill of a segment sits, in % of the bar. */
function fillOnBar(left: number, width: number): { start: number; width: number } {
  const box = fillBox({ left, width });
  if (!box) throw new Error('no fill');
  return {
    start: left + (Number.parseFloat(box.left) / 100) * width,
    width: (Number.parseFloat(box.width) / 100) * width,
  };
}

describe('fillBox', () => {
  test.each([
    [50, 12.5],
    [62.5, 20],
    [20, 30],
    [0, 40],
    [99, 1],
    [0, 100],
  ])('the fill of a segment at %d % with width %d % covers the whole bar', (left, width) => {
    const fill = fillOnBar(left, width);
    expect(fill.start).toBeCloseTo(0);
    expect(fill.width).toBeCloseTo(100);
  });

  test('a segment without width has no fill', () => {
    expect(fillBox({ left: 50, width: 0 })).toBeUndefined();
  });
});
