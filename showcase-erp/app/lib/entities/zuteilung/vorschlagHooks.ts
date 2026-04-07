import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zeitplanKeys } from "@/app/lib/entities/zeitplan/zeitplanHooks";
import type { VorschlagItem } from "./vorschlagTypes";

interface VorschlagResponse {
  vorschlaege: VorschlagItem[];
}

interface BulkCreateInput {
  zeitplanId: string;
  zuteilungen: {
    mitarbeiterId: string;
    teilanlage: string;
    datum: string;
    schicht: string;
  }[];
}

interface BulkCreateResponse {
  created: number;
  skipped: { datum: string; mitarbeiterId: string; reason: string }[];
}

async function fetchVorschlaege(jahr: number, kw: number): Promise<VorschlagResponse> {
  const res = await fetch("/api/zuteilung/vorschlag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jahr, kw }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Fehler beim Generieren der Vorschläge");
  }
  return res.json();
}

async function bulkCreateZuteilungen(data: BulkCreateInput): Promise<BulkCreateResponse> {
  const res = await fetch("/api/zuteilung/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Fehler beim Erstellen der Zuteilungen");
  }
  return res.json();
}

export function useVorschlagMutation(jahr: number, kw: number) {
  return useMutation({
    mutationFn: () => fetchVorschlaege(jahr, kw),
  });
}

export function useBulkCreateZuteilungMutation(jahr: number, kw: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkCreateZuteilungen,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zeitplanKeys.byKw(jahr, kw) });
    },
  });
}
