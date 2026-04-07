"use client";

import { useMemo } from "react";
import { MdAdd } from "react-icons/md";
import type { ZuteilungWithRelations } from "@/app/lib/entities/zeitplan/zeitplanHooks";
import type { MitarbeiterWithUser } from "@/app/lib/entities/mitarbeiter/mitarbeiterHooks";
import ZuteilungCell from "./ZuteilungCell";
import VorschlagCell from "./VorschlagCell";
import InlineAssigner from "./InlineAssigner";
import type { VorschlagItem } from "@/app/lib/entities/zuteilung/vorschlagTypes";
import {
  WOCHENTAGE,
  ALL_TEILANLAGEN,
  TEILANLAGE_LABELS,
  TEILANLAGE_TO_SKILL,
  SCHICHT_SORT_ORDER,
  getWeekDates,
  formatDateShort,
  formatDateISO,
} from "@/app/lib/entities/schichtplan/schichtplanConstants";
import type { SchichtFilter } from "./SchichtplanHeader";

export interface ActiveCellFacility {
  datumISO: string;
  teilanlage: string;
}

interface SchichtplanGridFacilityProps {
  jahr: number;
  kw: number;
  zuteilungen: ZuteilungWithRelations[];
  mitarbeiterList: MitarbeiterWithUser[];
  schichtFilter: SchichtFilter;
  isAdmin: boolean;
  activeCell: ActiveCellFacility | null;
  onCellClick: (datum: Date, teilanlage: string) => void;
  onAssign: (data: {
    schicht: string;
    teilanlage: string;
    mitarbeiterId: string;
    datum: string;
  }) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onEdit: (zuteilung: ZuteilungWithRelations) => void;
  onCopy: (zuteilung: ZuteilungWithRelations) => void;
  vorschlaege?: VorschlagItem[];
  onRejectVorschlag?: (mitarbeiterId: string, datum: string) => void;
}

export default function SchichtplanGridFacility({
  jahr,
  kw,
  zuteilungen,
  mitarbeiterList,
  schichtFilter,
  isAdmin,
  activeCell,
  onCellClick,
  onAssign,
  onCancel,
  onDelete,
  onEdit,
  onCopy,
  vorschlaege,
  onRejectVorschlag,
}: SchichtplanGridFacilityProps) {
  const weekDates = useMemo(() => getWeekDates(jahr, kw), [jahr, kw]);

  // Index zuteilungen by teilanlage + date, sorted by shift type
  // For SPRINGER row: exclude Frei/Urlaub/Krank (show only Springer assignments)
  const zuteilungMap = useMemo(() => {
    const NON_SPRINGER = ["X_FREI", "URLAUB", "KRANK"];
    const map = new Map<string, ZuteilungWithRelations[]>();
    for (const z of zuteilungen) {
      const dateKey = z.datum.split("T")[0];
      const key = `${z.teilanlage}:${dateKey}`;
      if (z.teilanlage === "SPRINGER" && NON_SPRINGER.includes(z.schicht)) {
        continue;
      }
      const existing = map.get(key) ?? [];
      existing.push(z);
      map.set(key, existing);
    }
    // Sort each cell's assignments by shift order
    for (const arr of map.values()) {
      arr.sort(
        (a, b) =>
          (SCHICHT_SORT_ORDER[a.schicht] ?? 99) -
          (SCHICHT_SORT_ORDER[b.schicht] ?? 99),
      );
    }
    return map;
  }, [zuteilungen]);

  return (
    <div className="-mx-2 sm:mx-0">
      <table className="table table-xs sm:table-sm table-fixed w-full">
        <colgroup>
          <col className="w-[60px] sm:w-[140px]" />
          {weekDates.map((_, i) => (
            <col key={i} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="w-[60px] sm:w-[140px] sticky left-0 z-10 border-r border-base-200 bg-base-100 px-1 sm:px-2 text-[10px] sm:text-sm">
              Anlage
            </th>
            {weekDates.map((date, i) => {
              const isWeekend = i >= 5;
              return (
                <th
                  key={i}
                  className={`text-center px-0.5 sm:px-2 ${isWeekend ? "bg-base-200/30" : ""}`}
                >
                  <div
                    className={`font-bold text-xs sm:text-sm ${isWeekend ? "text-base-content/50" : ""}`}
                  >
                    {WOCHENTAGE[i]}
                  </div>
                  <div className="text-[10px] sm:text-xs font-normal text-base-content/60 hidden sm:block">
                    {formatDateShort(date)}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {ALL_TEILANLAGEN.map((anlage) => (
            <tr key={anlage} className="hover">
              {/* Facility header cell */}
              <td className="sticky left-0 z-10 bg-base-100 border-r border-base-200 font-medium text-[10px] sm:text-sm px-1 sm:px-2">
                {TEILANLAGE_LABELS[anlage]}
              </td>

              {/* Day cells */}
              {weekDates.map((date, i) => {
                const dateKey = formatDateISO(date);
                const cellZuteilungen =
                  zuteilungMap.get(`${anlage}:${dateKey}`) ?? [];
                const isWeekend = i >= 5;
                const isActive =
                  activeCell?.datumISO === dateKey &&
                  activeCell?.teilanlage === anlage;

                // Available employees for this facility + day
                const availableEmps = isActive
                  ? mitarbeiterList.filter((ma) => {
                      const required = TEILANLAGE_TO_SKILL[anlage];
                      if (required && !ma.skills.includes(required))
                        return false;
                      return !zuteilungen.some(
                        (z) =>
                          z.mitarbeiterId === ma.id &&
                          z.datum.split("T")[0] === dateKey,
                      );
                    })
                  : [];

                return (
                  <td
                    key={i}
                    className={`p-0.5 sm:p-1 align-top ${isWeekend ? "bg-base-200/15" : ""}`}
                  >
                    <div className="flex flex-col gap-1">
                      {cellZuteilungen.map((z) => {
                        const dimmed =
                          schichtFilter.length > 0 &&
                          !schichtFilter.some((f) =>
                            f === "SPRINGER"
                              ? z.teilanlage === "SPRINGER"
                              : z.schicht === f,
                          );
                        return (
                          <ZuteilungCell
                            key={z.id}
                            zuteilung={z}
                            showEmployee={true}
                            showFacility={false}
                            showSkills={isAdmin}
                            onDelete={isAdmin ? onDelete : undefined}
                            onEdit={isAdmin ? onEdit : undefined}
                            onCopy={isAdmin ? onCopy : undefined}
                            dimmed={dimmed}
                          />
                        );
                      })}
                      {isActive ? (
                        <InlineAssigner
                          mode="facility"
                          teilanlage={anlage}
                          availableEmployees={availableEmps.map((m) => ({
                            id: m.id,
                            name: m.name,
                          }))}
                          onAssign={(d) =>
                            onAssign({
                              ...d,
                              teilanlage: anlage,
                              datum: dateKey,
                            })
                          }
                          onCancel={onCancel}
                        />
                      ) : isAdmin ? (
                        <>
                          {vorschlaege
                            ?.filter(
                              (v) =>
                                v.teilanlage === anlage &&
                                v.datum === dateKey &&
                                !["X_FREI", "URLAUB", "KRANK"].includes(
                                  v.schicht,
                                ),
                            )
                            .sort(
                              (a, b) =>
                                (SCHICHT_SORT_ORDER[a.schicht] ?? 99) -
                                (SCHICHT_SORT_ORDER[b.schicht] ?? 99),
                            )
                            .map((v) => (
                              <VorschlagCell
                                key={`vs-${v.mitarbeiterId}-${v.datum}`}
                                vorschlag={v}
                                showEmployee={true}
                                onReject={() =>
                                  onRejectVorschlag?.(v.mitarbeiterId, v.datum)
                                }
                              />
                            ))}
                          <button
                            type="button"
                            className="flex items-center justify-center w-full h-8 rounded-lg
                            border border-dashed border-base-300/60 text-base-content/20
                            hover:border-primary/40 hover:text-primary/60 hover:bg-primary/5
                            transition-all cursor-pointer"
                            onClick={() => onCellClick(date, anlage)}
                            aria-label={`Zuteilung für ${TEILANLAGE_LABELS[anlage]} am ${WOCHENTAGE[i]}`}
                          >
                            <MdAdd className="size-4" />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
