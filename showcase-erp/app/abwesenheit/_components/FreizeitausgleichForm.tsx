"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MdSend } from "react-icons/md";
import {
  freizeitausgleichSchema,
  type FreizeitausgleichFormData,
  hasOverlap,
} from "@/app/lib/entities/freizeitausgleich/freizeitausgleichValidation";
import DateRangePicker from "@/app/components/DateRangePicker";
import {
  useFreizeitausgleichAntraegeQuery,
  useCreateFreizeitausgleichMutation,
  useSaldoQuery,
} from "@/app/lib/entities/freizeitausgleich/freizeitausgleichHooks";

function fmtHM(hours: number): string {
  const h = Math.floor(Math.abs(hours));
  const m = Math.round((Math.abs(hours) - h) * 60);
  const sign = hours < 0 ? "−" : "+";
  return `${sign}${h}:${String(m).padStart(2, "0")}`;
}

export default function FreizeitausgleichForm() {
  const { data: antraege = [] } = useFreizeitausgleichAntraegeQuery();
  const { data: saldoInfo, isLoading: saldoLoading } = useSaldoQuery();
  const createMutation = useCreateFreizeitausgleichMutation();

  const today = new Date().toISOString().split("T")[0];

  const {
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FreizeitausgleichFormData>({
    resolver: zodResolver(freizeitausgleichSchema),
    defaultValues: { von: today, bis: today },
  });

  const von = watch("von");
  const bis = watch("bis");

  const onSubmit = async (data: FreizeitausgleichFormData) => {
    if (hasOverlap(data.von, data.bis, antraege)) {
      setError("von", {
        message: "Es gibt bereits einen Antrag in diesem Zeitraum.",
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
          Freizeitausgleich beantragen
        </h2>

        {/* Saldo overview */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-base-200 rounded-lg p-2 sm:p-3 text-center">
            <p className="text-[10px] sm:text-xs text-base-content/60">
              Stundensaldo
            </p>
            {saldoLoading ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <p
                className={`text-base sm:text-lg font-bold ${
                  (saldoInfo?.saldo ?? 0) >= 0 ? "text-success" : "text-error"
                }`}
              >
                {fmtHM(saldoInfo?.saldo ?? 0)}h
              </p>
            )}
          </div>
          <div className="bg-success/10 rounded-lg p-2 sm:p-3 text-center">
            <p className="text-[10px] sm:text-xs text-base-content/60">
              Genehmigt
            </p>
            {saldoLoading ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <p className="text-base sm:text-lg font-bold text-success">
                {saldoInfo?.genehmigtStunden ?? 0}h
              </p>
            )}
          </div>
          <div className="bg-warning/10 rounded-lg p-2 sm:p-3 text-center">
            <p className="text-[10px] sm:text-xs text-base-content/60">
              Beantragt
            </p>
            {saldoLoading ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <p className="text-base sm:text-lg font-bold text-warning">
                {saldoInfo?.beantragtStunden ?? 0}h
              </p>
            )}
          </div>
          <div className="bg-info/10 rounded-lg p-2 sm:p-3 text-center">
            <p className="text-[10px] sm:text-xs text-base-content/60">
              Verfügbar
            </p>
            {saldoLoading ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <p className="text-base sm:text-lg font-bold text-info">
                {saldoInfo?.verfuegbareTage ?? 0}{" "}
                {(saldoInfo?.verfuegbareTage ?? 0) === 1 ? "Tag" : "Tage"}
              </p>
            )}
          </div>
        </div>

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
              Freizeitausgleich wurde erfolgreich beantragt.
            </div>
          )}

          <div className="card-actions justify-end">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                isSubmitting ||
                createMutation.isPending ||
                (saldoInfo?.verfuegbareTage ?? 0) < 1
              }
            >
              {createMutation.isPending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <MdSend className="size-4" />
              )}
              Beantragen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
