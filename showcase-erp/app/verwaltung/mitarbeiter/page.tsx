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
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <MdPeople className="size-5 sm:size-8 text-primary shrink-0" />
          <h1 className="text-lg sm:text-2xl font-bold truncate">Mitarbeiterverwaltung</h1>
        </div>
        <Link
          href="/verwaltung/mitarbeiter/neuen-anlegen"
          className="btn btn-primary btn-sm sm:btn-md"
        >
          <span className="hidden sm:inline">Neuer Mitarbeiter</span>
          <span className="sm:hidden">Neu</span>
        </Link>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-2 sm:p-6">
          <MitarbeiterTable />
        </div>
      </div>
    </div>
  );
}
