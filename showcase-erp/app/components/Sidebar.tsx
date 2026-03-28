"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/app/lib/auth-client";
import { MdCalendarMonth, MdPeople } from "react-icons/md";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const isAdmin = session?.user?.role === "admin";

  return (
    <ul className="menu bg-base-200 text-base-content min-h-full w-64 p-4 gap-1">
      <li className="menu-title">Funktionen</li>
      <li>
        <Link
          href="/schichtplan"
          className={pathname === "/schichtplan" ? "menu-active" : ""}
        >
          <MdCalendarMonth className="size-5" />
          Schichtplan
        </Link>
      </li>

      {isAdmin && (
        <>
          <li className="menu-title mt-4">Verwaltung</li>
          <li>
            <Link
              href="/verwaltung/mitarbeiter"
              className={
                pathname === "/verwaltung/mitarbeiter" ? "menu-active" : ""
              }
            >
              <MdPeople className="size-5" />
              Mitarbeiter
            </Link>
          </li>
        </>
      )}
    </ul>
  );
}
