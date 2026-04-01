"use client";

import { useMemo } from "react";
import {
  ZeitbuchungEntry,
  calcNettoStunden,
} from "@/app/lib/entities/zeitbuchung/zeitbuchungHooks";

interface AbwesenheitRange {
  von: string;
  bis: string;
}

interface Props {
  todayEntry: ZeitbuchungEntry | undefined;
  weekEntries: ZeitbuchungEntry[];
  allEntries: ZeitbuchungEntry[];
  sollProTag: number;
  weeklyWork: number;
  urlaub: AbwesenheitRange[];
  krank: AbwesenheitRange[];
}

function fmtHM(hours: number): string {
  const h = Math.floor(Math.abs(hours));
  const m = Math.round((Math.abs(hours) - h) * 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

function fmtSaldo(hours: number): string {
  const sign = hours < 0 ? "−" : "+";
  return `${sign}${fmtHM(hours)} Stunden`;
}

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

function Ring({ value, max, label, sub, color }: {
  value: number; max: number; label: string; sub: string; color: string;
}) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circ - pct * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 100 100" className="size-24 sm:size-28">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="6" className="stroke-base-200" />
        <circle
          cx="50" cy="50" r={r} fill="none" strokeWidth="6"
          className={color}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text x="50" y="47" textAnchor="middle" className="fill-base-content font-bold" style={{ fontSize: "14px" }}>
          {fmtHM(value)}
        </text>
        <text x="50" y="59" textAnchor="middle" className="fill-base-content/40" style={{ fontSize: "8px" }}>
          {sub}
        </text>
      </svg>
      <span className="text-[11px] font-medium text-base-content/60">{label}</span>
    </div>
  );
}

export default function ArbeitszeitenRinge({
  todayEntry, weekEntries, allEntries, sollProTag, weeklyWork, urlaub, krank,
}: Props) {
  const todayNetto = todayEntry ? calcNettoStunden(todayEntry) : 0;

  let weekNetto = 0;
  for (const e of weekEntries) weekNetto += calcNettoStunden(e);

  // Month hours
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthEntries = useMemo(
    () => allEntries.filter((e) => new Date(e.datum).toISOString().split("T")[0].startsWith(monthKey)),
    [allEntries, monthKey],
  );
  let monthNetto = 0;
  for (const e of monthEntries) monthNetto += calcNettoStunden(e);
  const monthDays = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0)).getUTCDate();
  const monthSoll = weeklyWork * (monthDays / 7);

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

  return (
    <div className="card bg-base-100 border border-base-300 h-full">
      <div className="card-body p-4 sm:p-5 justify-center">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-2">
          Arbeitszeiten
        </h3>
        <div className="flex items-center justify-evenly gap-2">
          <Ring value={todayNetto} max={sollProTag} label="Heute" sub={`/ ${fmtHM(sollProTag)}`} color="stroke-primary" />
          <Ring value={weekNetto} max={weeklyWork || sollProTag} label="Woche" sub={`/ ${fmtHM(weeklyWork)}`} color="stroke-info" />
          <Ring value={monthNetto} max={monthSoll || sollProTag} label="Monat" sub={`/ ${fmtHM(monthSoll)}`} color="stroke-secondary" />
        </div>
        <div className="divider my-1" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-base-content/50">Gesamtsaldo</span>
          <span className={`text-sm font-bold tabular-nums ${totalSaldo >= 0 ? "text-success" : "text-error"}`}>
            {fmtSaldo(totalSaldo)}
          </span>
        </div>
      </div>
    </div>
  );
}
