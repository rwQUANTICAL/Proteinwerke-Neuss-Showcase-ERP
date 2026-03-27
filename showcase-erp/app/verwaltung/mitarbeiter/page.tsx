"use client";

import { authClient } from "@/app/lib/auth-client";
import { useRouter } from "next/navigation";
import { MdPeople } from "react-icons/md";
import MitarbeiterForm from "./_components/MitarbeiterForm";
import { useState } from "react";

export default function MitarbeiterverwaltungPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  if (isPending) {
    return (
      <div className="flex justify-center py-24">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!session?.user || session.user.role !== "admin") {
    router.push("/");
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MdPeople className="size-8 text-primary" />
          <h1 className="text-2xl font-bold">Mitarbeiterverwaltung</h1>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Abbrechen" : "Neuer Mitarbeiter"}
        </button>
      </div>

      {showForm && (
        <div className="card bg-base-100 shadow-sm mb-6">
          <div className="card-body">
            <h2 className="card-title">Mitarbeiter anlegen</h2>
            <MitarbeiterForm onSuccess={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
