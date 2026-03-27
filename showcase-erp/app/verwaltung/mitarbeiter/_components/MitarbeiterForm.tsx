"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateMitarbeiterMutation } from "@/app/lib/entities/mitarbeiter/mitarbeiterHooks";

const SKILLS = [
  { value: "MUEHLE", label: "Mühle" },
  { value: "WALZE", label: "Walze" },
  { value: "EXTRAKTION", label: "Extraktion" },
  { value: "LECITHIN", label: "Lecithin" },
] as const;

const formSchema = z.object({
  referenzNummer: z.string().min(1, "Referenznummer ist erforderlich"),
  name: z.string().min(1, "Name ist erforderlich"),
  skills: z
    .array(z.enum(["MUEHLE", "WALZE", "EXTRAKTION", "LECITHIN"]))
    .min(1, "Mindestens ein Skill auswählen"),
  weeklyWorkRequirement: z.coerce.number().positive("Muss positiv sein"),
  urlaubsAnspruch: z.coerce.number().int().positive("Muss positiv sein"),
  email: z.string().email("Ungültige E-Mail"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
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
      password: "",
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
        password: data.password,
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
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Referenznummer</legend>
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
      </fieldset>

      {/* Name */}
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Name</legend>
        <input
          type="text"
          className={`input input-bordered w-full ${errors.name ? "input-error" : ""}`}
          placeholder="Vor- und Nachname"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-error text-sm mt-1">{errors.name.message}</p>
        )}
      </fieldset>

      {/* Skills */}
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Skills</legend>
        <div className="flex flex-wrap gap-2">
          {SKILLS.map((skill) => (
            <button
              key={skill.value}
              type="button"
              className={`btn btn-sm ${
                skills?.includes(skill.value) ? "btn-primary" : "btn-outline"
              }`}
              onClick={() => toggleSkill(skill.value)}
            >
              {skill.label}
            </button>
          ))}
        </div>
        {errors.skills && (
          <p className="text-error text-sm mt-1">{errors.skills.message}</p>
        )}
      </fieldset>

      {/* Hours & Vacation */}
      <div className="grid grid-cols-2 gap-4">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Wochenstunden</legend>
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
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Urlaubstage</legend>
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
        </fieldset>
      </div>

      {/* Account */}
      <div className="divider">Benutzerkonto</div>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">E-Mail</legend>
        <input
          type="email"
          className={`input input-bordered w-full ${errors.email ? "input-error" : ""}`}
          placeholder="mitarbeiter@example.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-error text-sm mt-1">{errors.email.message}</p>
        )}
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Passwort</legend>
        <input
          type="password"
          className={`input input-bordered w-full ${errors.password ? "input-error" : ""}`}
          placeholder="Min. 8 Zeichen"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-error text-sm mt-1">{errors.password.message}</p>
        )}
      </fieldset>

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
        {mutation.isPending && (
          <span className="loading loading-spinner loading-sm"></span>
        )}
        Mitarbeiter anlegen
      </button>
    </form>
  );
}
