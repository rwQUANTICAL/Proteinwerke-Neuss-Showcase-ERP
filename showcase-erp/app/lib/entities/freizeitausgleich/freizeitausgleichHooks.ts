import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zeitplanKeys } from "@/app/lib/entities/zeitplan/zeitplanHooks";

export interface FreizeitausgleichMitarbeiter {
  id: string;
  name: string;
}

export interface FreizeitausgleichAntrag {
  id: string;
  mitarbeiterId: string;
  von: string;
  bis: string;
  status: "BEANTRAGT" | "GENEHMIGT" | "ABGELEHNT";
  genehmigtVonId: string | null;
  createdAt: string;
  updatedAt: string;
  mitarbeiter: FreizeitausgleichMitarbeiter;
}

export interface SaldoInfo {
  saldo: number;
  genehmigtStunden: number;
  beantragtStunden: number;
  verfuegbareStunden: number;
  verfuegbareTage: number;
}

export const freizeitausgleichKeys = {
  all: ["freizeitausgleichAntraege"] as const,
  admin: ["freizeitausgleichAntraege", "admin"] as const,
  saldo: ["saldo"] as const,
};

async function fetchFreizeitausgleichAntraege(): Promise<FreizeitausgleichAntrag[]> {
  const res = await fetch("/api/freizeitausgleich");
  if (!res.ok) throw new Error("Fehler beim Laden der Freizeitausgleich-Anträge");
  return res.json();
}

async function fetchAllFreizeitausgleichAntraege(): Promise<FreizeitausgleichAntrag[]> {
  const res = await fetch("/api/freizeitausgleich?admin=true");
  if (!res.ok) throw new Error("Fehler beim Laden der Freizeitausgleich-Anträge");
  return res.json();
}

async function fetchSaldo(): Promise<SaldoInfo> {
  const res = await fetch("/api/zeitbuchung/saldo");
  if (!res.ok) throw new Error("Fehler beim Laden des Stundensaldos");
  return res.json();
}

async function createFreizeitausgleich(data: { von: string; bis: string }) {
  const res = await fetch("/api/freizeitausgleich", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Fehler beim Erstellen des Antrags");
  }
  return res.json();
}

async function patchFreizeitausgleich({
  id,
  status,
}: {
  id: string;
  status: "GENEHMIGT" | "ABGELEHNT";
}) {
  const res = await fetch(`/api/freizeitausgleich/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Fehler beim Aktualisieren des Antrags");
  }
  return res.json();
}

async function deleteFreizeitausgleich(id: string) {
  const res = await fetch(`/api/freizeitausgleich/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Fehler beim Löschen des Antrags");
  }
  return res.json();
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: freizeitausgleichKeys.all });
  queryClient.invalidateQueries({ queryKey: freizeitausgleichKeys.admin });
  queryClient.invalidateQueries({ queryKey: freizeitausgleichKeys.saldo });
  queryClient.invalidateQueries({ queryKey: zeitplanKeys.all });
}

export function useSaldoQuery() {
  return useQuery({
    queryKey: freizeitausgleichKeys.saldo,
    queryFn: fetchSaldo,
  });
}

export function useFreizeitausgleichAntraegeQuery() {
  return useQuery({
    queryKey: freizeitausgleichKeys.all,
    queryFn: fetchFreizeitausgleichAntraege,
  });
}

export function useAllFreizeitausgleichAntraegeQuery() {
  return useQuery({
    queryKey: freizeitausgleichKeys.admin,
    queryFn: fetchAllFreizeitausgleichAntraege,
  });
}

export function usePendingFreizeitausgleichCount(enabled: boolean) {
  return useQuery({
    queryKey: freizeitausgleichKeys.admin,
    queryFn: fetchAllFreizeitausgleichAntraege,
    select: (data) => data.filter((a) => a.status === "BEANTRAGT").length,
    enabled,
  });
}

export function useCreateFreizeitausgleichMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFreizeitausgleich,
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function usePatchFreizeitausgleichMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchFreizeitausgleich,
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useDeleteFreizeitausgleichMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFreizeitausgleich,
    onSuccess: () => invalidateAll(queryClient),
  });
}
