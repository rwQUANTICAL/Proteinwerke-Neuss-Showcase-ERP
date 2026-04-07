"use client";

import { useState } from "react";
import {
  useMitarbeiterQuery,
  useDeleteMitarbeiterMutation,
} from "@/app/lib/entities/mitarbeiter/mitarbeiterHooks";
import type { MitarbeiterWithUser } from "@/app/lib/entities/mitarbeiter/mitarbeiterHooks";
import MitarbeiterEditModal from "@/app/schichtplan/_components/MitarbeiterEditModal";
import { MdInbox, MdEdit, MdDelete, MdSearch, MdClose } from "react-icons/md";
import LoadingLogo from "@/app/components/LoadingLogo";

const SKILL_LABELS: Record<string, string> = {
  MUEHLE: "M",
  WALZE: "W",
  EXTRAKTION: "E",
  LECITHIN: "L",
};

export default function MitarbeiterTable() {
  const { data: mitarbeiter, isLoading, error } = useMitarbeiterQuery();
  const deleteMutation = useDeleteMitarbeiterMutation();
  const [editTarget, setEditTarget] = useState<MitarbeiterWithUser | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const filtered = mitarbeiter?.filter((ma) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      ma.name.toLowerCase().includes(q) ||
      ma.referenzNummer.toLowerCase().includes(q) ||
      ma.skills.some((s) => (SKILL_LABELS[s] ?? s).toLowerCase().includes(q))
    );
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingLogo size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Fehler beim Laden der Mitarbeiter</span>
      </div>
    );
  }

  if (!mitarbeiter?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
        <MdInbox className="size-12 mb-4" />
        <p>Keine Mitarbeiter vorhanden</p>
      </div>
    );
  }

  return (
    <div>
      {/* Search bar */}
      <div className="mb-3">
        {/* Desktop: full search input */}
        <label className="hidden sm:flex input input-bordered input-sm items-center gap-2 max-w-xs">
          <MdSearch className="size-4 text-base-content/40" />
          <input
            type="text"
            className="grow"
            placeholder="Mitarbeiter suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="btn btn-ghost btn-circle btn-xs"
              onClick={() => setSearch("")}
            >
              <MdClose className="size-3.5" />
            </button>
          )}
        </label>

        {/* Mobile: icon toggle → expandable input */}
        <div className="flex sm:hidden items-center gap-2">
          {mobileSearchOpen ? (
            <label className="flex input input-bordered input-sm items-center gap-2 flex-1">
              <MdSearch className="size-4 text-base-content/40" />
              <input
                type="text"
                className="grow"
                placeholder="Suchen…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="btn btn-ghost btn-circle btn-xs"
                onClick={() => {
                  setSearch("");
                  setMobileSearchOpen(false);
                }}
              >
                <MdClose className="size-3.5" />
              </button>
            </label>
          ) : (
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-square"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Suchen"
            >
              <MdSearch className="size-5" />
            </button>
          )}
        </div>
      </div>

      {/* No results */}
      {!filtered?.length && (
        <div className="flex flex-col items-center justify-center py-8 text-base-content/50">
          <MdSearch className="size-8 mb-2" />
          <p className="text-sm">Keine Treffer für &ldquo;{search}&rdquo;</p>
        </div>
      )}

      {/* Desktop table — hidden on mobile */}
      {!!filtered?.length && (
        <div className="hidden sm:block overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Ref.-Nr.</th>
                <th>Name</th>
                <th>Skills</th>
                <th>Wochenstunden</th>
                <th>Urlaubstage</th>
                <th>Benutzerkonto</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ma) => (
                <tr key={ma.id}>
                  <td className="font-mono">{ma.referenzNummer}</td>
                  <td>{ma.name}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {ma.skills.map((s) => (
                        <span key={s} className="badge badge-sm badge-outline">
                          {SKILL_LABELS[s] ?? s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>{ma.weeklyWorkRequirement}h</td>
                  <td>{ma.urlaubsAnspruch}</td>
                  <td>
                    {ma.user ? (
                      <span className="text-success">{ma.user.email}</span>
                    ) : (
                      <span className="text-base-content/40">—</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        className="btn btn-ghost btn-xs btn-square"
                        onClick={() => setEditTarget(ma)}
                        aria-label="Bearbeiten"
                      >
                        <MdEdit className="size-4" />
                      </button>
                      <button
                        className="btn btn-ghost btn-xs btn-square text-error"
                        onClick={() => deleteMutation.mutate(ma.id)}
                        disabled={deleteMutation.isPending}
                        aria-label="Löschen"
                      >
                        <MdDelete className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile card list — hidden on sm+ */}
      {!!filtered?.length && (
        <div className="sm:hidden flex flex-col gap-2">
          {filtered.map((ma) => (
            <div
              key={ma.id}
              className="flex items-center gap-3 rounded-lg bg-base-200/40 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {ma.name}
                  </span>
                  <span className="text-[10px] font-mono text-base-content/40 shrink-0">
                    {ma.referenzNummer}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex gap-0.5">
                    {ma.skills.map((s) => (
                      <span key={s} className="badge badge-xs badge-outline">
                        {SKILL_LABELS[s] ?? s}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-base-content/50">
                    {ma.weeklyWorkRequirement}h
                  </span>
                  <span className="text-xs text-base-content/50">
                    {ma.urlaubsAnspruch}d
                  </span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  className="btn btn-ghost btn-xs btn-square"
                  onClick={() => setEditTarget(ma)}
                  aria-label="Bearbeiten"
                >
                  <MdEdit className="size-4" />
                </button>
                <button
                  className="btn btn-ghost btn-xs btn-square text-error"
                  onClick={() => deleteMutation.mutate(ma.id)}
                  disabled={deleteMutation.isPending}
                  aria-label="Löschen"
                >
                  <MdDelete className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editTarget && (
        <MitarbeiterEditModal
          mitarbeiter={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
