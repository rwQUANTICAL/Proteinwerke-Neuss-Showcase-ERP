"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MdSend } from "react-icons/md";
import { authClient } from "@/app/lib/auth-client";
import { useMitarbeiterQuery } from "@/app/lib/entities/mitarbeiter/mitarbeiterHooks";
import {
  urlaubsantragSchema,
  type UrlaubsantragFormData,
  hasOverlap,
} from "@/app/lib/entities/urlaubsantrag/urlaubsantragValidation";
import {
  useUrlaubsantraegeQuery,
  useCreateUrlaubsantragMutation,
  useUrlaubsKonto,
} from "@/app/lib/entities/urlaubsantrag/urlaubsantragHooks";
import DateRangePicker from "@/app/components/DateRangePicker";

export default function UrlaubsantragForm() {
  const { data: session } = authClient.useSession();
  const { data: mitarbeiterList } = useMitarbeiterQuery();
  const { data: antraege = [] } = useUrlaubsantraegeQuery();
  const createMutation = useCreateUrlaubsantragMutation();

  const mitarbeiter = mitarbeiterList?.find(
    (m) => m.userId === session?.user?.id,
  );
  const konto = useUrlaubsKonto(mitarbeiter?.urlaubsAnspruch ?? 0, antraege);

  const today = new Date().toISOString().split("T")[0];

  const {
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UrlaubsantragFormData>({
    resolver: zodResolver(urlaubsantragSchema),
    defaultValues: { von: today, bis: today },
  });

  const von = watch("von");
  const bis = watch("bis");

  const onSubmit = async (data: UrlaubsantragFormData) => {
    if (hasOverlap(data.von, data.bis, antraege)) {
      setError("von", {
        message: "Es gibt bereits einen Urlaubsantrag in diesem Zeitraum.",
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

  if (!mitarbeiter) return null;

  return (
    <div className="card card-border bg-base-100">
      <div className="card-body p-4 sm:p-6 gap-3 sm:gap-4">
        <h2 className="card-title text-base sm:text-lg">Urlaub beantragen</h2>

        {/* Balance overview */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
          <div className="bg-base-200 rounded-lg px-1.5 py-1 sm:p-3 text-center">
            <p className="text-[10px] sm:text-xs text-base-content/60">
              Anspruch
            </p>
            <p className="text-sm sm:text-lg font-bold">{konto.anspruch}</p>
          </div>
          <div className="bg-success/10 rounded-lg px-1.5 py-1 sm:p-3 text-center">
            <p className="text-[10px] sm:text-xs text-base-content/60">
              Genehmigt
            </p>
            <p className="text-sm sm:text-lg font-bold text-success">
              {konto.genehmigt}
            </p>
          </div>
          <div className="bg-warning/10 rounded-lg px-1.5 py-1 sm:p-3 text-center">
            <p className="text-[10px] sm:text-xs text-base-content/60">
              Beantragt
            </p>
            <p className="text-sm sm:text-lg font-bold text-warning">
              {konto.beantragt}
            </p>
          </div>
          <div className="bg-info/10 rounded-lg px-1.5 py-1 sm:p-3 text-center">
            <p className="text-[10px] sm:text-xs text-base-content/60">
              Verfügbar
            </p>
            <p className="text-sm sm:text-lg font-bold text-info">
              {konto.verfuegbar}
            </p>
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
              Urlaubsantrag wurde erfolgreich eingereicht.
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
              Beantragen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
