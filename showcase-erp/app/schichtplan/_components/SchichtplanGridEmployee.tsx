"use client";

import { useMemo } from "react";
import { MdAdd, MdEdit, MdContentPaste } from "react-icons/md";
import type { ZuteilungWithRelations } from "@/app/lib/entities/zeitplan/zeitplanHooks";
import type { MitarbeiterWithUser } from "@/app/lib/entities/mitarbeiter/mitarbeiterHooks";
import ZuteilungCell from "./ZuteilungCell";
import InlineAssigner from "./InlineAssigner";
import {
  WOCHENTAGE,
  SKILL_SHORT,
  SKILL_LABELS,
  getWeekDates,
  formatDateShort,
  formatDateISO,
} from "@/app/lib/entities/schichtplan/schichtplanConstants";
import type { SchichtFilter } from "./SchichtplanHeader";

export interface ActiveCellEmployee {
  datumISO: string;
  mitarbeiterId: string;
}

interface SchichtplanGridEmployeeProps {
  jahr: number;
  kw: number;
  zuteilungen: ZuteilungWithRelations[];
  mitarbeiterList: MitarbeiterWithUser[];
  schichtFilter: SchichtFilter;
  employeeSearch: string;
  isAdmin: boolean;
  activeCell: ActiveCellEmployee | null;
  onCellClick: (datum: Date, mitarbeiterId: string) => void;
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
  onEditEmployee: (mitarbeiter: MitarbeiterWithUser) => void;
  clipboard: { schicht: string; teilanlage: string } | null;
  onPaste: (mitarbeiterId: string, datum: string) => void;
}

export default function SchichtplanGridEmployee({
  jahr,
  kw,
  zuteilungen,
  mitarbeiterList,
  schichtFilter,
  employeeSearch,
  isAdmin,
  activeCell,
  onCellClick,
  onAssign,
  onCancel,
  onDelete,
  onEdit,
  onCopy,
  onEditEmployee,
  clipboard,
  onPaste,
}: SchichtplanGridEmployeeProps) {
  const weekDates = useMemo(() => getWeekDates(jahr, kw), [jahr, kw]);

  // Index zuteilungen by mitarbeiterId + date
  const zuteilungMap = useMemo(() => {
    const map = new Map<string, ZuteilungWithRelations>();
    for (const z of zuteilungen) {
      const dateKey = z.datum.split("T")[0];
      map.set(`${z.mitarbeiterId}:${dateKey}`, z);
    }
    return map;
  }, [zuteilungen]);

  // Filter employees: by search term and/or shift filter
  const filteredMitarbeiter = useMemo(() => {
    let list = mitarbeiterList;

    if (employeeSearch.trim()) {
      const q = employeeSearch.toLowerCase();
      list = list.filter((ma) => ma.name.toLowerCase().includes(q));
    }

    if (schichtFilter.length === 0) return list;
    const NON_WORKING = ["X_FREI", "URLAUB", "KRANK"];
    return list.filter((ma) =>
      zuteilungen.some((z) => {
        if (z.mitarbeiterId !== ma.id) return false;
        return schichtFilter.some((f) => {
          if (f === "SPRINGER") {
            return (
              z.teilanlage === "SPRINGER" && !NON_WORKING.includes(z.schicht)
            );
          }
          return z.schicht === f;
        });
      }),
    );
  }, [mitarbeiterList, employeeSearch, schichtFilter, zuteilungen]);

  return (
    <div className="-mx-2 sm:mx-0">
      <table className="table table-xs sm:table-sm table-fixed w-full">
        <thead>
          <tr>
            <th className="w-[70px] sm:w-[210px] sticky left-0 z-10 border-r border-base-200 bg-base-100 px-1 sm:px-2">
              <span className="hidden sm:inline">Mitarbeiter</span>
              <span className="sm:hidden text-[10px]">Name</span>
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
          {filteredMitarbeiter.map((ma) => (
            <tr key={ma.id} className="hover">
              {/* Employee header cell */}
              <td className="sticky left-0 z-10 bg-base-100 border-r border-base-200 py-0.5 sm:py-1.5 px-1 sm:px-2">
                {/* Line 1: Name + hours */}
                <div className="flex items-center justify-between gap-1">
                  {isAdmin ? (
                    <button
                      type="button"
                      className="text-left group/emp min-w-0"
                      onClick={() => onEditEmployee(ma)}
                    >
                      <span className="font-medium text-xs sm:text-sm group-hover/emp:text-primary transition-colors flex items-center gap-0.5 truncate">
                        <span className="hidden sm:inline">{ma.name}</span>
                        <MdEdit className="size-3 shrink-0 opacity-0 group-hover/emp:opacity-60 transition-opacity hidden sm:inline" />
                      </span>
                      <span className="sm:hidden text-[10px] font-medium leading-tight">
                        <div>{ma.name.split(" ")[0]}</div>
                        <div className="text-base-content/60">
                          {ma.name.split(" ").slice(1).join(" ")}
                        </div>
                      </span>
                    </button>
                  ) : (
                    <>
                      <span className="font-medium text-xs sm:text-sm truncate hidden sm:inline">
                        {ma.name}
                      </span>
                      <span className="sm:hidden text-[10px] font-medium leading-tight">
                        <div>{ma.name.split(" ")[0]}</div>
                        <div className="text-base-content/60">
                          {ma.name.split(" ").slice(1).join(" ")}
                        </div>
                      </span>
                    </>
                  )}
                  {isAdmin && (
                    <span className="hidden sm:inline text-[10px] text-base-content/30 whitespace-nowrap shrink-0">
                      Ü: 0h
                    </span>
                  )}
                </div>
                {/* Line 2: Skills abbreviated (admin only) */}
                {isAdmin && (
                  <div className="hidden sm:flex gap-0.5 mt-0.5">
                    {ma.skills.map((s) => (
                      <span
                        key={s}
                        className="badge badge-xs badge-outline"
                        title={SKILL_LABELS[s] ?? s}
                      >
                        {SKILL_SHORT[s] ?? s}
                      </span>
                    ))}
                  </div>
                )}
              </td>

              {/* Day cells */}
              {weekDates.map((date, i) => {
                const dateKey = formatDateISO(date);
                const zuteilung = zuteilungMap.get(`${ma.id}:${dateKey}`);
                const dimmed =
                  schichtFilter.length > 0 &&
                  zuteilung !== undefined &&
                  !schichtFilter.some((f) =>
                    f === "SPRINGER"
                      ? zuteilung.teilanlage === "SPRINGER"
                      : zuteilung.schicht === f,
                  );
                const isWeekend = i >= 5;
                const isActive =
                  activeCell?.datumISO === dateKey &&
                  activeCell?.mitarbeiterId === ma.id;

                return (
                  <td
                    key={i}
                    className={`p-0.5 sm:p-1 align-top ${isWeekend ? "bg-base-200/15" : ""}`}
                  >
                    {isActive && !zuteilung ? (
                      <InlineAssigner
                        mode="employee"
                        employeeSkills={ma.skills}
                        onAssign={(d) =>
                          onAssign({
                            ...d,
                            mitarbeiterId: ma.id,
                            datum: dateKey,
                          })
                        }
                        onCancel={onCancel}
                      />
                    ) : zuteilung ? (
                      <ZuteilungCell
                        zuteilung={zuteilung}
                        showEmployee={false}
                        showFacility={true}
                        showSkills={false}
                        onDelete={isAdmin ? onDelete : undefined}
                        onEdit={isAdmin ? onEdit : undefined}
                        onCopy={isAdmin ? onCopy : undefined}
                        dimmed={dimmed}
                      />
                    ) : isAdmin ? (
                      <div className="flex gap-0.5 sm:gap-1 min-h-[1.5rem] sm:min-h-[3rem]">
                        <button
                          type="button"
                          className="flex items-center justify-center flex-1 rounded-lg
                            border border-dashed border-base-300/60 text-base-content/20
                            hover:border-primary/40 hover:text-primary/60 hover:bg-primary/5
                            transition-all cursor-pointer"
                          onClick={() => onCellClick(date, ma.id)}
                          aria-label={`Zuteilung für ${ma.name} am ${WOCHENTAGE[i]}`}
                        >
                          <MdAdd className="size-3 sm:size-5" />
                        </button>
                        {clipboard && (
                          <button
                            type="button"
                            className="flex items-center justify-center w-8 rounded-lg
                              border border-dashed border-info/40 text-info/40
                              hover:border-info hover:text-info hover:bg-info/5
                              transition-all cursor-pointer"
                            onClick={() => onPaste(ma.id, dateKey)}
                            aria-label="Einfügen"
                          >
                            <MdContentPaste className="size-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="min-h-[1.5rem] sm:min-h-[3rem]" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}

          {filteredMitarbeiter.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center py-8 text-base-content/50">
                {schichtFilter
                  ? "Keine Mitarbeiter mit diesem Schichttyp in dieser Woche"
                  : "Keine Mitarbeiter vorhanden"}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
