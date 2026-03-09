import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "crashcard_history";

export type CrashPhoto = {
  id: string;
  uri: string;
  source: "camera" | "library";
};

export type CrashReportPayload = {
  date: string;
  time: string;
  location: string;
  weather: string;

  yourName: string;
  yourPhone: string;
  yourEmail: string;
  yourBike: string;
  yourRegistration: string;

  otherName: string;
  otherPhone: string;
  otherVehicle: string;
  otherRegistration: string;
  otherInsurance: string;

  witnessName: string;
  witnessPhone: string;
  witnessNotes: string;

  whatHappened: string;
  damageNotes: string;
  injuryNotes: string;

  photos?: CrashPhoto[];
};

export type CrashHistoryReport = {
  id: string;
  createdAt: string;
  payload: CrashReportPayload;
};

export async function loadReports(): Promise<CrashHistoryReport[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as CrashHistoryReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function upsertReport(report: CrashHistoryReport): Promise<void> {
  const current = await loadReports();
  const index = current.findIndex((item) => item.id === report.id);

  if (index >= 0) {
    current[index] = report;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return;
  }

  const updated = [report, ...current];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function deleteReport(id: string): Promise<void> {
  const current = await loadReports();
  const updated = current.filter((report) => report.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}