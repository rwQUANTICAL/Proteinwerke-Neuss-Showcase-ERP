"use client";

import { useState } from "react";
import {
  MdLocalHospital,
  MdBeachAccess,
  MdSwapHoriz,
} from "react-icons/md";
import { authClient } from "@/app/lib/auth-client";
import KrankmeldungForm from "./_components/KrankmeldungForm";
import KrankmeldungList from "./_components/KrankmeldungList";
import AdminKrankmeldungList from "./_components/AdminKrankmeldungList";
import UrlaubsantragForm from "./_components/UrlaubsantragForm";
import UrlaubsantragList from "./_components/UrlaubsantragList";
import AdminUrlaubsantragList from "./_components/AdminUrlaubsantragList";

type Tab = "meine" | "verwaltung";
type AbwesenheitTyp = "KRANK" | "URLAUB" | "FREIZEITAUSGLEICH";

const TYPEN = [
  {
    value: "KRANK" as const,
    label: "Krankmeldung",
    icon: MdLocalHospital,
    color: "btn-error",
  },
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
    disabled: true,
  },
] as const;

export default function AbwesenheitPage() {
  const { data: session } = authClient.useSession();
  const isAdmin = session?.user?.role === "admin";
  const [tab, setTab] = useState<Tab>("meine");
  const [typ, setTyp] = useState<AbwesenheitTyp>("KRANK");

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 sm:py-10 flex flex-col gap-6">
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
          </button>
        </div>
      )}

      {tab === "meine" && (
        <>
          {/* Type selector */}
          <div className="flex flex-wrap gap-2">
            {TYPEN.map((t) => {
              const isActive = typ === t.value;
              const Icon = t.icon;
              const isDisabled = "disabled" in t && t.disabled;
              return (
                <button
                  key={t.value}
                  type="button"
                  className={`btn btn-sm ${isActive ? t.color : "btn-ghost"} ${isDisabled ? "btn-disabled opacity-50" : ""}`}
                  onClick={() => !isDisabled && setTyp(t.value)}
                  tabIndex={isDisabled ? -1 : undefined}
                  aria-disabled={isDisabled ? true : undefined}
                >
                  <Icon className="size-4" />
                  {t.label}
                  {isDisabled && (
                    <span className="badge badge-xs badge-ghost">Bald</span>
                  )}
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
        </>
      )}

      {tab === "verwaltung" && isAdmin && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Krankmeldungen</h2>
            <AdminKrankmeldungList />
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Urlaubsanträge</h2>
            <AdminUrlaubsantragList />
          </div>
        </div>
      )}
    </div>
  );
}
