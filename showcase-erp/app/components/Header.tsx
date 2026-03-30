"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MdAccountCircle,
  MdCalendarMonth,
  MdMenu,
  MdPeople,
} from "react-icons/md";
import { authClient } from "@/app/lib/auth-client";

const NAV_ITEMS = [
  {
    href: "/schichtplan",
    label: "Schichtplan",
    icon: MdCalendarMonth,
    adminOnly: false,
  },
  {
    href: "/verwaltung/mitarbeiter",
    label: "Mitarbeiter",
    icon: MdPeople,
    adminOnly: true,
  },
] as const;

export default function Header() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const isAdmin = session?.user?.role === "admin";

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <header className="navbar bg-base-100 border-b border-base-300 px-4">
      {/* Mobile hamburger */}
      <div className="flex-none md:hidden">
        <details className="dropdown">
          <summary className="btn btn-square btn-ghost">
            <MdMenu className="size-6" />
          </summary>
          <ul className="dropdown-content menu bg-base-100 rounded-box z-50 mt-2 w-52 shadow-lg border border-base-300">
            {visibleItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={pathname === item.href ? "menu-active" : ""}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      </div>

      {/* Logo + Title */}
      <div className="flex-none mr-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo-thywissen.svg"
            alt="Logo"
            width={36}
            height={30}
            priority
          />
          <span className="text-lg font-semibold tracking-tight text-base-content">
            Öl &amp; Proteinwerke Neuss
          </span>
        </Link>
      </div>

      {/* Desktop navigation */}
      <nav className="hidden md:flex flex-1 gap-2">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`btn btn-sm uppercase tracking-wide font-medium ${
                isActive
                  ? "btn-primary"
                  : "btn-ghost text-base-content/70"
              }`}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Account */}
      <div className="flex-none">
        <Link href="/sign-out" className="btn btn-ghost btn-circle">
          <MdAccountCircle className="size-7" />
        </Link>
      </div>
    </header>
  );
}
