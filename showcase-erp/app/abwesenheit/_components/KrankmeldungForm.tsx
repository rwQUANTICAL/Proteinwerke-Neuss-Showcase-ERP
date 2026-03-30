"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { MdSend, MdLocalHospital, MdBeachAccess, MdSwapHoriz } from "react-icons/md";
import {
  krankmeldungSchema,
  type KrankmeldungFormData,
  hasOverlap,
} from "@/app/lib/entities/krankmeldung/krankmeldungValidation";
import {
  useCreateKrankmeldungMutation,
  useKrankmeldungenQuery,
} from "@/app/lib/entities/krankmeldung/krankmeldungHooks";

type AbwesenheitTyp = "KRANK" | "URLAUB" | "FREIZEITAUSGLEICH";

const TYPEN = [
  { value: "KRANK" as const, label: "Krankmeldung", icon: MdLocalHospital, color: "btn-error" },
  { value: "URLAUB" as const, label: "Urlaub", icon: MdBeachAccess, color: "btn-success", disabled: true },
  { value: "FREIZEITAUSGLEICH" as const, label: "Freizeitausgleich", icon: MdSwapHoriz, color: "btn-info", disabled: true },
] as const;

export default function KrankmeldungForm() {
  const { data: existing = [] } = useKrankmeldungenQuery();
  const createMutation = useCreateKrankmeldungMutation();
  const [typ, setTyp] = useState<AbwesenheitTyp>("KRANK");

  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<KrankmeldungFormData>({
    resolver: zodResolver(krankmeldungSchema),
    defaultValues: { von: today, bis: today },
  });

  const onSubmit = async (data: KrankmeldungFormData) => {
    if (typ !== "KRANK") return;

    if (hasOverlap(data.von, data.bis, existing)) {
      setError("von", {
        message:
          "Es gibt bereits eine Krankmeldung in diesem Zeitraum.",
      });
      return;
    }

    try {
      await createMutation.mutateAsync(data);
      reset({ von: today, bis: today });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unbekannter Fehler";
      setError("von", { message });
    }
  };

  const activeTyp = TYPEN.find((t) => t.value === typ)!;

  return (
    <div className="card card-border bg-base-100">
      <div className="card-body gap-4">
        <h2 className="card-title text-lg">Neue Abwesenheit melden</h2>

        {/* Type selector */}
        <div className="flex flex-wrap gap-2">
          {TYPEN.map((t) => {
            const isActive = typ === t.value;
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                type="button"
                className={`btn btn-sm ${isActive ? t.color : "btn-ghost"} ${"disabled" in t && t.disabled ? "btn-disabled opacity-50" : ""}`}
                onClick={() => !("disabled" in t && t.disabled) && setTyp(t.value)}
                tabIndex={"disabled" in t && t.disabled ? -1 : undefined}
                aria-disabled={"disabled" in t && t.disabled ? true : undefined}
              >
                <Icon className="size-4" />
                {t.label}
                {"disabled" in t && t.disabled && (
                  <span className="badge badge-xs badge-ghost">Bald</span>
                )}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <fieldset className="fieldset flex-1">
              <legend className="fieldset-legend">Von</legend>
              <input
                type="date"
                className={`input input-bordered w-full ${errors.von ? "input-error" : ""}`}
                {...register("von")}
              />
              {errors.von && (
                <p className="text-error text-sm mt-1">{errors.von.message}</p>
              )}
            </fieldset>
            <fieldset className="fieldset flex-1">
              <legend className="fieldset-legend">Bis</legend>
              <input
                type="date"
                className={`input input-bordered w-full ${errors.bis ? "input-error" : ""}`}
                {...register("bis")}
              />
              {errors.bis && (
                <p className="text-error text-sm mt-1">{errors.bis.message}</p>
              )}
            </fieldset>
          </div>

          {createMutation.isSuccess && (
            <div role="alert" className="alert alert-success alert-soft">
              {activeTyp.label} wurde erfolgreich eingereicht.
            </div>
          )}

          <div className="card-actions justify-end">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || createMutation.isPending || typ !== "KRANK"}
            >
              {createMutation.isPending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <MdSend className="size-4" />
              )}
              {activeTyp.label} einreichen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
