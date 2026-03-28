import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zeitplanKeys } from "@/app/lib/entities/zeitplan/zeitplanHooks";

export interface CreateZuteilungInput {
  mitarbeiterId: string;
  teilanlage: string;
  datum: string;
  schicht: string;
  zeitplanId: string;
}

export interface UpdateZuteilungInput {
  teilanlage?: string;
  schicht?: string;
}

async function createZuteilung(data: CreateZuteilungInput) {
  const res = await fetch("/api/zuteilung", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Fehler beim Erstellen der Zuteilung");
  }
  return res.json();
}

async function updateZuteilung(id: string, data: UpdateZuteilungInput) {
  const res = await fetch(`/api/zuteilung/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Fehler beim Aktualisieren der Zuteilung");
  }
  return res.json();
}

async function deleteZuteilung(id: string) {
  const res = await fetch(`/api/zuteilung/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Fehler beim Löschen der Zuteilung");
  }
  return res.json();
}

export function useCreateZuteilungMutation(jahr: number, kw: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createZuteilung,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zeitplanKeys.byKw(jahr, kw) });
    },
  });
}

export function useUpdateZuteilungMutation(jahr: number, kw: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateZuteilungInput }) =>
      updateZuteilung(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zeitplanKeys.byKw(jahr, kw) });
    },
  });
}

export function useDeleteZuteilungMutation(jahr: number, kw: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteZuteilung,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: zeitplanKeys.byKw(jahr, kw) });
    },
  });
}
