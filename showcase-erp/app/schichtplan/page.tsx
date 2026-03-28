"use client";

import { useState, useCallback } from "react";
import { useZeitplanQuery } from "@/app/lib/entities/zeitplan/zeitplanHooks";
import type { ZuteilungWithRelations } from "@/app/lib/entities/zeitplan/zeitplanHooks";
import { useMitarbeiterQuery } from "@/app/lib/entities/mitarbeiter/mitarbeiterHooks";
import type { MitarbeiterWithUser } from "@/app/lib/entities/mitarbeiter/mitarbeiterHooks";
import {
  useCreateZuteilungMutation,
  useDeleteZuteilungMutation,
} from "@/app/lib/entities/zuteilung/zuteilungHooks";
import {
  getKwForDate,
  formatDateISO,
} from "@/app/lib/entities/schichtplan/schichtplanConstants";
import SchichtplanHeader from "./_components/SchichtplanHeader";
import type { ViewMode, SchichtFilter } from "./_components/SchichtplanHeader";
import SchichtplanGridEmployee from "./_components/SchichtplanGridEmployee";
import type { ActiveCellEmployee } from "./_components/SchichtplanGridEmployee";
import SchichtplanGridFacility from "./_components/SchichtplanGridFacility";
import type { ActiveCellFacility } from "./_components/SchichtplanGridFacility";
import EditModal from "./_components/EditModal";
import MitarbeiterEditModal from "./_components/MitarbeiterEditModal";
import ClipboardIndicator from "./_components/ClipboardIndicator";

const initialKw = getKwForDate(new Date());

export default function SchichtplanPage() {
  const [jahr, setJahr] = useState(initialKw.jahr);
  const [kw, setKw] = useState(initialKw.kw);
  const [viewMode, setViewMode] = useState<ViewMode>("employee");
  const [schichtFilter, setSchichtFilter] = useState<SchichtFilter>(null);
  const [activeCellEmp, setActiveCellEmp] = useState<ActiveCellEmployee | null>(
    null,
  );
  const [activeCellFac, setActiveCellFac] = useState<ActiveCellFacility | null>(
    null,
  );
  const [editTarget, setEditTarget] = useState<ZuteilungWithRelations | null>(
    null,
  );
  const [editEmployee, setEditEmployee] = useState<MitarbeiterWithUser | null>(
    null,
  );
  const [clipboard, setClipboard] = useState<{
    schicht: string;
    teilanlage: string;
  } | null>(null);

  const zeitplanQuery = useZeitplanQuery(jahr, kw);
  const mitarbeiterQuery = useMitarbeiterQuery();
  const createMutation = useCreateZuteilungMutation(jahr, kw);
  const deleteMutation = useDeleteZuteilungMutation(jahr, kw);

  const handleKwChange = useCallback((newJahr: number, newKw: number) => {
    setJahr(newJahr);
    setKw(newKw);
    setActiveCellEmp(null);
    setActiveCellFac(null);
  }, []);

  const handleEmployeeCellClick = useCallback(
    (datum: Date, mitarbeiterId: string) => {
      setActiveCellEmp((prev) => {
        const datumISO = formatDateISO(datum);
        if (
          prev?.datumISO === datumISO &&
          prev?.mitarbeiterId === mitarbeiterId
        )
          return null;
        return { datumISO, mitarbeiterId };
      });
    },
    [],
  );

  const handleFacilityCellClick = useCallback(
    (datum: Date, teilanlage: string) => {
      setActiveCellFac((prev) => {
        const datumISO = formatDateISO(datum);
        if (prev?.datumISO === datumISO && prev?.teilanlage === teilanlage)
          return null;
        return { datumISO, teilanlage };
      });
    },
    [],
  );

  const handleAssign = useCallback(
    (data: {
      schicht: string;
      teilanlage: string;
      mitarbeiterId: string;
      datum: string;
    }) => {
      if (!zeitplanQuery.data) return;
      setActiveCellEmp(null);
      setActiveCellFac(null);
      createMutation.mutate({ ...data, zeitplanId: zeitplanQuery.data.id });
    },
    [zeitplanQuery.data, createMutation],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation],
  );

  const handleCancel = useCallback(() => {
    setActiveCellEmp(null);
    setActiveCellFac(null);
  }, []);

  const handleEdit = useCallback((z: ZuteilungWithRelations) => {
    setEditTarget(z);
  }, []);

  const handleEditEmployee = useCallback((ma: MitarbeiterWithUser) => {
    setEditEmployee(ma);
  }, []);

  const handleCopy = useCallback((z: ZuteilungWithRelations) => {
    setClipboard({ schicht: z.schicht, teilanlage: z.teilanlage });
  }, []);

  const handlePaste = useCallback(
    (mitarbeiterId: string, datum: string) => {
      if (!clipboard || !zeitplanQuery.data) return;
      createMutation.mutate({
        mitarbeiterId,
        teilanlage: clipboard.teilanlage,
        datum,
        schicht: clipboard.schicht,
        zeitplanId: zeitplanQuery.data.id,
      });
    },
    [clipboard, zeitplanQuery.data, createMutation],
  );

  return (
    <div className="flex flex-col gap-4">
      <SchichtplanHeader
        jahr={jahr}
        kw={kw}
        onKwChange={handleKwChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        schichtFilter={schichtFilter}
        onSchichtFilterChange={setSchichtFilter}
      />

      {clipboard && (
        <ClipboardIndicator
          clipboard={clipboard}
          onClear={() => setClipboard(null)}
        />
      )}

      {(createMutation.error || deleteMutation.error) && (
        <div role="alert" className="alert alert-error alert-soft">
          <span>{(createMutation.error ?? deleteMutation.error)?.message}</span>
        </div>
      )}

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-2 sm:p-4">
          {zeitplanQuery.isLoading || mitarbeiterQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : zeitplanQuery.error ? (
            <div role="alert" className="alert alert-error">
              <span>Fehler beim Laden des Schichtplans</span>
            </div>
          ) : viewMode === "employee" ? (
            <SchichtplanGridEmployee
              jahr={jahr}
              kw={kw}
              zuteilungen={zeitplanQuery.data?.zuteilungen ?? []}
              mitarbeiterList={mitarbeiterQuery.data ?? []}
              schichtFilter={schichtFilter}
              activeCell={activeCellEmp}
              onCellClick={handleEmployeeCellClick}
              onAssign={handleAssign}
              onCancel={handleCancel}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onCopy={handleCopy}
              onEditEmployee={handleEditEmployee}
              clipboard={clipboard}
              onPaste={handlePaste}
            />
          ) : (
            <SchichtplanGridFacility
              jahr={jahr}
              kw={kw}
              zuteilungen={zeitplanQuery.data?.zuteilungen ?? []}
              mitarbeiterList={mitarbeiterQuery.data ?? []}
              schichtFilter={schichtFilter}
              activeCell={activeCellFac}
              onCellClick={handleFacilityCellClick}
              onAssign={handleAssign}
              onCancel={handleCancel}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onCopy={handleCopy}
            />
          )}
        </div>
      </div>

      {editTarget && (
        <EditModal
          zuteilung={editTarget}
          jahr={jahr}
          kw={kw}
          onClose={() => setEditTarget(null)}
        />
      )}

      {editEmployee && (
        <MitarbeiterEditModal
          mitarbeiter={editEmployee}
          onClose={() => setEditEmployee(null)}
        />
      )}
    </div>
  );
}
