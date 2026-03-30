"use client";

import {
  MdChevronLeft,
  MdChevronRight,
  MdCalendarMonth,
  MdPeople,
  MdFactory,
  MdFilterList,
} from "react-icons/md";
import {
  SCHICHT_TYP_LABELS,
  SCHICHT_TYP_SHORT,
  SCHICHT_TYP_COLORS,
  ALL_SCHICHT_TYPEN,
  FACILITY_FILTER_TYPEN,
  getWeekDates,
  formatDateShort,
} from "@/app/lib/entities/schichtplan/schichtplanConstants";

export type ViewMode = "employee" | "facility";
export type SchichtFilter = string | null;

interface SchichtplanHeaderProps {
  jahr: number;
  kw: number;
  onKwChange: (jahr: number, kw: number) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  schichtFilter: SchichtFilter;
  onSchichtFilterChange: (filter: SchichtFilter) => void;
}

function getMaxKw(year: number): number {
  const dec28 = new Date(Date.UTC(year, 11, 28));
  const dayOfWeek = dec28.getUTCDay() || 7;
  const thursdayDate = new Date(dec28);
  thursdayDate.setUTCDate(dec28.getUTCDate() + 4 - dayOfWeek);
  const yearStart = new Date(Date.UTC(thursdayDate.getUTCFullYear(), 0, 1));
  return Math.ceil(
    ((thursdayDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
}

export default function SchichtplanHeader({
  jahr,
  kw,
  onKwChange,
  viewMode,
  onViewModeChange,
  schichtFilter,
  onSchichtFilterChange,
}: SchichtplanHeaderProps) {
  const dates = getWeekDates(jahr, kw);
  const startStr = formatDateShort(dates[0]);
  const endStr = formatDateShort(dates[6]);

  function goToPrev() {
    if (kw <= 1) {
      const prevMaxKw = getMaxKw(jahr - 1);
      onKwChange(jahr - 1, prevMaxKw);
    } else {
      onKwChange(jahr, kw - 1);
    }
  }

  function goToNext() {
    const maxKw = getMaxKw(jahr);
    if (kw >= maxKw) {
      onKwChange(jahr + 1, 1);
    } else {
      onKwChange(jahr, kw + 1);
    }
  }

  function handleKwInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1 && val <= 53) {
      onKwChange(jahr, val);
    }
  }

  function handleYearInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 2020 && val <= 2100) {
      onKwChange(val, Math.min(kw, getMaxKw(val)));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Top row: Title + View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <MdCalendarMonth className="size-8 text-primary" />
          <h1 className="text-2xl font-bold">Schichtplan</h1>
        </div>

        <div className="join">
          <button
            className={`btn join-item btn-sm ${viewMode === "employee" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => onViewModeChange("employee")}
          >
            <MdPeople className="size-4" />
            Mitarbeiter
          </button>
          <button
            className={`btn join-item btn-sm ${viewMode === "facility" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => onViewModeChange("facility")}
          >
            <MdFactory className="size-4" />
            Anlagen
          </button>
        </div>
      </div>

      {/* Second row: KW Navigation + Shift Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* KW Navigation */}
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost btn-sm btn-square"
            onClick={goToPrev}
            aria-label="Vorherige Woche"
          >
            <MdChevronLeft className="size-5" />
          </button>

          <div className="flex items-center gap-1.5 bg-base-200 rounded-lg px-3 py-1.5">
            <span className="font-bold text-lg">KW</span>
            <input
              type="number"
              className="input input-ghost input-xs w-12 text-center font-bold text-lg p-0"
              value={kw}
              onChange={handleKwInput}
              min={1}
              max={53}
            />
            <span className="text-base-content/40 mx-1">|</span>
            <input
              type="number"
              className="input input-ghost input-xs w-16 text-center p-0"
              value={jahr}
              onChange={handleYearInput}
              min={2020}
              max={2100}
            />
          </div>

          <button
            className="btn btn-ghost btn-sm btn-square"
            onClick={goToNext}
            aria-label="Nächste Woche"
          >
            <MdChevronRight className="size-5" />
          </button>

          <span className="text-sm text-base-content/60 ml-2 hidden sm:inline">
            {startStr} – {endStr} {jahr}
          </span>
        </div>

        {/* Shift Filter — facility view only shows relevant types */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          <MdFilterList className="size-4 text-base-content/50 hidden sm:block" />
          <button
            className={`btn btn-xs ${schichtFilter === null ? "btn-primary" : "btn-ghost"}`}
            onClick={() => onSchichtFilterChange(null)}
          >
            Alle
          </button>
          {(viewMode === "facility"
            ? FACILITY_FILTER_TYPEN
            : ALL_SCHICHT_TYPEN
          ).map((typ) => {
            const colors = SCHICHT_TYP_COLORS[typ];
            const isActive = schichtFilter === typ;
            return (
              <button
                key={typ}
                className={`btn btn-xs ${isActive ? `${colors?.dot ?? ""} text-white border-transparent` : "btn-ghost"}`}
                onClick={() => onSchichtFilterChange(isActive ? null : typ)}
              >
                <span className="sm:hidden">{SCHICHT_TYP_SHORT[typ]}</span>
                <span className="hidden sm:inline">
                  {SCHICHT_TYP_LABELS[typ]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend — hidden on mobile since abbreviations are self-explanatory with color */}
      <div className="hidden sm:flex items-center gap-3 flex-wrap text-xs">
        <span className="text-base-content/50 font-medium">Legende:</span>
        {ALL_SCHICHT_TYPEN.map((typ) => {
          const colors = SCHICHT_TYP_COLORS[typ];
          return (
            <div key={typ} className="flex items-center gap-1">
              <span
                className={`inline-block w-3 h-3 rounded-sm ${colors?.dot ?? "bg-base-300"}`}
              />
              <span className="text-base-content/70">
                {SCHICHT_TYP_LABELS[typ]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
