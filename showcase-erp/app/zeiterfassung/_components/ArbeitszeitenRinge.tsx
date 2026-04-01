"use client";

import {
  ZeitbuchungEntry,
  calcNettoStunden,
  SOLL_STUNDEN_PRO_SCHICHT,
} from "@/app/lib/entities/zeitbuchung/zeitbuchungHooks";

interface Props {
  todayEntry: ZeitbuchungEntry | undefined;
  weekEntries: ZeitbuchungEntry[];
}

function fmtHM(hours: number): string {
  const h = Math.floor(Math.abs(hours));
  const m = Math.round((Math.abs(hours) - h) * 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

function Ring({
  value,
  max,
  label,
  sub,
  color,
}: {
  value: number;
  max: number;
  label: string;
  sub: string;
  color: string;
}) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circ - pct * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 100 100" className="size-24 sm:size-28">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="6"
          className="stroke-base-200"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="6"
          className={color}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text
          x="50"
          y="47"
          textAnchor="middle"
          className="fill-base-content text-lg font-bold"
          style={{ fontSize: "16px" }}
        >
          {fmtHM(value)}
        </text>
        <text
          x="50"
          y="60"
          textAnchor="middle"
          className="fill-base-content/40"
          style={{ fontSize: "9px" }}
        >
          {sub}
        </text>
      </svg>
      <span className="text-xs font-medium text-base-content/60">{label}</span>
    </div>
  );
}

export default function ArbeitszeitenRinge({ todayEntry, weekEntries }: Props) {
  const todayNetto = todayEntry ? calcNettoStunden(todayEntry) : 0;
  const soll = SOLL_STUNDEN_PRO_SCHICHT;

  let weekNetto = 0;
  for (const e of weekEntries) weekNetto += calcNettoStunden(e);
  const weekSoll = weekEntries.length * soll;

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body p-4 sm:p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-2">
          Arbeitszeiten
        </h3>
        <div className="flex items-center justify-evenly">
          <Ring
            value={todayNetto}
            max={soll}
            label="Heute"
            sub={`/ ${soll}:00`}
            color="stroke-primary"
          />
          <Ring
            value={weekNetto}
            max={weekSoll || soll}
            label="Woche"
            sub={`/ ${fmtHM(weekSoll)}`}
            color="stroke-info"
          />
        </div>
      </div>
    </div>
  );
}
