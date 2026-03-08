import AsyncStorage from "@react-native-async-storage/async-storage";

import type { CrashCardDraft, SavedCrashReport } from "./types";

const DRAFT_KEY = "crashcard_draft_v1";
const REPORTS_KEY = "crashcard_reports_v1";

function parseJson<T>(value: string | null): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function getCrashCardDraft(): Promise<CrashCardDraft | null> {
  const raw = await AsyncStorage.getItem(DRAFT_KEY);
  return parseJson<CrashCardDraft>(raw);
}

export async function saveCrashCardDraft(draft: CrashCardDraft): Promise<void> {
  await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export async function clearCrashCardDraft(): Promise<void> {
  await AsyncStorage.removeItem(DRAFT_KEY);
}

export async function getSavedCrashReports(): Promise<SavedCrashReport[]> {
  const raw = await AsyncStorage.getItem(REPORTS_KEY);
  const parsed = parseJson<SavedCrashReport[]>(raw);

  if (!parsed || !Array.isArray(parsed)) return [];

  return parsed;
}

export async function saveSavedCrashReports(reports: SavedCrashReport[]): Promise<void> {
  await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

export async function upsertSavedCrashReport(report: SavedCrashReport): Promise<void> {
  const existing = await getSavedCrashReports();
  const index = existing.findIndex((item) => item.id === report.id);

  if (index >= 0) {
    existing[index] = report;
  } else {
    existing.unshift(report);
  }

  await saveSavedCrashReports(existing);
}

export async function removeSavedCrashReport(id: string): Promise<void> {
  const existing = await getSavedCrashReports();
  const next = existing.filter((item) => item.id !== id);
  await saveSavedCrashReports(next);
}

export async function clearAllCrashCardStorage(): Promise<void> {
  await AsyncStorage.multiRemove([DRAFT_KEY, REPORTS_KEY]);
}