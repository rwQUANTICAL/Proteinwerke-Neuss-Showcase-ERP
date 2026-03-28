"use client";

import { useState } from "react";
import {
  useMitarbeiterQuery,
  useDeleteMitarbeiterMutation,
} from "@/app/lib/entities/mitarbeiter/mitarbeiterHooks";
import type { MitarbeiterWithUser } from "@/app/lib/entities/mitarbeiter/mitarbeiterHooks";
import MitarbeiterEditModal from "@/app/schichtplan/_components/MitarbeiterEditModal";
import { MdInbox, MdEdit, MdDelete } from "react-icons/md";

const SKILL_LABELS: Record<string, string> = {
  MUEHLE: "M",
  WALZE: "W",
  EXTRAKTION: "E",
  LECITHIN: "L",
};

export default function MitarbeiterTable() {
  const { data: mitarbeiter, isLoading, error } = useMitarbeiterQuery();
  const deleteMutation = useDeleteMitarbeiterMutation();
  const [editTarget, setEditTarget] = useState<MitarbeiterWithUser | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Fehler beim Laden der Mitarbeiter</span>
      </div>
    );
  }

  if (!mitarbeiter?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
        <MdInbox className="size-12 mb-4" />
        <p>Keine Mitarbeiter vorhanden</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>Ref.-Nr.</th>
            <th>Name</th>
            <th>Skills</th>
            <th>Wochenstunden</th>
            <th>Urlaubstage</th>
            <th>Benutzerkonto</th>
            <th className="w-24"></th>
          </tr>
        </thead>
        <tbody>
          {mitarbeiter.map((ma) => (
            <tr key={ma.id}>
              <td className="font-mono">{ma.referenzNummer}</td>
              <td>{ma.name}</td>
              <td>
                <div className="flex flex-wrap gap-1">
                  {ma.skills.map((s) => (
                    <span key={s} className="badge badge-sm badge-outline">
                      {SKILL_LABELS[s] ?? s}
                    </span>
                  ))}
                </div>
              </td>
              <td>{ma.weeklyWorkRequirement}h</td>
              <td>{ma.urlaubsAnspruch}</td>
              <td>
                {ma.user ? (
                  <span className="text-success">{ma.user.email}</span>
                ) : (
                  <span className="text-base-content/40">—</span>
                )}
              </td>
              <td>
                <div className="flex gap-1">
                  <button
                    className="btn btn-ghost btn-xs btn-square"
                    onClick={() => setEditTarget(ma)}
                    aria-label="Bearbeiten"
                  >
                    <MdEdit className="size-4" />
                  </button>
                  <button
                    className="btn btn-ghost btn-xs btn-square text-error"
                    onClick={() => deleteMutation.mutate(ma.id)}
                    disabled={deleteMutation.isPending}
                    aria-label="Löschen"
                  >
                    <MdDelete className="size-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editTarget && (
        <MitarbeiterEditModal
          mitarbeiter={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
