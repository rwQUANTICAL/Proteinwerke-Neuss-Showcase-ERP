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
  WORKING_SCHICHT_TYPEN,
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
  activeCell: ActiveCellEmployee | null;
  onCellClick: (datum: Date, mitarbeiterId: string) => void;
  onAssign: (data: { schicht: string; teilanlage: string; mitarbeiterId: string; datum: string }) => void;
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

  // Compute assigned hours per employee for this week
  const assignedHoursMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const z of zuteilungen) {
      if (!(WORKING_SCHICHT_TYPEN as readonly string[]).includes(z.schicht)) continue;
      map.set(z.mitarbeiterId, (map.get(z.mitarbeiterId) ?? 0) + 8);
    }
    return map;
  }, [zuteilungen]);

  // Filter employees: when filter is active, only show employees with ≥1 matching entry
  const filteredMitarbeiter = useMemo(() => {
    if (!schichtFilter) return mitarbeiterList;
    const NON_WORKING = ["X_FREI", "URLAUB", "KRANK"];
    return mitarbeiterList.filter((ma) =>
      zuteilungen.some((z) => {
        if (z.mitarbeiterId !== ma.id) return false;
        if (schichtFilter === "SPRINGER") {
          return z.teilanlage === "SPRINGER" && !NON_WORKING.includes(z.schicht);
        }
        return z.schicht === schichtFilter;
      })
    );
  }, [mitarbeiterList, schichtFilter, zuteilungen]);

  return (
    <div>
      <table className="table table-sm table-fixed w-full">
        <thead>
          <tr>
            <th className="w-[210px] sticky left-0 z-10 border-r border-base-200">
              Mitarbeiter
            </th>
            {weekDates.map((date, i) => {
              const isWeekend = i >= 5;
              return (
                <th
                  key={i}
                  className={`text-center ${isWeekend ? "bg-base-200/30" : ""}`}
                >
                  <div className={`font-bold ${isWeekend ? "text-base-content/50" : ""}`}>
                    {WOCHENTAGE[i]}
                  </div>
                  <div className="text-xs font-normal text-base-content/60">
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
              <td className="sticky left-0 z-10 bg-base-100 border-r border-base-200 py-1.5">
                {/* Line 1: Name + hours */}
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    className="text-left group/emp min-w-0"
                    onClick={() => onEditEmployee(ma)}
                  >
                    <span className="font-medium group-hover/emp:text-primary transition-colors flex items-center gap-0.5 truncate">
                      {ma.name}
                      <MdEdit className="size-3 shrink-0 opacity-0 group-hover/emp:opacity-60 transition-opacity" />
                    </span>
                  </button>
                  <span className="text-[10px] text-base-content/50 whitespace-nowrap shrink-0">
                    {assignedHoursMap.get(ma.id) ?? 0}/{Number(ma.weeklyWorkRequirement)}h
                    <span className="ml-1 text-base-content/30">Ü: 0h</span>
                  </span>
                </div>
                {/* Line 2: Skills abbreviated */}
                <div className="flex gap-0.5 mt-0.5">
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
              </td>

              {/* Day cells */}
              {weekDates.map((date, i) => {
                const dateKey = formatDateISO(date);
                const zuteilung = zuteilungMap.get(
                  `${ma.id}:${dateKey}`
                );
                const dimmed =
                  schichtFilter !== null &&
                  zuteilung !== undefined &&
                  (schichtFilter === "SPRINGER"
                    ? zuteilung.teilanlage !== "SPRINGER"
                    : zuteilung.schicht !== schichtFilter);
                const isWeekend = i >= 5;
                const isActive =
                  activeCell?.datumISO === dateKey &&
                  activeCell?.mitarbeiterId === ma.id;

                return (
                  <td
                    key={i}
                    className={`p-1 align-top ${isWeekend ? "bg-base-200/15" : ""}`}
                  >
                    {isActive && !zuteilung ? (
                      <InlineAssigner
                        mode="employee"
                        employeeSkills={ma.skills}
                        onAssign={(d) =>
                          onAssign({ ...d, mitarbeiterId: ma.id, datum: dateKey })
                        }
                        onCancel={onCancel}
                      />
                    ) : zuteilung ? (
                      <ZuteilungCell
                        zuteilung={zuteilung}
                        showEmployee={false}
                        showFacility={true}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onCopy={onCopy}
                        dimmed={dimmed}
                      />
                    ) : (
                      <div className="flex gap-1 min-h-[3rem]">
                        <button
                          type="button"
                          className="flex items-center justify-center flex-1 rounded-lg
                            border border-dashed border-base-300/60 text-base-content/20
                            hover:border-primary/40 hover:text-primary/60 hover:bg-primary/5
                            transition-all cursor-pointer"
                          onClick={() => onCellClick(date, ma.id)}
                          aria-label={`Zuteilung für ${ma.name} am ${WOCHENTAGE[i]}`}
                        >
                          <MdAdd className="size-5" />
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
                    )}
                  </td>
                );
              })}
            </tr>
          ))}

          {filteredMitarbeiter.length === 0 && (
            <tr>
              <td
                colSpan={8}
                className="text-center py-8 text-base-content/50"
              >
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
