import { describe, expect, test } from 'vitest';
import { flowSpeed, MAX_SPEED, MIN_SPEED } from '../../src/diagram/flow';

const flow = (state: string) => ({ state });

describe('flowSpeed', () => {
  test('airflow-diagram-card "Flow relative to nominal": the exhaust at 400 moves twice as fast as the supply at 200', () => {
    const supply = flowSpeed(flow('200'), 400);
    const exhaust = flowSpeed(flow('400'), 400);
    expect(supply).toBe(0.5);
    expect(exhaust).toBe(1);
    expect(exhaust / supply).toBe(2);
  });

  test('the factor is clamped to 0.25 to 2', () => {
    expect(flowSpeed(flow('10'), 400)).toBe(MIN_SPEED);
    expect(flowSpeed(flow('2000'), 400)).toBe(MAX_SPEED);
  });

  test('airflow-diagram-card "No flow entities": the medium speed, with or without a nominal flow', () => {
    expect(flowSpeed(undefined, undefined)).toBe(1);
    expect(flowSpeed(undefined, 400)).toBe(1);
  });

  test('without a nominal flow a flowing stream moves at the medium speed', () => {
    expect(flowSpeed(flow('120'), undefined)).toBe(1);
  });

  test('airflow-diagram-card "Fans stopped": a flow of 0 stops the stream, with or without a nominal flow', () => {
    expect(flowSpeed(flow('0'), 400)).toBe(0);
    expect(flowSpeed(flow('0'), undefined)).toBe(0);
    expect(flowSpeed(flow('-3'), undefined)).toBe(0);
  });

  test('a flow without a value moves at the medium speed', () => {
    expect(flowSpeed(flow('unavailable'), 400)).toBe(1);
    expect(flowSpeed(undefined, 400)).toBe(1);
  });
});
