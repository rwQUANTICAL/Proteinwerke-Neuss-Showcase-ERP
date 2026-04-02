"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MdSend } from "react-icons/md";
import {
  krankmeldungSchema,
  type KrankmeldungFormData,
  hasOverlap,
} from "@/app/lib/entities/krankmeldung/krankmeldungValidation";
import {
  useCreateKrankmeldungMutation,
  useKrankmeldungenQuery,
} from "@/app/lib/entities/krankmeldung/krankmeldungHooks";
import DateRangePicker from "@/app/components/DateRangePicker";

export default function KrankmeldungForm() {
  const { data: existing = [] } = useKrankmeldungenQuery();
  const createMutation = useCreateKrankmeldungMutation();

  const today = new Date().toISOString().split("T")[0];

  const {
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<KrankmeldungFormData>({
    resolver: zodResolver(krankmeldungSchema),
    defaultValues: { von: today, bis: today },
  });

  const von = watch("von");
  const bis = watch("bis");

  const onSubmit = async (data: KrankmeldungFormData) => {
    if (hasOverlap(data.von, data.bis, existing)) {
      setError("von", {
        message: "Es gibt bereits eine Krankmeldung in diesem Zeitraum.",
      });
      return;
    }

    try {
      await createMutation.mutateAsync(data);
      reset({ von: today, bis: today });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler";
      setError("von", { message });
    }
  };

  return (
    <div className="card card-border bg-base-100">
      <div className="card-body p-4 sm:p-6 gap-3 sm:gap-4">
        <h2 className="card-title text-base sm:text-lg">
          Krankmeldung einreichen
        </h2>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3 sm:gap-4"
        >
          <DateRangePicker
            von={von}
            bis={bis}
            onChange={(v, b) => {
              setValue("von", v);
              setValue("bis", b);
            }}
            errorVon={errors.von?.message}
            errorBis={errors.bis?.message}
          />

          {createMutation.isSuccess && (
            <div role="alert" className="alert alert-success alert-soft">
              Krankmeldung wurde erfolgreich eingereicht.
            </div>
          )}

          <div className="card-actions justify-end">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <MdSend className="size-4" />
              )}
              Krankmeldung einreichen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
