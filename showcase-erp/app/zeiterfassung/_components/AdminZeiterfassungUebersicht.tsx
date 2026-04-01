"use client";

import { useMemo, useState } from "react";
import { MdPeople, MdSearch } from "react-icons/md";
import {
  ZeitbuchungEntry,
  calcNettoStunden,
  getWeekDates,
  calcSollStundenTag,
  useAllZeitbuchungenQuery,
} from "@/app/lib/entities/zeitbuchung/zeitbuchungHooks";

interface Props {
  jahr: number;
  kw: number;
}

interface EmployeeSummary {
  mitarbeiterId: string;
  name: string;
  weeklyReq: number;
  istStunden: number;
  sollStunden: number;
  diff: number;
  eintraegeCount: number;
}

export default function AdminZeiterfassungUebersicht({ jahr, kw }: Props) {
  const weekDates = getWeekDates(jahr, kw);
  const von = weekDates[0];
  const bis = weekDates[weekDates.length - 1];
  const { data: entries, isLoading } = useAllZeitbuchungenQuery(von, bis);
  const [search, setSearch] = useState("");

  const summaries = useMemo(() => {
    if (!entries) return [];

    // Group by employee
    const grouped = new Map<string, ZeitbuchungEntry[]>();
    for (const e of entries) {
      const list = grouped.get(e.mitarbeiterId) ?? [];
      list.push(e);
      grouped.set(e.mitarbeiterId, list);
    }

    const result: EmployeeSummary[] = [];
    for (const [mitarbeiterId, empEntries] of grouped) {
      const first = empEntries[0];
      const weeklyReq = first.mitarbeiter.weeklyWorkRequirement;
      const sollTag = calcSollStundenTag(weeklyReq);

      let istStunden = 0;
      let sollStunden = 0;

      for (const date of weekDates) {
        const isWeekend = new Date(date + "T00:00:00Z").getUTCDay() % 6 === 0;
        if (!isWeekend) sollStunden += sollTag;
      }

      for (const e of empEntries) {
        istStunden += calcNettoStunden(e);
      }

      result.push({
        mitarbeiterId,
        name: first.mitarbeiter.name,
        weeklyReq,
        istStunden,
        sollStunden,
        diff: istStunden - sollStunden,
        eintraegeCount: empEntries.length,
      });
    }

    return result.sort((a, b) => a.name.localeCompare(b.name, "de"));
  }, [entries, weekDates]);

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
          <p>Keine Einträge für diese Woche</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="text-base-content/50">
                  <th>Mitarbeiter</th>
                  <th>Soll/Woche</th>
                  <th>Ist-Stunden</th>
                  <th>Soll-Stunden</th>
                  <th className="text-right">Differenz</th>
                  <th className="text-right">Einträge</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.mitarbeiterId}>
                    <td className="font-medium">{s.name}</td>
                    <td>{s.weeklyReq} Std.</td>
                    <td>{s.istStunden.toFixed(1)} Std.</td>
                    <td>{s.sollStunden.toFixed(1)} Std.</td>
                    <td className="text-right">
                      <span
                        className={`font-semibold ${s.diff >= 0 ? "text-success" : "text-error"}`}
                      >
                        {s.diff >= 0 ? "+" : ""}
                        {s.diff.toFixed(1)} Std.
                      </span>
                    </td>
                    <td className="text-right">{s.eintraegeCount}/5</td>
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
                        Soll: {s.weeklyReq} Std./Woche ·{" "}
                        {s.eintraegeCount}/5 Einträge
                      </p>
                    </div>
                    <span
                      className={`badge badge-sm ${s.diff >= 0 ? "badge-success" : "badge-error"}`}
                    >
                      {s.diff >= 0 ? "+" : ""}
                      {s.diff.toFixed(1)}
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
