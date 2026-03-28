"use client";

import { useState, useRef, useEffect } from "react";
import { MdClose, MdArrowBack } from "react-icons/md";
import {
  SCHICHT_TYP_LABELS,
  SCHICHT_TYP_COLORS,
  SCHICHT_ZEITEN,
  TEILANLAGE_LABELS,
  TEILANLAGE_TO_SKILL,
  ASSIGNABLE_SCHICHT_TYPEN,
  PRODUCTION_TEILANLAGEN,
  FACILITY_SCHICHT_TYPEN,
} from "@/app/lib/entities/schichtplan/schichtplanConstants";

interface EmployeeProps {
  mode: "employee";
  employeeSkills: string[];
  onAssign: (data: { schicht: string; teilanlage: string }) => void;
  onCancel: () => void;
}

interface FacilityProps {
  mode: "facility";
  teilanlage: string;
  availableEmployees: { id: string; name: string }[];
  onAssign: (data: { schicht: string; mitarbeiterId: string }) => void;
  onCancel: () => void;
}

type InlineAssignerProps = EmployeeProps | FacilityProps;

export default function InlineAssigner(props: InlineAssignerProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedSchicht, setSelectedSchicht] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { onCancel } = props;

  // Click-outside-to-close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        onCancel();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onCancel]);

  function handleShiftSelect(schicht: string) {
    if (props.mode === "employee") {
      if (schicht === "X_FREI") {
        props.onAssign({ schicht, teilanlage: "SPRINGER" });
        return;
      }
      // Springer and production shifts: show facility picker
      const matching = PRODUCTION_TEILANLAGEN.filter((t) => {
        const required = TEILANLAGE_TO_SKILL[t];
        return required === null || props.employeeSkills.includes(required);
      });
      if (schicht === "SPRINGER") {
        // Springer can go to any facility — show all + "Springer" option
        setSelectedSchicht(schicht);
        setStep(2);
        return;
      }
      if (matching.length === 1) {
        props.onAssign({ schicht, teilanlage: matching[0] });
        return;
      }
      setSelectedSchicht(schicht);
      setStep(2);
    } else {
      if (props.availableEmployees.length === 1) {
        props.onAssign({ schicht, mitarbeiterId: props.availableEmployees[0].id });
        return;
      }
      setSelectedSchicht(schicht);
      setStep(2);
    }
  }

  if (step === 1) {
    const shifts =
      props.mode === "facility"
        ? (FACILITY_SCHICHT_TYPEN as unknown as string[])
        : (ASSIGNABLE_SCHICHT_TYPEN as unknown as string[]);

    return (
      <div ref={wrapperRef} className="flex flex-col gap-1 p-1">
        {shifts.map((s) => {
          const c = SCHICHT_TYP_COLORS[s];
          return (
            <button
              key={s}
              type="button"
              className={`text-xs font-medium rounded-md px-2 py-1 text-left border transition-all hover:shadow-sm ${c.bg} ${c.text} ${c.border}`}
              onClick={() => handleShiftSelect(s)}
            >
              {SCHICHT_TYP_LABELS[s]}
            </button>
          );
        })}
        <button
          type="button"
          className="text-xs text-base-content/40 hover:text-base-content/60 flex items-center gap-0.5 px-2 py-0.5 transition-colors"
          onClick={props.onCancel}
        >
          <MdClose className="size-3" />
        </button>
      </div>
    );
  }

  const sc = SCHICHT_TYP_COLORS[selectedSchicht!];

  if (props.mode === "employee") {
    const isSpringer = selectedSchicht === "SPRINGER";

    if (isSpringer) {
      // Springer: pick shift time (Früh/Spät/Nacht/Flexibel)
      const SPRINGER_SHIFTS = ["FRUEH", "SPAET", "NACHT"] as const;
      return (
        <div ref={wrapperRef} className="flex flex-col gap-1 p-1">
          <button
            type="button"
            className={`text-xs flex items-center gap-1 rounded-md px-2 py-0.5 font-medium ${sc.bg} ${sc.text}`}
            onClick={() => { setStep(1); setSelectedSchicht(null); }}
          >
            <MdArrowBack className="size-3" />
            Springer
          </button>
          {SPRINGER_SHIFTS.map((s) => {
            const c = SCHICHT_TYP_COLORS[s];
            const zeit = SCHICHT_ZEITEN[s];
            return (
              <button
                key={s}
                type="button"
                className={`text-xs font-medium rounded-md px-2 py-1 text-left border transition-all hover:shadow-sm ${c.bg} ${c.text} ${c.border}`}
                onClick={() => props.onAssign({ schicht: s, teilanlage: "SPRINGER" })}
              >
                {SCHICHT_TYP_LABELS[s]}
                {zeit && (
                  <span className="opacity-60 ml-1">
                    {zeit.von}–{zeit.bis}
                  </span>
                )}
              </button>
            );
          })}
          <button
            type="button"
            className="text-xs font-medium rounded-md px-2 py-1 text-left bg-base-200 hover:bg-base-300 transition-colors"
            onClick={() => props.onAssign({ schicht: "SPRINGER", teilanlage: "SPRINGER" })}
          >
            Flexibel
          </button>
        </div>
      );
    }

    // Non-Springer: pick facility
    const facilities = PRODUCTION_TEILANLAGEN.filter((t) => {
      const required = TEILANLAGE_TO_SKILL[t];
      return required === null || props.employeeSkills.includes(required);
    });

    return (
      <div ref={wrapperRef} className="flex flex-col gap-1 p-1">
        <button
          type="button"
          className={`text-xs flex items-center gap-1 rounded-md px-2 py-0.5 font-medium ${sc.bg} ${sc.text}`}
          onClick={() => { setStep(1); setSelectedSchicht(null); }}
        >
          <MdArrowBack className="size-3" />
          {SCHICHT_TYP_LABELS[selectedSchicht!]}
        </button>
        {facilities.map((t) => (
          <button
            key={t}
            type="button"
            className="text-xs font-medium rounded-md px-2 py-1 text-left bg-base-200 hover:bg-base-300 transition-colors"
            onClick={() => props.onAssign({ schicht: selectedSchicht!, teilanlage: t })}
          >
            {TEILANLAGE_LABELS[t]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="flex flex-col gap-1 p-1">
      <button
        type="button"
        className={`text-xs flex items-center gap-1 rounded-md px-2 py-0.5 font-medium ${sc.bg} ${sc.text}`}
        onClick={() => { setStep(1); setSelectedSchicht(null); }}
      >
        <MdArrowBack className="size-3" />
        {SCHICHT_TYP_LABELS[selectedSchicht!]}
      </button>
      {props.availableEmployees.length === 0 && (
        <p className="text-xs text-base-content/40 px-2 py-1">Keine verfügbar</p>
      )}
      {props.availableEmployees.map((emp) => (
        <button
          key={emp.id}
          type="button"
          className="text-xs font-medium rounded-md px-2 py-1 text-left bg-base-200 hover:bg-base-300 transition-colors truncate"
          onClick={() => props.onAssign({ schicht: selectedSchicht!, mitarbeiterId: emp.id })}
        >
          {emp.name}
        </button>
      ))}
    </div>
  );
}
