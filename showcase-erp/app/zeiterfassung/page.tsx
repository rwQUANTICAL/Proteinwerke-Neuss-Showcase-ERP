"use client";

import { useState, useMemo } from "react";
import { MdChevronLeft, MdChevronRight, MdAccessTime } from "react-icons/md";
import { authClient } from "@/app/lib/auth-client";
import {
  useZeitbuchungenQuery,
  getISOWeekData,
  getWeekDates,
} from "@/app/lib/entities/zeitbuchung/zeitbuchungHooks";
import ZeiterfassungTagesKarte from "./_components/ZeiterfassungTagesKarte";
import ZeiterfassungWochenTabelle from "./_components/ZeiterfassungWochenTabelle";
import ZeiterfassungWochenSummary from "./_components/ZeiterfassungWochenSummary";
import ZeiterfassungChart from "./_components/ZeiterfassungChart";
import ZeiterfassungForm from "./_components/ZeiterfassungForm";
import AdminZeiterfassungUebersicht from "./_components/AdminZeiterfassungUebersicht";

type Tab = "meine" | "verwaltung";

function getCurrentWeek() {
  const now = new Date();
  const iso = now.toISOString().split("T")[0];
  return getISOWeekData(iso);
}

export default function ZeiterfassungPage() {
  const { data: session } = authClient.useSession();
  const isAdmin = session?.user?.role === "admin";

  const [tab, setTab] = useState<Tab>("meine");
  const initial = getCurrentWeek();
  const [jahr, setJahr] = useState(initial.jahr);
  const [kw, setKw] = useState(initial.kw);

  // Compute date range for 8 weeks back (for chart) + current week
  const dateRange = useMemo(() => {
    // 8 weeks back
    let startJ = jahr;
    let startW = kw - 7;
    if (startW < 1) {
      startJ--;
      startW += 52;
    }
    const startDates = getWeekDates(startJ, startW);
    const endDates = getWeekDates(jahr, kw);
    return {
      von: startDates[0],
      bis: endDates[endDates.length - 1],
    };
  }, [jahr, kw]);

  const { data: entries, isLoading } = useZeitbuchungenQuery(
    dateRange.von,
    dateRange.bis,
  );

  // Filter entries for current week only
  const weekDates = useMemo(() => getWeekDates(jahr, kw), [jahr, kw]);
  const weekEntries = useMemo(() => {
    if (!entries) return [];
    const dateSet = new Set(weekDates);
    return entries.filter((e) => {
      const key = new Date(e.datum).toISOString().split("T")[0];
      return dateSet.has(key);
    });
  }, [entries, weekDates]);

  // Today's entry
  const todayStr = new Date().toISOString().split("T")[0];
  const todayEntry = entries?.find(
    (e) => new Date(e.datum).toISOString().split("T")[0] === todayStr,
  );

  const weeklyReq = entries?.[0]?.mitarbeiter?.weeklyWorkRequirement ?? 40;

  const handleKwChange = (delta: number) => {
    let newKw = kw + delta;
    let newJahr = jahr;
    if (newKw < 1) {
      newJahr--;
      newKw = 52;
    } else if (newKw > 52) {
      newJahr++;
      newKw = 1;
    }
    setKw(newKw);
    setJahr(newJahr);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-4 sm:py-10 flex flex-col gap-4 sm:gap-6">
      {/* Title */}
      <div className="flex items-center gap-2">
        <MdAccessTime className="size-6 text-primary" />
        <h1 className="text-2xl font-bold">Zeiterfassung</h1>
      </div>

      {/* Tabs (admin only) */}
      {isAdmin && (
        <div role="tablist" className="tabs tabs-bordered">
          <button
            role="tab"
            className={`tab ${tab === "meine" ? "tab-active" : ""}`}
            onClick={() => setTab("meine")}
          >
            Meine Zeiten
          </button>
          <button
            role="tab"
            className={`tab ${tab === "verwaltung" ? "tab-active" : ""}`}
            onClick={() => setTab("verwaltung")}
          >
            Verwaltung
          </button>
        </div>
      )}

      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button
          className="btn btn-ghost btn-sm btn-square"
          onClick={() => handleKwChange(-1)}
        >
          <MdChevronLeft className="size-5" />
        </button>
        <span className="text-sm font-medium">
          KW {kw} · {jahr}
        </span>
        <button
          className="btn btn-ghost btn-sm btn-square"
          onClick={() => handleKwChange(1)}
        >
          <MdChevronRight className="size-5" />
        </button>
      </div>

      {tab === "meine" && (
        <>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-md" />
            </div>
          ) : (
            <>
              <ZeiterfassungTagesKarte
                entry={todayEntry}
                weeklyReq={weeklyReq}
              />
              <ZeiterfassungWochenSummary
                entries={weekEntries}
                jahr={jahr}
                kw={kw}
                weeklyReq={weeklyReq}
              />
              <ZeiterfassungWochenTabelle
                entries={weekEntries}
                jahr={jahr}
                kw={kw}
                weeklyReq={weeklyReq}
              />
              <ZeiterfassungChart
                entries={entries ?? []}
                weeklyReq={weeklyReq}
                currentKw={kw}
                currentJahr={jahr}
              />
              <ZeiterfassungForm />
            </>
          )}
        </>
      )}

      {tab === "verwaltung" && isAdmin && (
        <AdminZeiterfassungUebersicht jahr={jahr} kw={kw} />
      )}
    </div>
  );
}
