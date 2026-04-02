"use client";

import { useState } from "react";
import {
  MdBeachAccess,
  MdDateRange,
  MdSwapHoriz,
  MdLocalHospital,
  MdExpandMore,
  MdExpandLess,
} from "react-icons/md";
import { authClient } from "@/app/lib/auth-client";
import KrankmeldungForm from "./_components/KrankmeldungForm";
import KrankmeldungList from "./_components/KrankmeldungList";
import AdminKrankmeldungList from "./_components/AdminKrankmeldungList";
import UrlaubsantragForm from "./_components/UrlaubsantragForm";
import UrlaubsantragList from "./_components/UrlaubsantragList";
import AdminUrlaubsantragList from "./_components/AdminUrlaubsantragList";
import FreizeitausgleichForm from "./_components/FreizeitausgleichForm";
import FreizeitausgleichList from "./_components/FreizeitausgleichList";
import AdminFreizeitausgleichList from "./_components/AdminFreizeitausgleichList";
import { usePendingUrlaubsantraegeCount } from "@/app/lib/entities/urlaubsantrag/urlaubsantragHooks";
import { usePendingFreizeitausgleichCount } from "@/app/lib/entities/freizeitausgleich/freizeitausgleichHooks";

type Tab = "meine" | "verwaltung";
type AbwesenheitTyp = "URLAUB" | "FREIZEITAUSGLEICH" | "KRANK";

const TYPEN = [
  {
    value: "URLAUB" as const,
    label: "Urlaub",
    shortLabel: "Urlaub",
    icon: MdBeachAccess,
    color: "btn-success",
  },
  {
    value: "FREIZEITAUSGLEICH" as const,
    label: "Freizeitausgleich",
    shortLabel: "FZA",
    icon: MdSwapHoriz,
    color: "btn-info",
  },
  {
    value: "KRANK" as const,
    label: "Krankmeldung",
    shortLabel: "Krank",
    icon: MdLocalHospital,
    color: "btn-error",
  },
] as const;

export default function AbwesenheitPage() {
  const { data: session } = authClient.useSession();
  const isAdmin = session?.user?.role === "admin";
  const [tab, setTab] = useState<Tab>("meine");
  const [typ, setTyp] = useState<AbwesenheitTyp>("URLAUB");
  const [openSections, setOpenSections] = useState({
    urlaub: false,
    fza: false,
    krank: false,
  });
  const { data: pendingUrlaubCount } = usePendingUrlaubsantraegeCount(
    isAdmin === true,
  );
  const { data: pendingFzaCount } = usePendingFreizeitausgleichCount(
    isAdmin === true,
  );
  const totalPending = (pendingUrlaubCount ?? 0) + (pendingFzaCount ?? 0);

  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="container mx-auto max-w-6xl flex flex-col gap-4 sm:gap-6">
      {/* Header row: icon + title + admin toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <MdDateRange className="size-5 sm:size-7 text-primary shrink-0" />
          <h1 className="text-xl sm:text-2xl font-bold">Abwesenheit</h1>
        </div>
        {isAdmin && (
          <div className="flex gap-1">
            <button
              type="button"
              className={`btn btn-xs sm:btn-sm ${tab === "meine" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setTab("meine")}
            >
              Meine
            </button>
            <button
              type="button"
              className={`btn btn-xs sm:btn-sm ${tab === "verwaltung" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setTab("verwaltung")}
            >
              Verwaltung
              {totalPending > 0 && (
                <span className="badge badge-xs badge-warning">
                  {totalPending}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {tab === "meine" && (
        <>
          {/* Type selector */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {TYPEN.map((t) => {
              const isActive = typ === t.value;
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  type="button"
                  className={`btn btn-xs sm:btn-sm ${isActive ? t.color : "btn-ghost"}`}
                  onClick={() => setTyp(t.value)}
                >
                  <Icon className="size-3.5 sm:size-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="sm:hidden">{t.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {typ === "KRANK" && (
            <>
              <KrankmeldungForm />
              <KrankmeldungList />
            </>
          )}

          {typ === "URLAUB" && (
            <>
              <UrlaubsantragForm />
              <UrlaubsantragList />
            </>
          )}

          {typ === "FREIZEITAUSGLEICH" && (
            <>
              <FreizeitausgleichForm />
              <FreizeitausgleichList />
            </>
          )}
        </>
      )}

      {tab === "verwaltung" && isAdmin && (
        <div className="flex flex-col gap-4">
          {/* Urlaubsanträge */}
          <div className="card card-border bg-base-100">
            <button
              type="button"
              className="flex items-center justify-between w-full p-3 sm:p-4 cursor-pointer"
              onClick={() => toggleSection("urlaub")}
            >
              <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                Urlaubsanträge
                {(pendingUrlaubCount ?? 0) > 0 && (
                  <span className="badge badge-sm badge-warning">
                    {pendingUrlaubCount}
                  </span>
                )}
              </h2>
              {openSections.urlaub ? (
                <MdExpandLess className="size-5" />
              ) : (
                <MdExpandMore className="size-5" />
              )}
            </button>
            {openSections.urlaub && (
              <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                <AdminUrlaubsantragList />
              </div>
            )}
          </div>

          {/* Freizeitausgleich */}
          <div className="card card-border bg-base-100">
            <button
              type="button"
              className="flex items-center justify-between w-full p-3 sm:p-4 cursor-pointer"
              onClick={() => toggleSection("fza")}
            >
              <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                Freizeitausgleich
                {(pendingFzaCount ?? 0) > 0 && (
                  <span className="badge badge-sm badge-warning">
                    {pendingFzaCount}
                  </span>
                )}
              </h2>
              {openSections.fza ? (
                <MdExpandLess className="size-5" />
              ) : (
                <MdExpandMore className="size-5" />
              )}
            </button>
            {openSections.fza && (
              <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                <AdminFreizeitausgleichList />
              </div>
            )}
          </div>

          {/* Krankmeldungen */}
          <div className="card card-border bg-base-100">
            <button
              type="button"
              className="flex items-center justify-between w-full p-3 sm:p-4 cursor-pointer"
              onClick={() => toggleSection("krank")}
            >
              <h2 className="text-base sm:text-lg font-semibold">Krankmeldungen</h2>
              {openSections.krank ? (
                <MdExpandLess className="size-5" />
              ) : (
                <MdExpandMore className="size-5" />
              )}
            </button>
            {openSections.krank && (
              <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                <AdminKrankmeldungList />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
