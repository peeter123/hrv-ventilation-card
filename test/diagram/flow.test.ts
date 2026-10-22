import { describe, expect, test } from 'vitest';
import { flowSpeed, MAX_SPEED, MIN_SPEED, normalizedState, ventilationDisabled } from '../../src/diagram/flow';

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

describe('ventilationDisabled', () => {
  const stopped = ['disabled'];

  test('airflow-diagram-card "Service mode on an ESPHome unit": the state Disabled counts as disabled', () => {
    expect(ventilationDisabled(flow('Disabled'), stopped)).toBe(true);
  });

  test('airflow-diagram-card "Ventilating normally": Active and Overruling do not count as disabled', () => {
    expect(ventilationDisabled(flow('Active'), stopped)).toBe(false);
    expect(ventilationDisabled(flow('Overruling'), stopped)).toBe(false);
  });

  test('airflow-diagram-card "Custom stopped states": a binary sensor that is off is disabled when off is listed', () => {
    expect(ventilationDisabled(flow('off'), ['off'])).toBe(true);
    expect(ventilationDisabled(flow('on'), ['off'])).toBe(false);
    expect(ventilationDisabled(flow('Disabled'), ['off', 'disabled'])).toBe(true);
  });

  test('airflow-diagram-card "Default stopped states and a binary sensor": off is not disabled by default', () => {
    expect(ventilationDisabled(flow('off'), stopped)).toBe(false);
  });

  test('airflow-diagram-card "Mode entity unavailable": unavailable, unknown or missing is not disabled', () => {
    for (const list of [stopped, ['unavailable', 'unknown']]) {
      expect(ventilationDisabled(flow('unavailable'), list)).toBe(false);
      expect(ventilationDisabled(flow('unknown'), list)).toBe(false);
      expect(ventilationDisabled(undefined, list)).toBe(false);
    }
  });

  test('the state is trimmed and compared ignoring case', () => {
    expect(ventilationDisabled(flow('  disabled '), stopped)).toBe(true);
    expect(ventilationDisabled(flow('DISABLED'), ['disabled'])).toBe(true);
    expect(ventilationDisabled(flow('Disabled'), [])).toBe(false);
    // Raw stopped states are normalised too.
    expect(ventilationDisabled(flow('disabled'), ['Disabled ', 'OFF'])).toBe(true);
    expect(ventilationDisabled(flow(' off'), ['Disabled ', 'OFF'])).toBe(true);
    expect(['  Disabled ', 'OFF'].map(normalizedState)).toEqual(['disabled', 'off']);
  });
});
