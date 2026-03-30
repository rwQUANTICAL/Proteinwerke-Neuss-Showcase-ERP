"use client";

import { useState } from "react";
import { authClient } from "@/app/lib/auth-client";
import KrankmeldungForm from "./_components/KrankmeldungForm";
import KrankmeldungList from "./_components/KrankmeldungList";
import AdminKrankmeldungList from "./_components/AdminKrankmeldungList";

type Tab = "meine" | "verwaltung";

export default function AbwesenheitPage() {
  const { data: session } = authClient.useSession();
  const isAdmin = session?.user?.role === "admin";
  const [tab, setTab] = useState<Tab>("meine");

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
          <KrankmeldungForm />
          <KrankmeldungList />
        </>
      )}

      {tab === "verwaltung" && isAdmin && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Krankmeldungen</h2>
          <AdminKrankmeldungList />
        </div>
      )}
    </div>
  );
}
