"use client";

import { MdClose } from "react-icons/md";
import type { ZuteilungWithRelations } from "@/app/lib/entities/zeitplan/zeitplanHooks";
import { useUpdateZuteilungMutation } from "@/app/lib/entities/zuteilung/zuteilungHooks";
import {
  SCHICHT_TYP_LABELS,
  SCHICHT_TYP_COLORS,
  TEILANLAGE_LABELS,
  TEILANLAGE_TO_SKILL,
  ASSIGNABLE_SCHICHT_TYPEN,
  ALL_TEILANLAGEN,
} from "@/app/lib/entities/schichtplan/schichtplanConstants";

interface EditModalProps {
  zuteilung: ZuteilungWithRelations;
  jahr: number;
  kw: number;
  onClose: () => void;
}

export default function EditModal({
  zuteilung,
  jahr,
  kw,
  onClose,
}: EditModalProps) {
  const updateMutation = useUpdateZuteilungMutation(jahr, kw);

  function handleUpdate(field: "schicht" | "teilanlage", value: string) {
    updateMutation.mutate(
      { id: zuteilung.id, data: { [field]: value } },
      { onSuccess: onClose },
    );
  }

  const currentColors = SCHICHT_TYP_COLORS[zuteilung.schicht];

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Schicht bearbeiten</h3>
          <button className="btn btn-ghost btn-sm btn-square" onClick={onClose}>
            <MdClose className="size-5" />
          </button>
        </div>

        <div
          className={`rounded-lg px-3 py-2 mb-4 text-sm border ${currentColors?.bg} ${currentColors?.border} ${currentColors?.text}`}
        >
          <span className="font-semibold">{zuteilung.mitarbeiter.name}</span>
          {" — "}
          {SCHICHT_TYP_LABELS[zuteilung.schicht]}
          {zuteilung.teilanlage !== "SPRINGER" &&
            `, ${TEILANLAGE_LABELS[zuteilung.teilanlage]}`}
        </div>

        {updateMutation.error && (
          <div
            role="alert"
            className="alert alert-error alert-soft mb-3 text-sm"
          >
            <span>{updateMutation.error.message}</span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div>
            <label className="label text-sm font-medium">
              Schichttyp ändern
            </label>
            <div className="flex flex-wrap gap-1">
              {ASSIGNABLE_SCHICHT_TYPEN.map((s) => {
                const c = SCHICHT_TYP_COLORS[s];
                const isActive = zuteilung.schicht === s;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={isActive || updateMutation.isPending}
                    className={`btn btn-xs border ${c.bg} ${c.text} ${c.border} ${isActive ? "btn-active ring-2 ring-primary/30" : ""}`}
                    onClick={() => handleUpdate("schicht", s)}
                  >
                    {SCHICHT_TYP_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label text-sm font-medium">Anlage ändern</label>
            <div className="flex flex-wrap gap-1">
              {ALL_TEILANLAGEN.filter((t) => {
                const required = TEILANLAGE_TO_SKILL[t];
                return (
                  required === null ||
                  zuteilung.mitarbeiter.skills.includes(required)
                );
              }).map((t) => {
                const isActive = zuteilung.teilanlage === t;
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={isActive || updateMutation.isPending}
                    className={`btn btn-xs ${isActive ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => handleUpdate("teilanlage", t)}
                  >
                    {TEILANLAGE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>Schließen</button>
      </form>
    </dialog>
  );
}
