import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ZeitbuchungMitarbeiter {
  id: string;
  name: string;
  weeklyWorkRequirement: number;
}

export interface ZeitbuchungEntry {
  id: string;
  mitarbeiterId: string;
  datum: string;
  von: string;
  bis: string;
  pauseVon: string | null;
  pauseBis: string | null;
  schicht: string;
  createdAt: string;
  updatedAt: string;
  mitarbeiter: ZeitbuchungMitarbeiter;
}

export interface CreateZeitbuchungInput {
  datum: string;
  von: string;
  bis: string;
  pauseVon?: string | null;
  pauseBis?: string | null;
  schicht: string;
}

export interface UpdateZeitbuchungInput {
  von: string;
  bis: string;
  pauseVon?: string | null;
  pauseBis?: string | null;
  schicht: string;
}

// ── Utility functions ──────────────────────────────────────────

/** Extract "HH:MM" from an ISO datetime or time string. */
export function formatTime(iso: string): string {
  if (!iso) return "–";
  const d = new Date(iso);
  return d.toLocaleTimeString("de-DE", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format an ISO date string as "DD.MM.YYYY" (German locale, UTC). */
export function formatDateDE(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Get short weekday name ("Mo", "Di", ...) from ISO date. */
export function getWeekdayShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { timeZone: "UTC", weekday: "short" });
}

function timeToMinutes(iso: string): number {
  const d = new Date(iso);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/** Calculate break duration in minutes. Returns 30 if no break recorded (minimum deduction). */
export function calcPauseMinuten(entry: ZeitbuchungEntry): number {
  if (entry.pauseVon && entry.pauseBis) {
    const diff =
      (timeToMinutes(entry.pauseBis) - timeToMinutes(entry.pauseVon) + 1440) %
      1440;
    return Math.max(diff, 30);
  }
  return 30; // Minimum 30 min deduction
}

/** Calculate net working hours for an entry (gross minus break). */
export function calcNettoStunden(entry: ZeitbuchungEntry): number {
  const vonMin = timeToMinutes(entry.von);
  const bisMin = timeToMinutes(entry.bis);
  // Handle overnight shifts (NACHT: 22:00 → 06:00)
  const grossMinutes = (bisMin - vonMin + 1440) % 1440;
  const pauseMinutes = calcPauseMinuten(entry);
  return Math.max((grossMinutes - pauseMinutes) / 60, 0);
}

/** 6-on/2-off cycle → average 5.25 scheduled work days per 7-day week. */
export const ARBEITSTAGE_PRO_WOCHE = (6 / 8) * 7; // 5.25

/** Get ISO week number and year for a date. */
export function getISOWeekData(dateStr: string): { jahr: number; kw: number } {
  const d = new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00Z"));
  const dayOfWeek = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return { jahr: d.getUTCFullYear(), kw: weekNo };
}

/** Get Monday–Friday date strings for a given ISO week. */
export function getWeekDates(
  jahr: number,
  kw: number,
): string[] {
  // Jan 4 is always in week 1
  const jan4 = new Date(Date.UTC(jahr, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (kw - 1) * 7);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

// ── Query keys ─────────────────────────────────────────────────

export const zeitbuchungKeys = {
  all: ["zeitbuchungen"] as const,
  byRange: (von?: string, bis?: string) =>
    ["zeitbuchungen", { von, bis }] as const,
  admin: ["zeitbuchungen", "admin"] as const,
  adminByRange: (von?: string, bis?: string) =>
    ["zeitbuchungen", "admin", { von, bis }] as const,
};

// ── Fetch functions ────────────────────────────────────────────

async function fetchZeitbuchungen(
  von?: string,
  bis?: string,
): Promise<ZeitbuchungEntry[]> {
  const params = new URLSearchParams();
  if (von) params.set("von", von);
  if (bis) params.set("bis", bis);
  const qs = params.toString();
  const res = await fetch(`/api/zeitbuchung${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Fehler beim Laden der Zeitbuchungen");
  return res.json();
}

async function fetchAllZeitbuchungen(
  von?: string,
  bis?: string,
): Promise<ZeitbuchungEntry[]> {
  const params = new URLSearchParams({ admin: "true" });
  if (von) params.set("von", von);
  if (bis) params.set("bis", bis);
  const res = await fetch(`/api/zeitbuchung?${params.toString()}`);
  if (!res.ok) throw new Error("Fehler beim Laden der Zeitbuchungen");
  return res.json();
}

async function createZeitbuchung(
  data: CreateZeitbuchungInput,
): Promise<ZeitbuchungEntry> {
  const res = await fetch("/api/zeitbuchung", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Fehler beim Erstellen der Zeitbuchung");
  }
  return res.json();
}

async function updateZeitbuchung({
  id,
  data,
}: {
  id: string;
  data: UpdateZeitbuchungInput;
}): Promise<ZeitbuchungEntry> {
  const res = await fetch(`/api/zeitbuchung/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Fehler beim Aktualisieren der Zeitbuchung");
  }
  return res.json();
}

async function deleteZeitbuchung(id: string): Promise<void> {
  const res = await fetch(`/api/zeitbuchung/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Fehler beim Löschen der Zeitbuchung");
  }
}

// ── React Query hooks ──────────────────────────────────────────

export function useZeitbuchungenQuery(von?: string, bis?: string) {
  return useQuery({
    queryKey: zeitbuchungKeys.byRange(von, bis),
    queryFn: () => fetchZeitbuchungen(von, bis),
  });
}

export function useAllZeitbuchungenQuery(von?: string, bis?: string) {
  return useQuery({
    queryKey: zeitbuchungKeys.adminByRange(von, bis),
    queryFn: () => fetchAllZeitbuchungen(von, bis),
  });
}

export function useCreateZeitbuchungMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createZeitbuchung,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zeitbuchungKeys.all });
    },
  });
}

export function useUpdateZeitbuchungMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateZeitbuchung,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zeitbuchungKeys.all });
    },
  });
}

export function useDeleteZeitbuchungMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteZeitbuchung,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zeitbuchungKeys.all });
    },
  });
}
