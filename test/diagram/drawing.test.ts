import { describe, expect, test } from 'vitest';
import { coilBox, coilPoints, drawingIds, glowShare, PATHS, VIEW_BOX } from '../../src/diagram/drawing';

// The outdoor lead: the straight start the supply path and the bypass share, "M x y L x y", up to where they split.
const LEAD = /^M (\d+) (\d+) L (\d+) (\d+) /;
const [, startX, startY, splitX, splitY] = (LEAD.exec(PATHS.supply) ?? []).map(Number) as [
  number,
  number,
  number,
  number,
  number,
];
const HALF_WIDTH = 7;

describe('the outdoor lead the pre-heater coil sits on', () => {
  test('airflow-diagram-card "Coil drawn": the supply path and the bypass start with the same straight lead', () => {
    expect(splitY).toBe(startY);
    expect(splitX - startX).toBeGreaterThanOrEqual(30);
    expect(PATHS.bypass.startsWith((LEAD.exec(PATHS.supply) ?? [''])[0])).toBe(true);
    // The supply stream and the bypass also share a straight lead into the supply arrow.
    expect(PATHS.supply).toMatch(/ L 306 138$/);
    expect(PATHS.bypass).toMatch(/ L 306 138$/);
  });

  test('airflow-diagram-card "Coil drawn": the extract and exhaust leads mirror the outdoor and supply leads', () => {
    expect(PATHS.exhaust).toMatch(
      new RegExp(`^M ${String(400 - startX)} ${String(startY)} L ${String(400 - splitX)} `),
    );
    expect(PATHS.exhaust).toMatch(/ L 94 138$/);
  });
});

describe('the pre-heater coil geometry', () => {
  const points = coilPoints();
  const deviation = (point: { y: number }): number => Math.abs(point.y - startY);

  test('airflow-diagram-card "Coil drawn": the first and last points sit on the stream borders, on opposite sides', () => {
    const [first, last] = [points[0], points[points.length - 1]] as [(typeof points)[0], (typeof points)[0]];
    expect(deviation(first)).toBeCloseTo(HALF_WIDTH, 1);
    expect(deviation(last)).toBeCloseTo(HALF_WIDTH, 1);
    expect(first.y).toBeLessThan(startY);
    expect(last.y).toBeGreaterThan(startY);
  });

  test('airflow-diagram-card "Coil drawn": the wave lies on the lead, before the split point, within the stream width', () => {
    for (const point of points) {
      expect(deviation(point)).toBeLessThanOrEqual(HALF_WIDTH + 0.01);
      expect(point.x).toBeGreaterThan(startX);
      expect(point.x).toBeLessThan(splitX);
    }
    const length = (points[points.length - 1]?.x ?? 0) - (points[0]?.x ?? 0);
    expect(length).toBeCloseTo(22.4, 1);
  });

  test('airflow-diagram-card "Coil drawn": three crests on each side', () => {
    const side = points.map((p) => deviation(p) > HALF_WIDTH - 0.3);
    const crests = side.filter((near, i) => near && !side[i - 1]).length;
    expect(crests).toBe(6);
  });

  test('airflow-diagram-card "Coil drawn": the tap box is the coil bounds (with the glow) in percent of the viewBox', () => {
    const box = coilBox();
    const [left, top, width, height] = [box.left, box.top, box.width, box.height].map(parseFloat) as [
      number,
      number,
      number,
      number,
    ];
    const xs = points.map((p) => (p.x / VIEW_BOX.width) * 100);
    const ys = points.map((p) => (p.y / VIEW_BOX.height) * 100);
    expect(left).toBeLessThan(Math.min(...xs));
    expect(left + width).toBeGreaterThan(Math.max(...xs));
    expect(top).toBeLessThan(Math.min(...ys));
    expect(top + height).toBeGreaterThan(Math.max(...ys));
    // Not far outside the wire: the glow's half stroke and blur (about 7 units of 400).
    expect(Math.min(...xs) - left).toBeLessThan(2.5);
    expect(Math.min(...ys) - top).toBeLessThan(5);
  });
});

describe('drawingIds', () => {
  test('airflow-diagram-card "Glow blur": each card instance gets its own filter id', () => {
    const [first, second] = [drawingIds(), drawingIds()];
    expect(first.blur).toMatch(/^hrv-blur-\d+$/);
    expect(first.blur).not.toBe(second.blur);
  });
});

describe('glowShare', () => {
  test('airflow-diagram-card "Partial glow": 30 + 70 x level', () => {
    expect(glowShare(0.25)).toBeCloseTo(47.5);
    expect(glowShare(0.1)).toBeCloseTo(37);
    expect(glowShare(1)).toBe(100);
  });
});
