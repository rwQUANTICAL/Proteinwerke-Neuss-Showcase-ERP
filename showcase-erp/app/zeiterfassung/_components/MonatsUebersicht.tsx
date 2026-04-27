"use client";

import { useState, useMemo, useEffect } from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import {
  ZeitbuchungEntry,
  calcNettoStunden,
} from "@/app/lib/entities/zeitbuchung/zeitbuchungHooks";

interface AbwesenheitRange {
  von: string;
  bis: string;
}

interface Props {
  allEntries: ZeitbuchungEntry[];
  urlaub: AbwesenheitRange[];
  krank: AbwesenheitRange[];
  sollProTag: number;
  weekDates: string[];
}

type DayType = "over" | "under" | "urlaub" | "krank" | null;

const DAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function getMonthGrid(year: number, month: number) {
  const first = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const startDow = (first.getUTCDay() + 6) % 7;

  const cells: { day: number | null; dateStr: string }[] = [];
  for (let i = 0; i < startDow; i++) {
    const d = new Date(Date.UTC(year, month, 1 - startDow + i));
    cells.push({ day: null, dateStr: d.toISOString().split("T")[0] });
  }
  for (let d = 1; d <= lastDay; d++) {
    const dt = new Date(Date.UTC(year, month, d));
    cells.push({ day: d, dateStr: dt.toISOString().split("T")[0] });
  }
  while (cells.length % 7 !== 0) {
    const d = new Date(
      Date.UTC(year, month + 1, cells.length - startDow - lastDay + 1),
    );
    cells.push({ day: null, dateStr: d.toISOString().split("T")[0] });
  }
  return cells;
}

function buildRangeSet(ranges: AbwesenheitRange[]): Set<string> {
  const set = new Set<string>();
  for (const r of ranges) {
    const start = new Date(r.von);
    const end = new Date(r.bis);
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      set.add(d.toISOString().split("T")[0]);
    }
  }
  return set;
}

const TYPE_CLASSES: Record<string, string> = {
  over: "bg-success text-success-content",
  under: "bg-warning text-warning-content",
  urlaub: "bg-info text-info-content",
  krank: "bg-error/70 text-error-content",
};

export default function MonatsUebersicht({
  allEntries,
  urlaub,
  krank,
  sollProTag,
  weekDates,
}: Props) {
  // Derive month from selected week (Thursday = weekDates[3])
  const refDate = new Date(weekDates[3] + "T00:00:00Z");
  const [year, setYear] = useState(refDate.getUTCFullYear());
  const [month, setMonth] = useState(refDate.getUTCMonth());

  // Sync month when selected week changes
  useEffect(() => {
    const d = new Date(weekDates[3] + "T00:00:00Z");
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth());
  }, [weekDates]);

  const entryMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of allEntries) {
      map.set(
        new Date(e.datum).toISOString().split("T")[0],
        calcNettoStunden(e),
      );
    }
    return map;
  }, [allEntries]);

  const urlaubSet = useMemo(() => buildRangeSet(urlaub), [urlaub]);
  const krankSet = useMemo(() => buildRangeSet(krank), [krank]);

  const cells = useMemo(() => getMonthGrid(year, month), [year, month]);
  const todayStr = new Date().toISOString().split("T")[0];

  const monthName = new Date(Date.UTC(year, month, 1)).toLocaleDateString(
    "de-DE",
    { month: "long", year: "numeric", timeZone: "UTC" },
  );

  const nav = (d: number) => {
    let nm = month + d,
      ny = year;
    if (nm < 0) {
      ny--;
      nm = 11;
    } else if (nm > 11) {
      ny++;
      nm = 0;
    }
    setMonth(nm);
    setYear(ny);
  };

  function getDayType(dateStr: string): DayType {
    if (krankSet.has(dateStr)) return "krank";
    if (urlaubSet.has(dateStr)) return "urlaub";
    const netto = entryMap.get(dateStr);
    if (netto === undefined) return null;
    return netto >= sollProTag ? "over" : "under";
  }

  return (
    <div className="card bg-base-100 border border-base-300 h-full">
      <div className="card-body p-3 sm:p-5 justify-center">
        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
          <h3 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-base-content/50">
            Monatsübersicht
          </h3>
          <div className="flex items-center gap-1">
            <button
              className="btn btn-ghost btn-xs btn-square"
              onClick={() => nav(-1)}
            >
              <MdChevronLeft className="size-3.5" />
            </button>
            <button
              className="btn btn-ghost btn-xs btn-square"
              onClick={() => nav(1)}
            >
              <MdChevronRight className="size-3.5" />
            </button>
          </div>
        </div>

        <p className="text-[10px] sm:text-xs font-medium text-center mb-0.5 sm:mb-1">
          {monthName}
        </p>

        <div className="grid grid-cols-7 gap-px text-center mb-0.5">
          {DAY_LABELS.map((d) => (
            <span
              key={d}
              className="text-[9px] sm:text-[10px] text-base-content/40"
            >
              {d}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {cells.map(({ day, dateStr }, i) => {
            const inMonth = day !== null;
            const type = inMonth ? getDayType(dateStr) : null;
            const isToday = dateStr === todayStr;

            return (
              <div
                key={i}
                className={`
                  flex items-center justify-center rounded-sm text-[10px] sm:text-[11px] leading-6 sm:leading-7 font-medium
                  ${!inMonth ? "text-base-content/15" : type ? TYPE_CLASSES[type] : "text-base-content/40"}
                  ${isToday ? "ring-1 ring-base-content/30" : ""}
                `}
              >
                {day ?? new Date(dateStr).getUTCDate()}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-0.5 mt-1 sm:mt-2 text-[9px] sm:text-[10px] text-base-content/50">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-sm bg-success" /> ≥Soll
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-sm bg-warning" /> &lt;Soll
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-sm bg-info" /> Urlaub
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-sm bg-error/70" /> Krank
          </span>
        </div>
      </div>
    </div>
  );
}
