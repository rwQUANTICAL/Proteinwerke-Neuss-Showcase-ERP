"use client";

import {
  MdAccessTime,
  MdPlayArrow,
  MdPause,
  MdStop,
  MdCoffee,
} from "react-icons/md";
import {
  ZeitbuchungEntry,
  formatTime,
  calcNettoStunden,
  calcPauseMinuten,
  calcSollStundenTag,
} from "@/app/lib/entities/zeitbuchung/zeitbuchungHooks";

interface Props {
  entry: ZeitbuchungEntry | undefined;
  weeklyReq: number;
}

export default function ZeiterfassungTagesKarte({ entry, weeklyReq }: Props) {
  const sollTag = calcSollStundenTag(weeklyReq);

  if (!entry) {
    return (
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body items-center text-center py-8">
          <MdAccessTime className="size-10 text-base-content/30" />
          <p className="text-base-content/50 text-sm">
            Heute noch kein Eintrag vorhanden
          </p>
        </div>
      </div>
    );
  }

  const netto = calcNettoStunden(entry);
  const pause = calcPauseMinuten(entry);
  const diff = netto - sollTag;
  const diffColor = diff >= 0 ? "text-success" : "text-error";

  const steps = [
    {
      icon: MdPlayArrow,
      label: "Arbeitsbeginn",
      time: formatTime(entry.von),
      color: "text-success",
    },
    {
      icon: MdCoffee,
      label: "Pause",
      time: entry.pauseVon
        ? `${formatTime(entry.pauseVon)} – ${formatTime(entry.pauseBis!)}`
        : `${pause} Min.`,
      color: "text-warning",
    },
    {
      icon: MdStop,
      label: "Arbeitsende",
      time: formatTime(entry.bis),
      color: "text-error",
    },
  ];

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body p-4 sm:p-6">
        <h3 className="card-title text-sm font-medium text-base-content/70">
          <MdAccessTime className="size-4" />
          Heute
        </h3>

        {/* Timeline steps */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mt-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center rounded-full bg-base-200 p-2 ${step.color}`}
              >
                <step.icon className="size-4" />
              </div>
              <div>
                <p className="text-xs text-base-content/50">{step.label}</p>
                <p className="font-semibold text-sm">{step.time}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden sm:block w-8 border-t border-base-300" />
              )}
            </div>
          ))}
        </div>

        {/* Summary row */}
        <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-base-300">
          <div>
            <p className="text-xs text-base-content/50">Netto</p>
            <p className="font-bold">{netto.toFixed(1)} Std.</p>
          </div>
          <div>
            <p className="text-xs text-base-content/50">Pause</p>
            <p className="font-bold">{pause} Min.</p>
          </div>
          <div>
            <p className="text-xs text-base-content/50">Differenz</p>
            <p className={`font-bold ${diffColor}`}>
              {diff >= 0 ? "+" : ""}
              {diff.toFixed(1)} Std.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
