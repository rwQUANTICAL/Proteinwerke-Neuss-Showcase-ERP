import { useQuery } from "@tanstack/react-query";

export interface ZuteilungMitarbeiter {
  id: string;
  referenzNummer: string;
  name: string;
  skills: string[];
}

export interface ZuteilungErstelltVon {
  id: string;
  name: string;
}

export interface ZuteilungWithRelations {
  id: string;
  mitarbeiterId: string;
  teilanlage: string;
  datum: string;
  schicht: string;
  originalSchicht: string | null;
  originalTeilanlage: string | null;
  erstelltAm: string;
  erstelltVonId: string;
  zeitplanId: string;
  mitarbeiter: ZuteilungMitarbeiter;
  erstelltVon: ZuteilungErstelltVon;
}

export interface ZeitplanWithZuteilungen {
  id: string;
  jahr: number;
  kalenderwoche: number;
  createdAt: string;
  updatedAt: string;
  zuteilungen: ZuteilungWithRelations[];
}

export const zeitplanKeys = {
  all: ["zeitplan"] as const,
  byKw: (jahr: number, kw: number) => ["zeitplan", jahr, kw] as const,
};

async function fetchZeitplan(
  jahr: number,
  kw: number
): Promise<ZeitplanWithZuteilungen> {
  const res = await fetch(`/api/zeitplan?jahr=${jahr}&kw=${kw}`);
  if (!res.ok) throw new Error("Fehler beim Laden des Zeitplans");
  return res.json();
}

export function useZeitplanQuery(jahr: number, kw: number) {
  return useQuery({
    queryKey: zeitplanKeys.byKw(jahr, kw),
    queryFn: () => fetchZeitplan(jahr, kw),
  });
}
