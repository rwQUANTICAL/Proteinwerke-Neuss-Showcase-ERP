"use client";

import { useState } from "react";
import {
  MdBeachAccess,
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
    icon: MdBeachAccess,
    color: "btn-success",
  },
  {
    value: "FREIZEITAUSGLEICH" as const,
    label: "Freizeitausgleich",
    icon: MdSwapHoriz,
    color: "btn-info",
  },
  {
    value: "KRANK" as const,
    label: "Krankmeldung",
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
    urlaub: true,
    fza: true,
    krank: true,
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
      <h1 className="text-2xl font-bold">Abwesenheit</h1>

      {isAdmin && (
        <div role="tablist" className="tabs tabs-bordered">
          <button
            role="tab"
            className={`tab ${tab === "meine" ? "tab-active" : ""}`}
            onClick={() => setTab("meine")}
          >
            Meine Abwesenheiten
          </button>
          <button
            role="tab"
            className={`tab ${tab === "verwaltung" ? "tab-active" : ""}`}
            onClick={() => setTab("verwaltung")}
          >
            Verwaltung
            {totalPending > 0 && (
              <span className="badge badge-xs badge-warning ml-1">
                {totalPending}
              </span>
            )}
          </button>
        </div>
      )}

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
                  {t.label}
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
              className="flex items-center justify-between w-full p-4 cursor-pointer"
              onClick={() => toggleSection("urlaub")}
            >
              <h2 className="text-lg font-semibold flex items-center gap-2">
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
              <div className="px-4 pb-4">
                <AdminUrlaubsantragList />
              </div>
            )}
          </div>

          {/* Freizeitausgleich */}
          <div className="card card-border bg-base-100">
            <button
              type="button"
              className="flex items-center justify-between w-full p-4 cursor-pointer"
              onClick={() => toggleSection("fza")}
            >
              <h2 className="text-lg font-semibold flex items-center gap-2">
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
              <div className="px-4 pb-4">
                <AdminFreizeitausgleichList />
              </div>
            )}
          </div>

          {/* Krankmeldungen */}
          <div className="card card-border bg-base-100">
            <button
              type="button"
              className="flex items-center justify-between w-full p-4 cursor-pointer"
              onClick={() => toggleSection("krank")}
            >
              <h2 className="text-lg font-semibold">Krankmeldungen</h2>
              {openSections.krank ? (
                <MdExpandLess className="size-5" />
              ) : (
                <MdExpandMore className="size-5" />
              )}
            </button>
            {openSections.krank && (
              <div className="px-4 pb-4">
                <AdminKrankmeldungList />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
