import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zeitplanKeys } from "@/app/lib/entities/zeitplan/zeitplanHooks";

export interface UrlaubsantragMitarbeiter {
  id: string;
  name: string;
}

export interface Urlaubsantrag {
  id: string;
  mitarbeiterId: string;
  von: string;
  bis: string;
  status: "BEANTRAGT" | "GENEHMIGT" | "ABGELEHNT";
  genehmigtVonId: string | null;
  createdAt: string;
  updatedAt: string;
  mitarbeiter: UrlaubsantragMitarbeiter;
}

export interface UrlaubsKonto {
  anspruch: number;
  genehmigt: number;
  beantragt: number;
  verfuegbar: number;
}

export const urlaubsantragKeys = {
  all: ["urlaubsantraege"] as const,
  admin: ["urlaubsantraege", "admin"] as const,
};

async function fetchUrlaubsantraege(): Promise<Urlaubsantrag[]> {
  const res = await fetch("/api/urlaubsantrag");
  if (!res.ok) throw new Error("Fehler beim Laden der Urlaubsanträge");
  return res.json();
}

async function fetchAllUrlaubsantraege(): Promise<Urlaubsantrag[]> {
  const res = await fetch("/api/urlaubsantrag?admin=true");
  if (!res.ok) throw new Error("Fehler beim Laden der Urlaubsanträge");
  return res.json();
}

async function createUrlaubsantrag(data: { von: string; bis: string }) {
  const res = await fetch("/api/urlaubsantrag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Fehler beim Erstellen des Urlaubsantrags");
  }
  return res.json();
}

async function patchUrlaubsantrag({
  id,
  status,
}: {
  id: string;
  status: "GENEHMIGT" | "ABGELEHNT";
}) {
  const res = await fetch(`/api/urlaubsantrag/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Fehler beim Aktualisieren des Urlaubsantrags");
  }
  return res.json();
}

async function deleteUrlaubsantrag(id: string) {
  const res = await fetch(`/api/urlaubsantrag/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Fehler beim Löschen des Urlaubsantrags");
  }
  return res.json();
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: urlaubsantragKeys.all });
  queryClient.invalidateQueries({ queryKey: urlaubsantragKeys.admin });
  queryClient.invalidateQueries({ queryKey: zeitplanKeys.all });
}

/** Count calendar days between two ISO date strings (inclusive). */
function dayCountISO(von: string, bis: string): number {
  const start = new Date(von);
  const end = new Date(bis);
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

export function useUrlaubsantraegeQuery() {
  return useQuery({
    queryKey: urlaubsantragKeys.all,
    queryFn: fetchUrlaubsantraege,
  });
}

export function useAllUrlaubsantraegeQuery() {
  return useQuery({
    queryKey: urlaubsantragKeys.admin,
    queryFn: fetchAllUrlaubsantraege,
  });
}

/** Derive vacation balance from the user's own Urlaubsanträge + Mitarbeiter data. */
export function useUrlaubsKonto(
  anspruch: number,
  antraege: Urlaubsantrag[] | undefined
): UrlaubsKonto {
  const genehmigt = (antraege ?? [])
    .filter((a) => a.status === "GENEHMIGT")
    .reduce((sum, a) => sum + dayCountISO(a.von, a.bis), 0);
  const beantragt = (antraege ?? [])
    .filter((a) => a.status === "BEANTRAGT")
    .reduce((sum, a) => sum + dayCountISO(a.von, a.bis), 0);

  return {
    anspruch,
    genehmigt,
    beantragt,
    verfuegbar: anspruch - genehmigt - beantragt,
  };
}

export function useCreateUrlaubsantragMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUrlaubsantrag,
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function usePatchUrlaubsantragMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchUrlaubsantrag,
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useDeleteUrlaubsantragMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUrlaubsantrag,
    onSuccess: () => invalidateAll(queryClient),
  });
}
