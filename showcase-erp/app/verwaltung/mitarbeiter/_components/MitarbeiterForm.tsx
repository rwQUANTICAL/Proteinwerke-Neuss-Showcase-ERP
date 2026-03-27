"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateMitarbeiterMutation } from "@/app/lib/entities/mitarbeiter/mitarbeiterHooks";

function MuehleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Industrial grinding mill – hopper, body, control panel */}
      {/* Hopper / funnel */}
      <path d="M7 4h10l-2.5 4h-5z" />
      {/* Feed neck */}
      <rect x="9.5" y="8" width="5" height="2" />
      {/* Grinding body */}
      <rect x="7" y="10" width="10" height="8" rx="1" />
      {/* Control panel */}
      <rect x="9" y="12" width="6" height="4" rx="0.5" />
      <circle cx="12" cy="14" r="0.5" fill="currentColor" />
    </svg>
  );
}

function WalzeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Roller – two cylinders with arrows */}
      <rect x="3" y="4" width="18" height="6" rx="3" />
      <rect x="3" y="14" width="18" height="6" rx="3" />
      <path d="M8 10v4M16 10v4" />
      <path d="M12 10l-2 2 2 2" />
      <path d="M12 10l2 2-2 2" />
    </svg>
  );
}

function ExtraktionIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Extraction – flask / distillation */}
      <path d="M9 3h6v5l4 8a2 2 0 0 1-1.8 2.9H6.8A2 2 0 0 1 5 16L9 8z" />
      <path d="M9 3h6" />
      <path d="M8 15h8" />
      <circle cx="10" cy="12" r="0.5" fill="currentColor" />
      <circle cx="14" cy="13" r="0.5" fill="currentColor" />
      <circle cx="12" cy="11" r="0.5" fill="currentColor" />
    </svg>
  );
}

function LecithinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Lecithin – droplet processing */}
      <path d="M12 2C8 7 5 10.5 5 14a7 7 0 0 0 14 0c0-3.5-3-7-7-12z" />
      <path d="M12 18v-4" />
      <path d="M10 16h4" />
    </svg>
  );
}

const SKILLS = [
  { value: "MUEHLE", label: "Mühle", icon: MuehleIcon },
  { value: "WALZE", label: "Walze", icon: WalzeIcon },
  { value: "EXTRAKTION", label: "Extraktion", icon: ExtraktionIcon },
  { value: "LECITHIN", label: "Lecithin", icon: LecithinIcon },
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
            const Icon = skill.icon;
            const active = skills?.includes(skill.value);
            return (
              <button
                key={skill.value}
                type="button"
                className={`btn gap-2 ${
                  active ? "btn-primary" : "btn-outline"
                }`}
                onClick={() => toggleSkill(skill.value)}
              >
                <Icon className="size-5" />
                {skill.label}
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
        {mutation.isPending && (
          <span className="loading loading-spinner loading-sm"></span>
        )}
        Mitarbeiter anlegen
      </button>
    </form>
  );
}
