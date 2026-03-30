import { z } from "zod";

export const urlaubsantragSchema = z
  .object({
    von: z.string().min(1, "Startdatum ist erforderlich"),
    bis: z.string().min(1, "Enddatum ist erforderlich"),
  })
  .refine((d) => d.von <= d.bis, {
    message: "Das Startdatum muss vor oder gleich dem Enddatum liegen",
    path: ["von"],
  });

export type UrlaubsantragFormData = z.infer<typeof urlaubsantragSchema>;

/** Checks whether a new date range overlaps with any existing Urlaubsantrag (BEANTRAGT or GENEHMIGT). */
export function hasOverlap(
  von: string,
  bis: string,
  existing: { von: string; bis: string; status: string }[]
): boolean {
  return existing
    .filter((a) => a.status !== "ABGELEHNT")
    .some((a) => {
      const aVon = a.von.split("T")[0];
      const aBis = a.bis.split("T")[0];
      return von <= aBis && bis >= aVon;
    });
}
