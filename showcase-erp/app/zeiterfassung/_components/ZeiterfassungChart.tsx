"use client";

import { useMemo, useEffect, useState } from "react";
import { MdBarChart } from "react-icons/md";
import { ResponsiveBar } from "@nivo/bar";
import {
  ZeitbuchungEntry,
  calcNettoStunden,
  getISOWeekData,
  getWeekDates,
  calcSollStundenTag,
} from "@/app/lib/entities/zeitbuchung/zeitbuchungHooks";

interface Props {
  entries: ZeitbuchungEntry[];
  weeklyReq: number;
  currentKw: number;
  currentJahr: number;
}

function useThemeColors() {
  const [colors, setColors] = useState({
    success: "#22c55e",
    error: "#ef4444",
    baseContent: "#1f2937",
    base200: "#e5e7eb",
  });

  useEffect(() => {
    const el = document.documentElement;
    const style = getComputedStyle(el);
    const readColor = (name: string, fallback: string) => {
      const raw = style.getPropertyValue(name).trim();
      return raw || fallback;
    };
    setColors({
      success: readColor("--color-success", "#22c55e"),
      error: readColor("--color-error", "#ef4444"),
      baseContent: readColor("--color-base-content", "#1f2937"),
      base200: readColor("--color-base-200", "#e5e7eb"),
    });
  }, []);

  return colors;
}

export default function ZeiterfassungChart({
  entries,
  weeklyReq,
  currentKw,
  currentJahr,
}: Props) {
  const themeColors = useThemeColors();

  const chartData = useMemo(() => {
    // Build last 8 weeks going backwards from current week
    const weeks: { jahr: number; kw: number }[] = [];
    let j = currentJahr;
    let w = currentKw;
    for (let i = 0; i < 8; i++) {
      weeks.unshift({ jahr: j, kw: w });
      w--;
      if (w < 1) {
        j--;
        // Approximate: last week of previous year
        const dec28 = new Date(Date.UTC(j, 11, 28));
        const dayOfWeek = dec28.getUTCDay() || 7;
        dec28.setUTCDate(dec28.getUTCDate() + 4 - dayOfWeek);
        const yearStart = new Date(Date.UTC(dec28.getUTCFullYear(), 0, 1));
        w = Math.ceil(
          ((dec28.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
        );
      }
    }

    // Index entries by date
    const entryByDate = new Map<string, ZeitbuchungEntry>();
    for (const e of entries) {
      const key = new Date(e.datum).toISOString().split("T")[0];
      entryByDate.set(key, e);
    }

    const sollTag = calcSollStundenTag(weeklyReq);

    return weeks.map(({ jahr, kw }) => {
      const dates = getWeekDates(jahr, kw);
      let ist = 0;
      let soll = 0;
      for (const date of dates) {
        const isWeekend = new Date(date + "T00:00:00Z").getUTCDay() % 6 === 0;
        if (!isWeekend) soll += sollTag;
        const entry = entryByDate.get(date);
        if (entry) ist += calcNettoStunden(entry);
      }
      const diff = +(ist - soll).toFixed(1);
      return {
        week: `KW ${kw}`,
        overtime: diff >= 0 ? diff : 0,
        deficit: diff < 0 ? diff : 0,
      };
    });
  }, [entries, weeklyReq, currentKw, currentJahr]);

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-2">
          <MdBarChart className="size-4 text-base-content/50" />
          <h3 className="text-sm font-medium text-base-content/70">
            Überstunden · Letzte 8 Wochen
          </h3>
        </div>
        <div className="h-56 sm:h-64">
          <ResponsiveBar
            data={chartData}
            keys={["overtime", "deficit"]}
            indexBy="week"
            margin={{ top: 10, right: 10, bottom: 30, left: 40 }}
            padding={0.3}
            colors={({ id }) =>
              id === "overtime" ? themeColors.success : themeColors.error
            }
            borderRadius={4}
            axisBottom={{
              tickSize: 0,
              tickPadding: 8,
            }}
            axisLeft={{
              tickSize: 0,
              tickPadding: 8,
              format: (v: number) => `${v}h`,
            }}
            gridYValues={5}
            enableLabel={false}
            theme={{
              text: { fill: themeColors.baseContent },
              axis: {
                ticks: { text: { fill: themeColors.baseContent, fontSize: 11 } },
              },
              grid: { line: { stroke: themeColors.base200 } },
            }}
            tooltip={({ id, value, indexValue }) => (
              <div className="bg-base-100 border border-base-300 rounded-lg px-3 py-2 shadow-lg text-sm">
                <strong>{indexValue}</strong>:{" "}
                <span
                  className={
                    id === "overtime" ? "text-success" : "text-error"
                  }
                >
                  {(value as number) >= 0 ? "+" : ""}
                  {value} Std.
                </span>
              </div>
            )}
            role="img"
            ariaLabel="Überstunden-Diagramm der letzten 8 Wochen"
          />
        </div>
      </div>
    </div>
  );
}
