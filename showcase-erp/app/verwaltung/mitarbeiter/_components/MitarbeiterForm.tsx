"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateMitarbeiterMutation } from "@/app/lib/entities/mitarbeiter/mitarbeiterHooks";
import { SKILL_LABELS } from "@/app/lib/entities/schichtplan/schichtplanConstants";
import LoadingLogo from "@/app/components/LoadingLogo";

const SKILLS = ["MUEHLE", "WALZE", "EXTRAKTION", "LECITHIN"] as const;

const formSchema = z.object({
  referenzNummer: z.string().min(1, "Referenznummer ist erforderlich"),
  name: z.string().min(1, "Name ist erforderlich"),
  skills: z
    .array(z.enum(["MUEHLE", "WALZE", "EXTRAKTION", "LECITHIN"]))
    .min(1, "Mindestens ein Skill auswählen"),
  weeklyWorkRequirement: z.coerce.number().positive("Muss positiv sein"),
  urlaubsAnspruch: z.coerce.number().int().positive("Muss positiv sein"),
  email: z.string().email("Ungültige E-Mail"),
});

type FormValues = z.infer<typeof formSchema>;

export default function MitarbeiterForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const mutation = useCreateMitarbeiterMutation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as never,
    defaultValues: {
      referenzNummer: "",
      name: "",
      skills: [],
      weeklyWorkRequirement: 42,
      urlaubsAnspruch: 30,
      email: "",
    },
  });

  const skills = watch("skills");

  function toggleSkill(skill: FormValues["skills"][number]) {
    const current = skills ?? [];
    const next = current.includes(skill)
      ? current.filter((s) => s !== skill)
      : [...current, skill];
    setValue("skills", next, { shouldValidate: true });
  }

  async function onSubmit(data: FormValues) {
    const payload = {
      referenzNummer: data.referenzNummer,
      name: data.name,
      skills: data.skills,
      weeklyWorkRequirement: data.weeklyWorkRequirement,
      urlaubsAnspruch: data.urlaubsAnspruch,
      account: {
        email: data.email,
        name: data.name,
      },
    };

    mutation.mutate(payload, {
      onSuccess: () => {
        reset();
        onSuccess?.();
      },
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Referenznummer */}
      <div>
        <label className="label">Referenznummer</label>
        <input
          type="text"
          className={`input input-bordered w-full ${errors.referenzNummer ? "input-error" : ""}`}
          placeholder="z.B. MA-002"
          {...register("referenzNummer")}
        />
        {errors.referenzNummer && (
          <p className="text-error text-sm mt-1">
            {errors.referenzNummer.message}
          </p>
        )}
      </div>

      {/* Name */}
      <div>
        <label className="label">Name</label>
        <input
          type="text"
          className={`input input-bordered w-full ${errors.name ? "input-error" : ""}`}
          placeholder="Vor- und Nachname"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-error text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Skills */}
      <div>
        <label className="label">Skills</label>
        <div className="flex flex-wrap gap-3">
          {SKILLS.map((skill) => {
            const active = skills?.includes(skill);
            return (
              <button
                key={skill}
                type="button"
                className={`btn ${active ? "btn-primary" : "btn-outline"}`}
                onClick={() => toggleSkill(skill)}
              >
                {SKILL_LABELS[skill] ?? skill}
              </button>
            );
          })}
        </div>
        {errors.skills && (
          <p className="text-error text-sm mt-1">{errors.skills.message}</p>
        )}
      </div>

      {/* Hours & Vacation */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Wochenstunden</label>
          <input
            type="number"
            step="0.5"
            className={`input input-bordered w-full ${errors.weeklyWorkRequirement ? "input-error" : ""}`}
            {...register("weeklyWorkRequirement")}
          />
          {errors.weeklyWorkRequirement && (
            <p className="text-error text-sm mt-1">
              {errors.weeklyWorkRequirement.message}
            </p>
          )}
        </div>
        <div>
          <label className="label">Urlaubstage</label>
          <input
            type="number"
            className={`input input-bordered w-full ${errors.urlaubsAnspruch ? "input-error" : ""}`}
            {...register("urlaubsAnspruch")}
          />
          {errors.urlaubsAnspruch && (
            <p className="text-error text-sm mt-1">
              {errors.urlaubsAnspruch.message}
            </p>
          )}
        </div>
      </div>

      {/* Account */}
      <div className="divider">Benutzerkonto</div>

      <div>
        <label className="label">E-Mail</label>
        <input
          type="email"
          className={`input input-bordered w-full ${errors.email ? "input-error" : ""}`}
          placeholder="mitarbeiter@example.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-error text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <p className="text-sm text-base-content/60">
        Ein sicheres Passwort wird automatisch generiert und per E-Mail an den
        Mitarbeiter gesendet.
      </p>

      {/* Mutation error */}
      {mutation.error && (
        <div className="alert alert-error">
          <span>{mutation.error.message}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        className="btn btn-primary"
        disabled={mutation.isPending}
      >
        {mutation.isPending && <LoadingLogo size={20} />}
        Mitarbeiter anlegen
      </button>
    </form>
  );
}
