"use client";

import { useState, useEffect, useCallback } from "react";
import { MdPlayArrow, MdStop, MdCoffee } from "react-icons/md";
import { useCreateZeitbuchungMutation } from "@/app/lib/entities/zeitbuchung/zeitbuchungHooks";

type Phase = "idle" | "working" | "break" | "done";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function fmtElapsed(sec: number) {
  return `${pad(Math.floor(sec / 3600))}:${pad(Math.floor((sec % 3600) / 60))}:${pad(sec % 60)}`;
}

function nowHHMM() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Stempeluhr() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [startTime, setStartTime] = useState<string | null>(null);
  const [pauseStart, setPauseStart] = useState<string | null>(null);
  const [pauseEnd, setPauseEnd] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [t0, setT0] = useState<number | null>(null);
  const [breakAcc, setBreakAcc] = useState(0);
  const [breakT0, setBreakT0] = useState<number | null>(null);
  const mutation = useCreateZeitbuchungMutation();

  useEffect(() => {
    if (phase !== "working" && phase !== "break") return;
    const id = setInterval(() => {
      if (!t0) return;
      const now = Date.now();
      const total = Math.floor((now - t0) / 1000);
      const brk =
        phase === "break" && breakT0
          ? breakAcc + Math.floor((now - breakT0) / 1000)
          : breakAcc;
      setElapsed(Math.max(total - brk, 0));
    }, 1000);
    return () => clearInterval(id);
  }, [phase, t0, breakAcc, breakT0]);

  const onStart = useCallback(() => {
    setPhase("working");
    setStartTime(nowHHMM());
    setT0(Date.now());
    setElapsed(0);
    setBreakAcc(0);
    setPauseStart(null);
    setPauseEnd(null);
  }, []);

  const onPause = useCallback(() => {
    setPhase("break");
    setPauseStart(nowHHMM());
    setBreakT0(Date.now());
  }, []);

  const onResume = useCallback(() => {
    setPhase("working");
    setPauseEnd(nowHHMM());
    if (breakT0) setBreakAcc((p) => p + Math.floor((Date.now() - breakT0) / 1000));
    setBreakT0(null);
  }, [breakT0]);

  const onStop = useCallback(() => {
    setPhase("done");
    if (startTime) {
      mutation.mutate({
        datum: new Date().toISOString().split("T")[0],
        von: startTime,
        bis: nowHHMM(),
        pauseVon: pauseStart || null,
        pauseBis: pauseEnd || null,
        schicht: "FRUEH",
      });
    }
  }, [startTime, pauseStart, pauseEnd, mutation]);

  const onReset = useCallback(() => {
    setPhase("idle");
    setStartTime(null);
    setElapsed(0);
    setT0(null);
    setBreakAcc(0);
    setBreakT0(null);
    setPauseStart(null);
    setPauseEnd(null);
  }, []);

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
            Stempeluhr
          </h3>
          {phase === "working" && (
            <span className="badge badge-success badge-xs gap-1">Aktiv</span>
          )}
          {phase === "break" && (
            <span className="badge badge-warning badge-xs gap-1">Pause</span>
          )}
        </div>

        <p className="text-3xl sm:text-4xl font-mono font-bold tabular-nums text-center">
          {fmtElapsed(elapsed)}
        </p>
        {startTime && (
          <p className="text-xs text-base-content/40 text-center mt-0.5">
            Beginn {startTime}
            {pauseStart ? ` · Pause ${pauseStart}` : ""}
            {pauseEnd ? `–${pauseEnd}` : ""}
          </p>
        )}

        <div className="flex gap-2 mt-3 justify-center">
          {phase === "idle" && (
            <button className="btn btn-primary btn-sm" onClick={onStart}>
              <MdPlayArrow className="size-4" /> Einstempeln
            </button>
          )}
          {phase === "working" && (
            <>
              <button className="btn btn-soft btn-warning btn-sm" onClick={onPause}>
                <MdCoffee className="size-4" /> Pause
              </button>
              <button className="btn btn-soft btn-error btn-sm" onClick={onStop}>
                <MdStop className="size-4" /> Ende
              </button>
            </>
          )}
          {phase === "break" && (
            <button className="btn btn-primary btn-sm" onClick={onResume}>
              <MdPlayArrow className="size-4" /> Weiter
            </button>
          )}
          {phase === "done" && (
            <button className="btn btn-ghost btn-sm" onClick={onReset}>
              Zurücksetzen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
