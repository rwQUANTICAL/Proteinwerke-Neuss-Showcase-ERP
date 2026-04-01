"use client";

import { MdCalendarToday } from "react-icons/md";
import {
  ZeitbuchungEntry,
  formatTime,
  formatDateDE,
  getWeekdayShort,
  calcNettoStunden,
  calcPauseMinuten,
  calcSollStundenTag,
  getWeekDates,
} from "@/app/lib/entities/zeitbuchung/zeitbuchungHooks";

interface Props {
  entries: ZeitbuchungEntry[];
  jahr: number;
  kw: number;
  weeklyReq: number;
}

export default function ZeiterfassungWochenTabelle({
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

  const rows = weekDates.map((date) => {
    const entry = entryByDate.get(date);
    const netto = entry ? calcNettoStunden(entry) : 0;
    const pause = entry ? calcPauseMinuten(entry) : 0;
    const isWeekend = new Date(date + "T00:00:00Z").getUTCDay() % 6 === 0;
    const soll = isWeekend ? 0 : sollTag;
    const diff = entry ? netto - soll : isWeekend ? 0 : -soll;
    return { date, entry, netto, pause, soll, diff, isWeekend };
  });

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body p-0">
        <div className="flex items-center gap-2 px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
          <MdCalendarToday className="size-4 text-base-content/50" />
          <h3 className="text-sm font-medium text-base-content/70">
            KW {kw} · {jahr}
          </h3>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr className="text-base-content/50">
                <th>Tag</th>
                <th>Datum</th>
                <th>Von</th>
                <th>Bis</th>
                <th>Pause</th>
                <th>Netto</th>
                <th className="text-right">+/−</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ date, entry, netto, pause, diff, isWeekend }) => (
                <tr
                  key={date}
                  className={isWeekend ? "text-base-content/30" : ""}
                >
                  <td className="font-medium">{getWeekdayShort(date)}</td>
                  <td>{formatDateDE(date)}</td>
                  <td>{entry ? formatTime(entry.von) : "–"}</td>
                  <td>{entry ? formatTime(entry.bis) : "–"}</td>
                  <td>{entry ? `${pause} Min.` : "–"}</td>
                  <td>{entry ? `${netto.toFixed(1)} Std.` : "–"}</td>
                  <td className="text-right">
                    {!isWeekend || entry ? (
                      <span
                        className={`font-semibold ${diff >= 0 ? "text-success" : "text-error"}`}
                      >
                        {diff >= 0 ? "+" : ""}
                        {diff.toFixed(1)}
                      </span>
                    ) : (
                      "–"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden flex flex-col gap-2 px-4 pb-4">
          {rows.map(({ date, entry, netto, pause, diff, isWeekend }) => (
            <div
              key={date}
              className={`flex items-center justify-between rounded-lg bg-base-200/50 px-3 py-2 ${
                isWeekend ? "opacity-40" : ""
              }`}
            >
              <div>
                <p className="font-medium text-sm">
                  {getWeekdayShort(date)}{" "}
                  <span className="text-base-content/50 font-normal">
                    {formatDateDE(date)}
                  </span>
                </p>
                {entry ? (
                  <p className="text-xs text-base-content/60">
                    {formatTime(entry.von)} – {formatTime(entry.bis)} · Pause{" "}
                    {pause} Min. · {netto.toFixed(1)} Std.
                  </p>
                ) : (
                  <p className="text-xs text-base-content/40">Kein Eintrag</p>
                )}
              </div>
              {!isWeekend || entry ? (
                <span
                  className={`badge badge-sm ${diff >= 0 ? "badge-success" : "badge-error"}`}
                >
                  {diff >= 0 ? "+" : ""}
                  {diff.toFixed(1)}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
