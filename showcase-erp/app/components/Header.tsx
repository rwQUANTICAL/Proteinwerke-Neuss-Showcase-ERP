"use client";

import Image from "next/image";
import Link from "next/link";
import { MdAccountCircle, MdMenu } from "react-icons/md";
import { DRAWER_ID } from "@/app/components/DrawerLayout";

export default function Header() {
  return (
    <header className="navbar bg-base-200 shadow-sm px-4">
      {/* Hamburger – mobile only */}
      <div className="flex-none lg:hidden">
        <label
          htmlFor={DRAWER_ID}
          aria-label="Menü öffnen"
          className="btn btn-square btn-ghost"
        >
          <MdMenu className="size-6" />
        </label>
      </div>

      {/* Logo */}
      <div className="flex-none mr-4">
        <Link href="/">
          <Image
            src="/logo-thywissen.svg"
            alt="Logo"
            width={40}
            height={33}
            priority
          />
        </Link>
      </div>

      {/* App title */}
      <div className="flex-1 justify-center">
        <span className="text-lg font-semibold text-primary">
          Öl &amp; Proteinwerke Neuss
        </span>
      </div>

      {/* Account */}
      <div className="flex-none">
        <Link href="/sign-out" className="btn btn-ghost btn-circle">
          <MdAccountCircle className="size-7" />
        </Link>
      </div>
    </header>
  );
}
