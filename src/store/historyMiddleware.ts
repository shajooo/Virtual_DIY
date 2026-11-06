import { isDraft, current } from 'immer';

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function cloneSnapshot<T>(data: T): T {
  const plain = isDraft(data) ? current(data) : data;
  return JSON.parse(JSON.stringify(plain));
}

export const MAX_HISTORY_STEPS = 50;

export function pushHistory<T>(past: T[], currentData: T): T[] {
  const newPast = [...past, cloneSnapshot(currentData)];
  if (newPast.length > MAX_HISTORY_STEPS) {
    newPast.shift();
  }
  return newPast;
}
