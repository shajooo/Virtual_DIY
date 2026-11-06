import { UnitSystem } from '../types/geometry';

export function mmToCm(mm: number): number {
  return mm / 10;
}

export function cmToMm(cm: number): number {
  return cm * 10;
}

export function formatValue(value: number, unit: UnitSystem): string {
  if (unit === 'cm') {
    return `${mmToCm(value).toFixed(2)} cm`;
  }
  return `${value.toFixed(2)} mm`;
}
