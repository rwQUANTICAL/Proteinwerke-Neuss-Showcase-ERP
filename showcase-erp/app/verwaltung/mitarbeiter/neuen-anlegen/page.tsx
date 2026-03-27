"use client";

import { authClient } from "@/app/lib/auth-client";
import { useRouter } from "next/navigation";
import { MdPersonAdd } from "react-icons/md";
import MitarbeiterForm from "../_components/MitarbeiterForm";

export default function NeuenMitarbeiterAnlegenPage() {
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
    <div className="flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <MdPersonAdd className="size-8 text-primary" />
          <h1 className="text-2xl font-bold">Mitarbeiter anlegen</h1>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <MitarbeiterForm
              onSuccess={() => router.push("/verwaltung/mitarbeiter")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
