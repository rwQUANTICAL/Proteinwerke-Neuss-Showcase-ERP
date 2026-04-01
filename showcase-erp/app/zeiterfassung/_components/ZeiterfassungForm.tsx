"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MdAdd } from "react-icons/md";
import { useCreateZeitbuchungMutation } from "@/app/lib/entities/zeitbuchung/zeitbuchungHooks";

const SCHICHT_OPTIONS = [
  { value: "FRUEH", label: "Frühschicht" },
  { value: "SPAET", label: "Spätschicht" },
  { value: "NACHT", label: "Nachtschicht" },
  { value: "SPRINGER", label: "Springer" },
] as const;

const timeRegex = /^\d{2}:\d{2}$/;

const formSchema = z
  .object({
    datum: z.string().min(1, "Datum ist erforderlich"),
    von: z.string().regex(timeRegex, "Format HH:MM"),
    bis: z.string().regex(timeRegex, "Format HH:MM"),
    pauseVon: z.string().regex(timeRegex, "Format HH:MM").or(z.literal("")),
    pauseBis: z.string().regex(timeRegex, "Format HH:MM").or(z.literal("")),
    schicht: z.enum(["FRUEH", "SPAET", "NACHT", "SPRINGER"]),
  })
  .refine(
    (d) => {
      if (d.schicht === "NACHT") return true;
      return d.von < d.bis;
    },
    { message: "Ende muss nach Beginn liegen", path: ["bis"] },
  )
  .refine(
    (d) => {
      if (!d.pauseVon || !d.pauseBis) return true;
      return d.pauseVon < d.pauseBis;
    },
    { message: "Pausenende nach Pausenbeginn", path: ["pauseBis"] },
  )
  .refine(
    (d) => {
      if (!d.pauseVon || !d.pauseBis) return true;
      const toMin = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };
      const minutes = (toMin(d.pauseBis) - toMin(d.pauseVon) + 1440) % 1440;
      return minutes >= 30;
    },
    { message: "Pause min. 30 Minuten", path: ["pauseBis"] },
  );

type FormValues = z.infer<typeof formSchema>;

export default function ZeiterfassungForm() {
  const mutation = useCreateZeitbuchungMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      datum: new Date().toISOString().split("T")[0],
      von: "06:00",
      bis: "14:00",
      pauseVon: "",
      pauseBis: "",
      schicht: "FRUEH",
    },
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate(
      {
        datum: data.datum,
        von: data.von,
        bis: data.bis,
        pauseVon: data.pauseVon || null,
        pauseBis: data.pauseBis || null,
        schicht: data.schicht,
      },
      { onSuccess: () => reset() },
    );
  };

  return (
    <div className="collapse collapse-arrow bg-base-100 border border-base-300">
      <input type="checkbox" />
      <div className="collapse-title text-sm font-medium text-base-content/70 flex items-center gap-2">
        <MdAdd className="size-4" />
        Eintrag manuell erfassen
      </div>
      <div className="collapse-content">
        <form
          onSubmit={handleSubmit(onSubmit)}
        >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
          {/* Datum */}
          <fieldset className="fieldset col-span-2 sm:col-span-1">
            <legend className="fieldset-legend text-xs">Datum</legend>
            <input
              type="date"
              className={`input input-sm input-bordered w-full ${errors.datum ? "input-error" : ""}`}
              {...register("datum")}
            />
            {errors.datum && (
              <p className="text-error text-xs mt-1">{errors.datum.message}</p>
            )}
          </fieldset>

          {/* Schicht */}
          <fieldset className="fieldset col-span-2 sm:col-span-1">
            <legend className="fieldset-legend text-xs">Schicht</legend>
            <select
              className="select select-sm select-bordered w-full"
              {...register("schicht")}
            >
              {SCHICHT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </fieldset>

          {/* Von */}
          <fieldset className="fieldset">
            <legend className="fieldset-legend text-xs">Von</legend>
            <input
              type="time"
              className={`input input-sm input-bordered w-full ${errors.von ? "input-error" : ""}`}
              {...register("von")}
            />
            {errors.von && (
              <p className="text-error text-xs mt-1">{errors.von.message}</p>
            )}
          </fieldset>

          {/* Bis */}
          <fieldset className="fieldset">
            <legend className="fieldset-legend text-xs">Bis</legend>
            <input
              type="time"
              className={`input input-sm input-bordered w-full ${errors.bis ? "input-error" : ""}`}
              {...register("bis")}
            />
            {errors.bis && (
              <p className="text-error text-xs mt-1">{errors.bis.message}</p>
            )}
          </fieldset>

          {/* Pause Von */}
          <fieldset className="fieldset">
            <legend className="fieldset-legend text-xs">Pause von</legend>
            <input
              type="time"
              className={`input input-sm input-bordered w-full ${errors.pauseVon ? "input-error" : ""}`}
              {...register("pauseVon")}
            />
          </fieldset>

          {/* Pause Bis */}
          <fieldset className="fieldset">
            <legend className="fieldset-legend text-xs">Pause bis</legend>
            <input
              type="time"
              className={`input input-sm input-bordered w-full ${errors.pauseBis ? "input-error" : ""}`}
              {...register("pauseBis")}
            />
            {errors.pauseBis && (
              <p className="text-error text-xs mt-1">
                {errors.pauseBis.message}
              </p>
            )}
          </fieldset>
        </div>

        {mutation.error && (
          <div role="alert" className="alert alert-error alert-soft mt-2">
            <span className="text-sm">{mutation.error.message}</span>
          </div>
        )}

        <div className="card-actions mt-3">
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <MdAdd className="size-4" />
            )}
            Eintrag speichern
          </button>
        </div>
        </form>
      </div>
    </div>
  );
}
