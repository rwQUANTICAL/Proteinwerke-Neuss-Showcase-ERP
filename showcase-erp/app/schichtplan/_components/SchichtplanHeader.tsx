"use client";

import {
  MdChevronLeft,
  MdChevronRight,
  MdCalendarMonth,
  MdPeople,
  MdFactory,
  MdSearch,
  MdClose,
  MdDownload,
  MdAutoAwesome,
} from "react-icons/md";
import { useState } from "react";
import VorschlagToolbar from "./VorschlagToolbar";
import {
  SCHICHT_TYP_LABELS,
  SCHICHT_TYP_COLORS,
  ALL_SCHICHT_TYPEN,
  FACILITY_FILTER_TYPEN,
  getWeekDates,
  formatDateShort,
} from "@/app/lib/entities/schichtplan/schichtplanConstants";

export type ViewMode = "employee" | "facility";
export type SchichtFilter = string[];

interface SchichtplanHeaderProps {
  jahr: number;
  kw: number;
  onKwChange: (jahr: number, kw: number) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  schichtFilter: SchichtFilter;
  onSchichtFilterChange: (filter: SchichtFilter) => void;
  employeeSearch: string;
  onEmployeeSearchChange: (search: string) => void;
  onDownloadPdf: () => void;
  isDownloading: boolean;
  isAdmin: boolean;
  vorschlag: {
    vorschlagMode: boolean;
    vorschlaege: unknown[];
    generate: () => void;
    cancel: () => void;
    acceptAll: () => void;
    isGenerating: boolean;
    isSaving: boolean;
  };
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
  employeeSearch,
  onEmployeeSearchChange,
  onDownloadPdf,
  isDownloading,
  isAdmin,
  vorschlag,
}: SchichtplanHeaderProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
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
    <div className="flex flex-col gap-1.5 sm:gap-3">
      {/* Row 1: Title + Controls + Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <MdCalendarMonth className="size-5 sm:size-8 text-primary" />
          <h1 className="text-lg sm:text-2xl font-bold">Schichtplan</h1>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Search — employee view, desktop only */}
          {viewMode === "employee" && (
            <label className="hidden sm:flex input input-bordered input-xs items-center gap-1.5 w-40">
              <MdSearch className="size-3.5 text-base-content/40" />
              <input
                type="text"
                className="grow"
                placeholder="Suchen\u2026"
                value={employeeSearch}
                onChange={(e) => onEmployeeSearchChange(e.target.value)}
              />
              {employeeSearch && (
                <button
                  type="button"
                  className="btn btn-ghost btn-circle btn-xs"
                  onClick={() => onEmployeeSearchChange("")}
                >
                  <MdClose className="size-3" />
                </button>
              )}
            </label>
          )}

          {/* Segmented control — view toggle */}
          <div className="bg-base-200 rounded-lg p-0.5 flex">
            <button
              className={`btn btn-xs sm:btn-sm border-none ${viewMode === "employee" ? "bg-base-100 shadow-sm" : "btn-ghost"}`}
              onClick={() => onViewModeChange("employee")}
            >
              <MdPeople className="size-4" />
              <span className="hidden sm:inline">Mitarbeiter</span>
            </button>
            <button
              className={`btn btn-xs sm:btn-sm border-none ${viewMode === "facility" ? "bg-base-100 shadow-sm" : "btn-ghost"}`}
              onClick={() => onViewModeChange("facility")}
            >
              <MdFactory className="size-4" />
              <span className="hidden sm:inline">Anlagen</span>
            </button>
          </div>

          {/* Separator */}
          <div className="hidden sm:block w-px h-6 bg-base-300" />

          {/* Actions — context-dependent */}
          {vorschlag.vorschlagMode ? (
            <VorschlagToolbar
              count={vorschlag.vorschlaege.length}
              onAcceptAll={vorschlag.acceptAll}
              onCancel={vorschlag.cancel}
              isSaving={vorschlag.isSaving}
            />
          ) : (
            <div className="flex items-center gap-1">
              <button
                className="btn btn-ghost btn-xs sm:btn-sm gap-1"
                onClick={onDownloadPdf}
                disabled={isDownloading}
                aria-label="Als PDF herunterladen"
              >
                {isDownloading ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <MdDownload className="size-4" />
                )}
                <span className="hidden sm:inline">PDF</span>
              </button>
              {isAdmin && (
                <button
                  className="btn btn-ghost btn-xs sm:btn-sm gap-1"
                  onClick={vorschlag.generate}
                  disabled={vorschlag.isGenerating}
                  aria-label="Automatisch zuweisen"
                >
                  {vorschlag.isGenerating ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <MdAutoAwesome className="size-4 text-amber-500" />
                  )}
                  <span className="hidden sm:inline">Auto</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: KW Navigation */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          className="btn btn-ghost btn-xs sm:btn-sm btn-square"
          onClick={goToPrev}
          aria-label="Vorherige Woche"
        >
          <MdChevronLeft className="size-4 sm:size-5" />
        </button>

        <div className="flex items-center gap-1 sm:gap-1.5 bg-base-200 rounded-lg px-2 py-1 sm:px-3 sm:py-1.5">
          <span className="font-bold text-sm sm:text-lg">KW</span>
          <input
            type="number"
            className="input input-ghost input-xs w-10 sm:w-12 text-center font-bold text-sm sm:text-lg p-0"
            value={kw}
            onChange={handleKwInput}
            min={1}
            max={53}
          />
          <span className="text-base-content/40 mx-0.5 sm:mx-1">|</span>
          <input
            type="number"
            className="input input-ghost input-xs w-14 sm:w-16 text-center text-xs sm:text-sm p-0"
            value={jahr}
            onChange={handleYearInput}
            min={2020}
            max={2100}
          />
        </div>

        <button
          className="btn btn-ghost btn-xs sm:btn-sm btn-square"
          onClick={goToNext}
          aria-label="Nächste Woche"
        >
          <MdChevronRight className="size-4 sm:size-5" />
        </button>

        <span className="text-sm text-base-content/60 ml-1 hidden sm:inline">
          {startStr} – {endStr} {jahr}
        </span>

        {/* Mobile search toggle */}
        {viewMode === "employee" && (
          <div className="sm:hidden ml-auto">
            {mobileSearchOpen ? (
              <label className="flex input input-bordered input-xs items-center gap-1.5 w-28">
                <MdSearch className="size-3.5 text-base-content/40 shrink-0" />
                <input
                  type="text"
                  className="grow min-w-0"
                  placeholder="Suchen…"
                  value={employeeSearch}
                  onChange={(e) => onEmployeeSearchChange(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-circle btn-xs"
                  onClick={() => {
                    onEmployeeSearchChange("");
                    setMobileSearchOpen(false);
                  }}
                >
                  <MdClose className="size-3" />
                </button>
              </label>
            ) : (
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-square"
                onClick={() => setMobileSearchOpen(true)}
                aria-label="Mitarbeiter suchen"
              >
                <MdSearch className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Row 3: Combined legend + filters — hidden on mobile */}
      <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
          <button
            className={`btn btn-xs gap-1 ${schichtFilter.length === 0 ? "btn-neutral btn-soft" : "btn-ghost"}`}
            onClick={() => onSchichtFilterChange([])}
          >
            Alle
          </button>
          {(viewMode === "facility"
            ? FACILITY_FILTER_TYPEN
            : ALL_SCHICHT_TYPEN
          ).map((typ) => {
            const colors = SCHICHT_TYP_COLORS[typ];
            const isActive = schichtFilter.includes(typ);
            return (
              <button
                key={typ}
                className={`btn btn-xs gap-1.5 ${isActive ? `${colors?.dot ?? ""} text-white border-transparent` : "btn-ghost"}`}
                onClick={() =>
                  onSchichtFilterChange(
                    isActive
                      ? schichtFilter.filter((f) => f !== typ)
                      : [...schichtFilter, typ],
                  )
                }
              >
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-sm ${isActive ? "bg-white/60" : (colors?.dot ?? "bg-base-300")}`}
                />
                {SCHICHT_TYP_LABELS[typ]}
              </button>
            );
          })}
      </div>
    </div>
  );
}
