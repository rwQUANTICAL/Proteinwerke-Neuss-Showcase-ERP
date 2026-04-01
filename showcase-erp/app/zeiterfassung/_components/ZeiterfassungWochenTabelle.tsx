"use client";

import {
  ZeitbuchungEntry,
  formatTime,
  formatDateDE,
  getWeekdayShort,
  calcNettoStunden,
  calcPauseMinuten,
  getWeekDates,
} from "@/app/lib/entities/zeitbuchung/zeitbuchungHooks";

interface Props {
  entries: ZeitbuchungEntry[];
  jahr: number;
  kw: number;
  sollProTag: number;
}

export default function ZeiterfassungWochenTabelle({
  entries,
  jahr,
  kw,
  sollProTag,
}: Props) {
  const weekDates = getWeekDates(jahr, kw);

  const byDate = new Map<string, ZeitbuchungEntry>();
  for (const e of entries) {
    byDate.set(new Date(e.datum).toISOString().split("T")[0], e);
  }

  const rows = weekDates.map((date) => {
    const entry = byDate.get(date);
    return {
      date,
      entry,
      netto: entry ? calcNettoStunden(entry) : 0,
      pause: entry ? calcPauseMinuten(entry) : 0,
      diff: entry ? calcNettoStunden(entry) - sollProTag : 0,
    };
  });

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body p-0">
        {/* Desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-base-content/40">
                <th className="font-medium">Tag</th>
                <th className="font-medium">Von</th>
                <th className="font-medium">Bis</th>
                <th className="font-medium">Pause</th>
                <th className="font-medium text-right">Netto</th>
                <th className="font-medium text-right">+/−</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ date, entry, netto, pause, diff }) => (
                <tr key={date} className={!entry ? "opacity-30" : ""}>
                  <td>
                    <span className="font-medium">{getWeekdayShort(date)}</span>
                    <span className="text-base-content/40 ml-1.5 text-xs">
                      {formatDateDE(date)}
                    </span>
                  </td>
                  <td>{entry ? formatTime(entry.von) : "–"}</td>
                  <td>{entry ? formatTime(entry.bis) : "–"}</td>
                  <td>{entry ? `${pause} min` : "–"}</td>
                  <td className="text-right font-medium">
                    {entry ? `${netto.toFixed(1)}h` : "–"}
                  </td>
                  <td className="text-right">
                    {entry ? (
                      <span
                        className={`text-xs font-semibold ${diff >= 0 ? "text-success" : "text-error"}`}
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

        {/* Mobile */}
        <div className="sm:hidden divide-y divide-base-200">
          {rows.map(({ date, entry, netto, diff }) => (
            <div
              key={date}
              className={`flex items-center justify-between px-4 py-2.5 ${!entry ? "opacity-30" : ""}`}
            >
              <div>
                <p className="text-sm font-medium">
                  {getWeekdayShort(date)}{" "}
                  <span className="text-base-content/40 font-normal text-xs">
                    {formatDateDE(date)}
                  </span>
                </p>
                {entry && (
                  <p className="text-xs text-base-content/50">
                    {formatTime(entry.von)}–{formatTime(entry.bis)}
                  </p>
                )}
              </div>
              {entry ? (
                <div className="text-right">
                  <p className="text-sm font-medium">{netto.toFixed(1)}h</p>
                  <span
                    className={`text-xs ${diff >= 0 ? "text-success" : "text-error"}`}
                  >
                    {diff >= 0 ? "+" : ""}
                    {diff.toFixed(1)}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-base-content/30">Frei</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
