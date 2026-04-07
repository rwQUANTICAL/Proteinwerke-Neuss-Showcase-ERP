"use client";

import { useCallback, useState } from "react";
import type { VorschlagItem } from "@/app/lib/entities/zuteilung/vorschlagTypes";
import {
  useVorschlagMutation,
  useBulkCreateZuteilungMutation,
} from "@/app/lib/entities/zuteilung/vorschlagHooks";

export function useVorschlagState(jahr: number, kw: number, zeitplanId: string | undefined) {
  const [vorschlaege, setVorschlaege] = useState<VorschlagItem[]>([]);
  const [vorschlagMode, setVorschlagMode] = useState(false);

  const vorschlagMutation = useVorschlagMutation(jahr, kw);
  const bulkMutation = useBulkCreateZuteilungMutation(jahr, kw);

  const generate = useCallback(() => {
    vorschlagMutation.mutate(undefined, {
      onSuccess: (data) => {
        setVorschlaege(data.vorschlaege);
        setVorschlagMode(true);
      },
    });
  }, [vorschlagMutation]);

  const cancel = useCallback(() => {
    setVorschlaege([]);
    setVorschlagMode(false);
  }, []);

  const reject = useCallback((mitarbeiterId: string, datum: string) => {
    setVorschlaege((prev) =>
      prev.filter((v) => !(v.mitarbeiterId === mitarbeiterId && v.datum === datum))
    );
  }, []);

  const acceptAll = useCallback(() => {
    if (!zeitplanId || vorschlaege.length === 0) return;
    bulkMutation.mutate(
      {
        zeitplanId,
        zuteilungen: vorschlaege.map((v) => ({
          mitarbeiterId: v.mitarbeiterId,
          teilanlage: v.teilanlage,
          datum: v.datum,
          schicht: v.schicht,
        })),
      },
      { onSuccess: () => cancel() }
    );
  }, [zeitplanId, vorschlaege, bulkMutation, cancel]);

  return {
    vorschlaege,
    vorschlagMode,
    generate,
    cancel,
    reject,
    acceptAll,
    isGenerating: vorschlagMutation.isPending,
    isSaving: bulkMutation.isPending,
  };
}
