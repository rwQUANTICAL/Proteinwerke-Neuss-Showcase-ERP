"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MdClose } from "react-icons/md";
import { useCreateMitarbeiterMutation } from "@/app/lib/entities/mitarbeiter/mitarbeiterHooks";
import { SKILL_LABELS } from "@/app/lib/entities/schichtplan/schichtplanConstants";
import LoadingLogo from "@/app/components/LoadingLogo";

const SKILLS = ["MUEHLE", "WALZE", "EXTRAKTION", "LECITHIN"] as const;

const createSchema = z.object({
  referenzNummer: z.string().min(1, "Referenznummer ist erforderlich"),
  name: z.string().min(1, "Name ist erforderlich"),
  skills: z.array(z.enum(SKILLS)).min(1, "Mindestens ein Skill"),
  weeklyWorkRequirement: z.coerce.number().positive("Muss positiv sein"),
  urlaubsAnspruch: z.coerce.number().int().positive("Muss positiv sein"),
  email: z.string().email("Ungültige E-Mail"),
});

type CreateValues = z.infer<typeof createSchema>;

interface MitarbeiterCreateModalProps {
  onClose: () => void;
}

export default function MitarbeiterCreateModal({
  onClose,
}: MitarbeiterCreateModalProps) {
  const mutation = useCreateMitarbeiterMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateValues>({
    resolver: zodResolver(createSchema) as never,
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

  function toggleSkill(skill: CreateValues["skills"][number]) {
    const current = skills ?? [];
    const next = current.includes(skill)
      ? current.filter((s) => s !== skill)
      : [...current, skill];
    setValue("skills", next, { shouldValidate: true });
  }

  function onSubmit(data: CreateValues) {
    mutation.mutate(
      {
        referenzNummer: data.referenzNummer,
        name: data.name,
        skills: data.skills,
        weeklyWorkRequirement: data.weeklyWorkRequirement,
        urlaubsAnspruch: data.urlaubsAnspruch,
        account: { email: data.email, name: data.name },
      },
      { onSuccess: onClose },
    );
  }

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Mitarbeiter anlegen</h3>
          <button className="btn btn-ghost btn-sm btn-square" onClick={onClose}>
            <MdClose className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div>
            <label className="label text-sm font-medium">Referenznummer</label>
            <input
              type="text"
              className={`input input-bordered w-full input-sm ${errors.referenzNummer ? "input-error" : ""}`}
              placeholder="z.B. MA-002"
              {...register("referenzNummer")}
            />
            {errors.referenzNummer && (
              <p className="text-error text-xs mt-1">
                {errors.referenzNummer.message}
              </p>
            )}
          </div>

          <div>
            <label className="label text-sm font-medium">Name</label>
            <input
              type="text"
              className={`input input-bordered w-full input-sm ${errors.name ? "input-error" : ""}`}
              placeholder="Vor- und Nachname"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-error text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="label text-sm font-medium">Skills</label>
            <div className="flex flex-wrap gap-1.5">
              {SKILLS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`btn btn-xs ${skills?.includes(s) ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => toggleSkill(s)}
                >
                  {SKILL_LABELS[s] ?? s}
                </button>
              ))}
            </div>
            {errors.skills && (
              <p className="text-error text-xs mt-1">{errors.skills.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-sm font-medium">Wochenstunden</label>
              <input
                type="number"
                step="0.5"
                className={`input input-bordered w-full input-sm ${errors.weeklyWorkRequirement ? "input-error" : ""}`}
                {...register("weeklyWorkRequirement")}
              />
            </div>
            <div>
              <label className="label text-sm font-medium">Urlaubstage</label>
              <input
                type="number"
                className={`input input-bordered w-full input-sm ${errors.urlaubsAnspruch ? "input-error" : ""}`}
                {...register("urlaubsAnspruch")}
              />
            </div>
          </div>

          <div className="divider text-xs">Benutzerkonto</div>

          <div>
            <label className="label text-sm font-medium">E-Mail</label>
            <input
              type="email"
              className={`input input-bordered w-full input-sm ${errors.email ? "input-error" : ""}`}
              placeholder="mitarbeiter@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-error text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <p className="text-xs text-base-content/60">
            Ein sicheres Passwort wird automatisch generiert und per E-Mail an
            den Mitarbeiter gesendet.
          </p>

          {mutation.error && (
            <div role="alert" className="alert alert-error alert-soft text-sm">
              <span>{mutation.error.message}</span>
            </div>
          )}

          <div className="modal-action">
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              onClick={onClose}
            >
              Abbrechen
            </button>
            <button
              className="btn btn-primary btn-sm"
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending && <LoadingLogo size={16} />}
              Anlegen
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>Schließen</button>
      </form>
    </dialog>
  );
}
