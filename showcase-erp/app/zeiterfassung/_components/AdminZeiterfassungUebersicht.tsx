"use client";

import { useMemo, useState } from "react";
import { MdPeople, MdSearch } from "react-icons/md";
import {
  ZeitbuchungEntry,
  calcNettoStunden,
  SOLL_STUNDEN_PRO_SCHICHT,
  useAllZeitbuchungenQuery,
} from "@/app/lib/entities/zeitbuchung/zeitbuchungHooks";

interface EmployeeSummary {
  mitarbeiterId: string;
  name: string;
  istStunden: number;
  sollStunden: number;
  diff: number;
  schichten: number;
}

export default function AdminZeiterfassungUebersicht() {
  const { data: entries, isLoading } = useAllZeitbuchungenQuery();
  const [search, setSearch] = useState("");

  const summaries = useMemo(() => {
    if (!entries) return [];

    const grouped = new Map<string, ZeitbuchungEntry[]>();
    for (const e of entries) {
      const list = grouped.get(e.mitarbeiterId) ?? [];
      list.push(e);
      grouped.set(e.mitarbeiterId, list);
    }

    const result: EmployeeSummary[] = [];
    for (const [mitarbeiterId, empEntries] of grouped) {
      let istStunden = 0;
      for (const e of empEntries) {
        istStunden += calcNettoStunden(e);
      }
      const sollStunden = empEntries.length * SOLL_STUNDEN_PRO_SCHICHT;

      result.push({
        mitarbeiterId,
        name: empEntries[0].mitarbeiter.name,
        istStunden,
        sollStunden,
        diff: istStunden - sollStunden,
        schichten: empEntries.length,
      });
    }

    return result.sort((a, b) => a.name.localeCompare(b.name, "de"));
  }, [entries]);

  const filtered = search
    ? summaries.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()),
      )
    : summaries;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <label className="input input-sm input-bordered flex items-center gap-2 flex-1 max-w-xs">
          <MdSearch className="size-4 text-base-content/50" />
          <input
            type="text"
            placeholder="Mitarbeiter suchen…"
            className="grow"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
          <MdPeople className="size-12 mb-4" />
          <p>Keine Einträge vorhanden</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="text-base-content/50">
                  <th>Mitarbeiter</th>
                  <th className="text-right">Schichten</th>
                  <th className="text-right">Ist</th>
                  <th className="text-right">Soll</th>
                  <th className="text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.mitarbeiterId}>
                    <td className="font-medium">{s.name}</td>
                    <td className="text-right">{s.schichten}</td>
                    <td className="text-right">{s.istStunden.toFixed(1)} Std.</td>
                    <td className="text-right">{s.sollStunden.toFixed(1)} Std.</td>
                    <td className="text-right">
                      <span
                        className={`badge badge-sm font-semibold ${s.diff >= 0 ? "badge-success" : "badge-error"}`}
                      >
                        {s.diff >= 0 ? "+" : ""}
                        {s.diff.toFixed(1)} Std.
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden flex flex-col gap-2">
            {filtered.map((s) => (
              <div
                key={s.mitarbeiterId}
                className="card bg-base-100 border border-base-300 shadow-sm"
              >
                <div className="card-body p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-base-content/50">
                        {s.schichten} Schichten
                      </p>
                    </div>
                    <span
                      className={`badge badge-sm ${s.diff >= 0 ? "badge-success" : "badge-error"}`}
                    >
                      {s.diff >= 0 ? "+" : ""}
                      {s.diff.toFixed(1)} Std.
                    </span>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-base-content/60">
                    <span>Ist: {s.istStunden.toFixed(1)}</span>
                    <span>Soll: {s.sollStunden.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
