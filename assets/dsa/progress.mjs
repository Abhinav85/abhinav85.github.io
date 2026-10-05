import { schedule } from './curriculum.mjs';

export const STORAGE_KEY = 'interview-prep-dsa-schedule';
const validDay = value => Number.isInteger(value) && value >= 1 && value <= schedule.length;

// Add defaults for missing fields; ignore invalid records without mutating input.
export function normalizeProgress(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    version: 1,
    currentDay: validDay(source.currentDay) ? source.currentDay : 1,
    completedDays: Array.isArray(source.completedDays)
      ? [...new Set(source.completedDays.filter(validDay))].sort((a, b) => a - b)
      : [],
  };
}

export function loadProgress(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return { progress: normalizeProgress(raw ? JSON.parse(raw) : null), warning: '' };
  } catch {
    return {
      progress: normalizeProgress(null),
      warning: 'Saved DSA progress could not be read. You can still use the schedule in this tab.',
    };
  }
}

export function saveProgress(storage, progress) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(normalizeProgress(progress)));
    return true;
  } catch {
    return false;
  }
}

export function setCompleted(progress, day, completed) {
  if (!validDay(day)) return progress;
  const days = new Set(progress.completedDays);
  if (completed) days.add(day);
  else days.delete(day);
  return { ...progress, completedDays: [...days].sort((a, b) => a - b) };
}
