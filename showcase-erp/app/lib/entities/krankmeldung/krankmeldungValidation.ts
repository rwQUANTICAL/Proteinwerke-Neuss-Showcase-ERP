import { z } from "zod";

export const krankmeldungSchema = z
  .object({
    von: z.string().min(1, "Startdatum ist erforderlich"),
    bis: z.string().min(1, "Enddatum ist erforderlich"),
  })
  .refine((d) => d.von <= d.bis, {
    message: "Das Startdatum muss vor oder gleich dem Enddatum liegen",
    path: ["von"],
  });

export type KrankmeldungFormData = z.infer<typeof krankmeldungSchema>;

/** Checks whether a new date range overlaps with any existing Krankmeldung. */
export function hasOverlap(
  von: string,
  bis: string,
  existing: { von: string; bis: string }[]
): boolean {
  return existing.some((km) => {
    const kmVon = km.von.split("T")[0];
    const kmBis = km.bis.split("T")[0];
    return von <= kmBis && bis >= kmVon;
  });
}
