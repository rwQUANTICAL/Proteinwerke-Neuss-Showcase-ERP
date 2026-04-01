"use client";

import { useMemo } from "react";
import { MdInfoOutline } from "react-icons/md";
import {
  ZeitbuchungEntry,
  calcNettoStunden,
} from "@/app/lib/entities/zeitbuchung/zeitbuchungHooks";

interface AbwesenheitRange {
  von: string;
  bis: string;
}

interface Props {
  weekEntries: ZeitbuchungEntry[];
  allEntries: ZeitbuchungEntry[];
  urlaub: AbwesenheitRange[];
  krank: AbwesenheitRange[];
  weekDates: string[];
  sollProTag: number;
  weeklyWork: number;
}

function fmtHM(hours: number): string {
  const sign = hours < 0 ? "−" : "";
  const abs = Math.abs(hours);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} Stunden`;
}

/** Count how many dates in `dates` are covered by any range in `ranges`. */
function countAbwesenheitDays(
  ranges: AbwesenheitRange[],
  dates: Set<string>,
  exclude: Set<string>,
): number {
  let count = 0;
  for (const r of ranges) {
    const start = new Date(r.von);
    const end = new Date(r.bis);
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const key = d.toISOString().split("T")[0];
      if (dates.has(key) && !exclude.has(key)) count++;
    }
  }
  return count;
}

export default function Zeitkonto({
  weekEntries,
  allEntries,
  urlaub,
  krank,
  weekDates,
  sollProTag,
  weeklyWork,
}: Props) {
  // Week saldo
  const weekWorkedDates = useMemo(
    () => new Set(weekEntries.map((e) => new Date(e.datum).toISOString().split("T")[0])),
    [weekEntries],
  );
  const weekDateSet = useMemo(() => new Set(weekDates), [weekDates]);

  let weekIst = 0;
  for (const e of weekEntries) weekIst += calcNettoStunden(e);
  const weekAbw = countAbwesenheitDays(urlaub, weekDateSet, weekWorkedDates)
    + countAbwesenheitDays(krank, weekDateSet, weekWorkedDates);
  weekIst += weekAbw * sollProTag;
  const weekSaldo = weekIst - weeklyWork;

  // Total saldo
  const allWorkedDates = useMemo(
    () => new Set(allEntries.map((e) => new Date(e.datum).toISOString().split("T")[0])),
    [allEntries],
  );
  const totalCalendarDays = useMemo(() => {
    if (allEntries.length === 0) return 0;
    const dates = allEntries.map((e) => new Date(e.datum).toISOString().split("T")[0]).sort();
    const start = new Date(dates[0]);
    const end = new Date();
    return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  }, [allEntries]);

  const allDatesEver = useMemo(() => {
    const set = new Set<string>();
    if (allEntries.length === 0) return set;
    const dates = allEntries.map((e) => new Date(e.datum).toISOString().split("T")[0]).sort();
    const start = new Date(dates[0]);
    const end = new Date();
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1))
      set.add(d.toISOString().split("T")[0]);
    return set;
  }, [allEntries]);

  let totalIst = 0;
  for (const e of allEntries) totalIst += calcNettoStunden(e);
  const totalAbw = countAbwesenheitDays(urlaub, allDatesEver, allWorkedDates)
    + countAbwesenheitDays(krank, allDatesEver, allWorkedDates);
  totalIst += totalAbw * sollProTag;
  const totalSoll = weeklyWork * (totalCalendarDays / 7);
  const totalSaldo = totalIst - totalSoll;

  // Month saldo (current calendar month)
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthEntries = useMemo(
    () => allEntries.filter((e) => new Date(e.datum).toISOString().split("T")[0].startsWith(monthKey)),
    [allEntries, monthKey],
  );
  const monthWorkedDates = useMemo(
    () => new Set(monthEntries.map((e) => new Date(e.datum).toISOString().split("T")[0])),
    [monthEntries],
  );
  const monthDateSet = useMemo(() => {
    const set = new Set<string>();
    const first = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const last = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0));
    for (let d = new Date(first); d <= last; d.setUTCDate(d.getUTCDate() + 1))
      set.add(d.toISOString().split("T")[0]);
    return set;
  }, [now.getFullYear(), now.getMonth()]);

  const monthCalendarDays = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0)).getUTCDate();
  let monthIst = 0;
  for (const e of monthEntries) monthIst += calcNettoStunden(e);
  const monthAbw = countAbwesenheitDays(urlaub, monthDateSet, monthWorkedDates)
    + countAbwesenheitDays(krank, monthDateSet, monthWorkedDates);
  monthIst += monthAbw * sollProTag;
  const monthSoll = weeklyWork * (monthCalendarDays / 7);
  const monthSaldo = monthIst - monthSoll;

  const rows = [
    { label: "Wochensaldo", value: weekSaldo },
    { label: "Monatssaldo", value: monthSaldo },
    { label: "Gesamtsaldo", value: totalSaldo },
  ];

  return (
    <div className="card bg-base-100 border border-base-300 h-full">
      <div className="card-body p-4 sm:p-5 justify-center">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
            Zeitkonto
          </h3>
          <div
            className="tooltip tooltip-left"
            data-tip={`${allEntries.length} Schichten erfasst`}
          >
            <MdInfoOutline className="size-4 text-base-content/30" />
          </div>
        </div>
        <div className="divide-y divide-base-200">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-3"
            >
              <span className="text-sm text-base-content/60">{row.label}</span>
              <span
                className={`text-sm font-semibold tabular-nums ${
                  row.value >= 0 ? "text-success" : "text-error"
                }`}
              >
                {fmtHM(row.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
