"use client";

import { useState, useMemo } from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import {
  useZeitbuchungenQuery,
  getISOWeekData,
  getWeekDates,
  ARBEITSTAGE_PRO_WOCHE,
} from "@/app/lib/entities/zeitbuchung/zeitbuchungHooks";
import { useUrlaubsantraegeQuery } from "@/app/lib/entities/urlaubsantrag/urlaubsantragHooks";
import { useKrankmeldungenQuery } from "@/app/lib/entities/krankmeldung/krankmeldungHooks";
import ArbeitszeitenRinge from "./_components/ArbeitszeitenRinge";
import MonatsUebersicht from "./_components/MonatsUebersicht";
import ZeiterfassungWochenTabelle from "./_components/ZeiterfassungWochenTabelle";
import ZeiterfassungForm from "./_components/ZeiterfassungForm";

function getCurrentWeek() {
  const d = new Date();
  return getISOWeekData(d.toISOString().split("T")[0]);
}

export default function ZeiterfassungPage() {
  const init = getCurrentWeek();
  const [jahr, setJahr] = useState(init.jahr);
  const [kw, setKw] = useState(init.kw);

  const { data: allEntries } = useZeitbuchungenQuery();
  const { data: urlaubRaw } = useUrlaubsantraegeQuery();
  const { data: krankRaw } = useKrankmeldungenQuery();

  const urlaub = useMemo(
    () =>
      (urlaubRaw ?? [])
        .filter((u) => u.status === "GENEHMIGT")
        .map((u) => ({ von: u.von, bis: u.bis })),
    [urlaubRaw],
  );
  const krank = useMemo(
    () => (krankRaw ?? []).map((k) => ({ von: k.von, bis: k.bis })),
    [krankRaw],
  );

  const weekDates = useMemo(() => getWeekDates(jahr, kw), [jahr, kw]);
  const { data: weekRaw, isLoading } = useZeitbuchungenQuery(
    weekDates[0],
    weekDates[6],
  );

  const weekEntries = useMemo(() => {
    if (!weekRaw) return [];
    const set = new Set(weekDates);
    return weekRaw.filter((e) =>
      set.has(new Date(e.datum).toISOString().split("T")[0]),
    );
  }, [weekRaw, weekDates]);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayEntry = weekEntries.find(
    (e) => new Date(e.datum).toISOString().split("T")[0] === todayStr,
  );

  // Derive Soll from the employee's weekly work requirement
  const weeklyWork = allEntries?.[0]?.mitarbeiter?.weeklyWorkRequirement ?? 42;
  const sollProTag = weeklyWork / ARBEITSTAGE_PRO_WOCHE;

  const navWeek = (d: number) => {
    let nk = kw + d,
      nj = jahr;
    if (nk < 1) {
      nj--;
      nk = 52;
    } else if (nk > 52) {
      nj++;
      nk = 1;
    }
    setKw(nk);
    setJahr(nj);
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-10 flex flex-col gap-5 sm:gap-6">
      <h1 className="text-xl sm:text-2xl font-bold">Zeiterfassung</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        <ArbeitszeitenRinge
          todayEntry={todayEntry}
          weekEntries={weekEntries}
          allEntries={allEntries ?? []}
          sollProTag={sollProTag}
          weeklyWork={weeklyWork}
          urlaub={urlaub}
          krank={krank}
        />
        <MonatsUebersicht
          allEntries={allEntries ?? []}
          urlaub={urlaub}
          krank={krank}
          sollProTag={sollProTag}
        />
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          className="btn btn-ghost btn-sm btn-square"
          onClick={() => navWeek(-1)}
        >
          <MdChevronLeft className="size-5" />
        </button>
        <span className="text-sm font-semibold tracking-wide">
          KW {kw} · {jahr}
        </span>
        <button
          className="btn btn-ghost btn-sm btn-square"
          onClick={() => navWeek(1)}
        >
          <MdChevronRight className="size-5" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-md" />
        </div>
      ) : (
        <>
          <ZeiterfassungWochenTabelle
            entries={weekEntries}
            jahr={jahr}
            kw={kw}
            sollProTag={sollProTag}
          />
          <ZeiterfassungForm />
        </>
      )}
    </div>
  );
}
