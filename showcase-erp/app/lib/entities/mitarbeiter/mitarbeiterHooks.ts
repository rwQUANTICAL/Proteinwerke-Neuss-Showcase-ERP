import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

export interface MitarbeiterWithUser {
  id: string;
  referenzNummer: string;
  name: string;
  skills: string[];
  weeklyWorkRequirement: number;
  urlaubsAnspruch: number;
  userId: string | null;
  user: { id: string; email: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMitarbeiterInput {
  referenzNummer: string;
  name: string;
  skills: string[];
  weeklyWorkRequirement: number;
  urlaubsAnspruch: number;
  account?: {
    email: string;
    name: string;
  };
}

const MITARBEITER_KEY = ["mitarbeiter"] as const;

async function fetchMitarbeiter(): Promise<MitarbeiterWithUser[]> {
  const res = await fetch("/api/mitarbeiter");
  if (!res.ok) throw new Error("Fehler beim Laden der Mitarbeiter");
  return res.json();
}

async function createMitarbeiter(
  data: CreateMitarbeiterInput
): Promise<MitarbeiterWithUser> {
  const res = await fetch("/api/mitarbeiter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Fehler beim Erstellen");
  }
  return res.json();
}

export function useMitarbeiterQuery() {
  return useQuery({
    queryKey: MITARBEITER_KEY,
    queryFn: fetchMitarbeiter,
  });
}

export function useCreateMitarbeiterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMitarbeiter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MITARBEITER_KEY });
    },
  });
}
