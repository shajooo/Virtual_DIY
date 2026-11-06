export function validateDimension(value: number, name: string): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || Number.isNaN(value)) {
    return `${name} must be a number`;
  }
  if (value <= 0) {
    return `${name} must be greater than 0`;
  }
  return null;
}
