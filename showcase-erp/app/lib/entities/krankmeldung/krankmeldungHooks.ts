import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zeitplanKeys } from "@/app/lib/entities/zeitplan/zeitplanHooks";

export interface KrankmeldungMitarbeiter {
  id: string;
  name: string;
}

export interface Krankmeldung {
  id: string;
  mitarbeiterId: string;
  von: string;
  bis: string;
  createdAt: string;
  updatedAt: string;
  mitarbeiter: KrankmeldungMitarbeiter;
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

/** Count the number of calendar days between two ISO date strings (inclusive). */
export function dayCount(von: string, bis: string): number {
  const start = new Date(von);
  const end = new Date(bis);
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

export const krankmeldungKeys = {
  all: ["krankmeldungen"] as const,
  admin: ["krankmeldungen", "admin"] as const,
};

async function fetchKrankmeldungen(): Promise<Krankmeldung[]> {
  const res = await fetch("/api/krankmeldung");
  if (!res.ok) throw new Error("Fehler beim Laden der Krankmeldungen");
  return res.json();
}

async function fetchAllKrankmeldungen(): Promise<Krankmeldung[]> {
  const res = await fetch("/api/krankmeldung?admin=true");
  if (!res.ok) throw new Error("Fehler beim Laden der Krankmeldungen");
  return res.json();
}

async function createKrankmeldung(data: { von: string; bis: string }) {
  const res = await fetch("/api/krankmeldung", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Fehler beim Erstellen der Krankmeldung");
  }
  return res.json();
}

async function deleteKrankmeldung(id: string) {
  const res = await fetch(`/api/krankmeldung/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Fehler beim Löschen der Krankmeldung");
  }
  return res.json();
}

export function useKrankmeldungenQuery() {
  return useQuery({
    queryKey: krankmeldungKeys.all,
    queryFn: fetchKrankmeldungen,
  });
}

export function useAllKrankmeldungenQuery() {
  return useQuery({
    queryKey: krankmeldungKeys.admin,
    queryFn: fetchAllKrankmeldungen,
  });
}

export function useCreateKrankmeldungMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createKrankmeldung,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: krankmeldungKeys.all });
      queryClient.invalidateQueries({ queryKey: krankmeldungKeys.admin });
      queryClient.invalidateQueries({ queryKey: zeitplanKeys.all });
    },
  });
}

export function useDeleteKrankmeldungMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteKrankmeldung,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: krankmeldungKeys.all });
      queryClient.invalidateQueries({ queryKey: krankmeldungKeys.admin });
      queryClient.invalidateQueries({ queryKey: zeitplanKeys.all });
    },
  });
}
