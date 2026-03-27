"use client";

import { useMitarbeiterQuery } from "@/app/lib/entities/mitarbeiter/mitarbeiterHooks";
import { MdInbox } from "react-icons/md";

const SKILL_LABELS: Record<string, string> = {
  MUEHLE: "M",
  WALZE: "W",
  EXTRAKTION: "E",
  LECITHIN: "L",
};

export default function MitarbeiterTable() {
  const { data: mitarbeiter, isLoading, error } = useMitarbeiterQuery();

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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
