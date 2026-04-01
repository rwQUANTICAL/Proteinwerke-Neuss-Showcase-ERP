"use client";

import { useState, useMemo } from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { authClient } from "@/app/lib/auth-client";
import {
  useZeitbuchungenQuery,
  getISOWeekData,
  getWeekDates,
} from "@/app/lib/entities/zeitbuchung/zeitbuchungHooks";
import ArbeitszeitenRinge from "./_components/ArbeitszeitenRinge";
import Zeitkonto from "./_components/UeberstundenSaldo";
import Stempeluhr from "./_components/Stempeluhr";
import ZeiterfassungWochenTabelle from "./_components/ZeiterfassungWochenTabelle";
import ZeiterfassungForm from "./_components/ZeiterfassungForm";
import AdminZeiterfassungUebersicht from "./_components/AdminZeiterfassungUebersicht";

type Tab = "meine" | "verwaltung";

function getCurrentWeek() {
  const d = new Date();
  return getISOWeekData(d.toISOString().split("T")[0]);
}

export default function ZeiterfassungPage() {
  const { data: session } = authClient.useSession();
  const isAdmin = session?.user?.role === "admin";
  const [tab, setTab] = useState<Tab>("meine");

  const init = getCurrentWeek();
  const [jahr, setJahr] = useState(init.jahr);
  const [kw, setKw] = useState(init.kw);

  const { data: allEntries } = useZeitbuchungenQuery();

  const weekDates = useMemo(() => getWeekDates(jahr, kw), [jahr, kw]);
  const { data: weekRaw, isLoading } = useZeitbuchungenQuery(
    weekDates[0],
    weekDates[6],
  );

  const weekEntries = useMemo(() => {
    if (!weekRaw) return [];
    const set = new Set(weekDates);
    return weekRaw.filter((e) => set.has(new Date(e.datum).toISOString().split("T")[0]));
  }, [weekRaw, weekDates]);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayEntry = weekEntries.find(
    (e) => new Date(e.datum).toISOString().split("T")[0] === todayStr,
  );

  const navWeek = (d: number) => {
    let nk = kw + d, nj = jahr;
    if (nk < 1) { nj--; nk = 52; }
    else if (nk > 52) { nj++; nk = 1; }
    setKw(nk);
    setJahr(nj);
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-10 flex flex-col gap-5 sm:gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Zeiterfassung</h1>
        {isAdmin && (
          <div role="tablist" className="tabs tabs-bordered tabs-sm">
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
      </div>

      {tab === "meine" && (
        <>
          {/* Dashboard cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ArbeitszeitenRinge
              todayEntry={todayEntry}
              weekEntries={weekEntries}
            />
            <Zeitkonto
              weekEntries={weekEntries}
              allEntries={allEntries ?? []}
            />
            <Stempeluhr />
          </div>

          {/* Week nav */}
          <div className="flex items-center justify-center gap-4">
            <button className="btn btn-ghost btn-sm btn-square" onClick={() => navWeek(-1)}>
              <MdChevronLeft className="size-5" />
            </button>
            <span className="text-sm font-semibold tracking-wide">
              KW {kw} · {jahr}
            </span>
            <button className="btn btn-ghost btn-sm btn-square" onClick={() => navWeek(1)}>
              <MdChevronRight className="size-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-md" />
            </div>
          ) : (
            <>
              <ZeiterfassungWochenTabelle entries={weekEntries} jahr={jahr} kw={kw} />
              <ZeiterfassungForm />
            </>
          )}
        </>
      )}

      {tab === "verwaltung" && isAdmin && <AdminZeiterfassungUebersicht />}
    </div>
  );
}
