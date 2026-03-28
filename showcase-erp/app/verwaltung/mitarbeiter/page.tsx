"use client";

import { authClient } from "@/app/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MdPeople } from "react-icons/md";
import MitarbeiterTable from "./_components/MitarbeiterTable";

export default function MitarbeiterverwaltungPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

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
        <Link
          href="/verwaltung/mitarbeiter/neuen-anlegen"
          className="btn btn-primary"
        >
          Neuer Mitarbeiter
        </Link>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <MitarbeiterTable />
        </div>
      </div>
    </div>
  );
}
