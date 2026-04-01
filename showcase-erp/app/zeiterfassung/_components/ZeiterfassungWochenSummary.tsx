"use client";

import { MdTrendingUp, MdTrendingDown, MdAccessTime } from "react-icons/md";
import {
  ZeitbuchungEntry,
  calcNettoStunden,
  getWeekDates,
  calcSollStundenTag,
} from "@/app/lib/entities/zeitbuchung/zeitbuchungHooks";

interface Props {
  entries: ZeitbuchungEntry[];
  jahr: number;
  kw: number;
  weeklyReq: number;
}

export default function ZeiterfassungWochenSummary({
  entries,
  jahr,
  kw,
  weeklyReq,
}: Props) {
  const weekDates = getWeekDates(jahr, kw);
  const sollTag = calcSollStundenTag(weeklyReq);

  const entryByDate = new Map<string, ZeitbuchungEntry>();
  for (const e of entries) {
    const key = new Date(e.datum).toISOString().split("T")[0];
    entryByDate.set(key, e);
  }

  let istGesamt = 0;
  let sollGesamt = 0;
  let eintraegeCount = 0;

  for (const date of weekDates) {
    const entry = entryByDate.get(date);
    const isWeekend = new Date(date + "T00:00:00Z").getUTCDay() % 6 === 0;
    if (!isWeekend) sollGesamt += sollTag;
    if (entry) {
      istGesamt += calcNettoStunden(entry);
      eintraegeCount++;
    }
  }

  const diff = istGesamt - sollGesamt;
  const isPositive = diff >= 0;

  const stats = [
    {
      label: "Ist-Stunden",
      value: `${istGesamt.toFixed(1)} Std.`,
      icon: MdAccessTime,
      accent: "text-primary",
    },
    {
      label: "Soll-Stunden",
      value: `${sollGesamt.toFixed(1)} Std.`,
      icon: MdAccessTime,
      accent: "text-base-content/70",
    },
    {
      label: isPositive ? "Überstunden" : "Defizit",
      value: `${isPositive ? "+" : ""}${diff.toFixed(1)} Std.`,
      icon: isPositive ? MdTrendingUp : MdTrendingDown,
      accent: isPositive ? "text-success" : "text-error",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="card bg-base-100 border border-base-300 shadow-sm"
        >
          <div className="card-body p-4">
            <div className="flex items-center gap-2">
              <stat.icon className={`size-5 ${stat.accent}`} />
              <span className="text-xs text-base-content/50 uppercase tracking-wide">
                {stat.label}
              </span>
            </div>
            <p className={`text-2xl font-bold mt-1 ${stat.accent}`}>
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
