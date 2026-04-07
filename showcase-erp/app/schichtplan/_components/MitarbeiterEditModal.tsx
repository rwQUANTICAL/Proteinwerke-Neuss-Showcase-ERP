"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MdClose } from "react-icons/md";
import type { MitarbeiterWithUser } from "@/app/lib/entities/mitarbeiter/mitarbeiterHooks";
import { useUpdateMitarbeiterMutation } from "@/app/lib/entities/mitarbeiter/mitarbeiterHooks";
import { SKILL_LABELS } from "@/app/lib/entities/schichtplan/schichtplanConstants";
import LoadingLogo from "@/app/components/LoadingLogo";

const SKILLS = ["MUEHLE", "WALZE", "EXTRAKTION", "LECITHIN"] as const;

const editSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  skills: z.array(z.enum(SKILLS)).min(1, "Mindestens ein Skill"),
  weeklyWorkRequirement: z.coerce.number().positive("Muss positiv sein"),
  urlaubsAnspruch: z.coerce.number().int().positive("Muss positiv sein"),
});

type EditValues = z.infer<typeof editSchema>;

interface MitarbeiterEditModalProps {
  mitarbeiter: MitarbeiterWithUser;
  onClose: () => void;
}

export default function MitarbeiterEditModal({
  mitarbeiter,
  onClose,
}: MitarbeiterEditModalProps) {
  const updateMutation = useUpdateMitarbeiterMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema) as never,
    defaultValues: {
      name: mitarbeiter.name,
      skills: mitarbeiter.skills as EditValues["skills"],
      weeklyWorkRequirement: mitarbeiter.weeklyWorkRequirement,
      urlaubsAnspruch: mitarbeiter.urlaubsAnspruch,
    },
  });

  const skills = watch("skills");

  function toggleSkill(skill: EditValues["skills"][number]) {
    const current = skills ?? [];
    const next = current.includes(skill)
      ? current.filter((s) => s !== skill)
      : [...current, skill];
    setValue("skills", next, { shouldValidate: true });
  }

  function onSubmit(data: EditValues) {
    updateMutation.mutate({ id: mitarbeiter.id, data }, { onSuccess: onClose });
  }

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Mitarbeiter bearbeiten</h3>
          <button className="btn btn-ghost btn-sm btn-square" onClick={onClose}>
            <MdClose className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div>
            <label className="label text-sm font-medium">Name</label>
            <input
              type="text"
              className={`input input-bordered w-full input-sm ${errors.name ? "input-error" : ""}`}
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

          {updateMutation.error && (
            <div role="alert" className="alert alert-error alert-soft text-sm">
              <span>{updateMutation.error.message}</span>
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
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && <LoadingLogo size={16} />}
              Speichern
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
