"use client";

import Sidebar from "@/app/components/Sidebar";

export const DRAWER_ID = "app-drawer";

export default function DrawerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="drawer lg:drawer-open">
      <input id={DRAWER_ID} type="checkbox" className="drawer-toggle" />
      <div className="drawer-content">{children}</div>
      <div className="drawer-side z-40">
        <label
          htmlFor={DRAWER_ID}
          aria-label="Menü schließen"
          className="drawer-overlay"
        />
        <Sidebar />
      </div>
    </div>
  );
}
