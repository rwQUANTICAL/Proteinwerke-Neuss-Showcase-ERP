export const SCHICHT_TYP_LABELS: Record<string, string> = {
  FRUEH: "Frühschicht",
  SPAET: "Spätschicht",
  NACHT: "Nachtschicht",
  SPRINGER: "Springer",
  URLAUB: "Urlaub",
  KRANK: "Krank",
  X_FREI: "Frei",
};

/** Diagonal stripe background patterns for non-working shift types */
export const SCHICHT_TYP_PATTERNS: Record<string, string | undefined> = {
  KRANK:
    "repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(244,63,94,0.13) 4px, rgba(244,63,94,0.13) 6px)",
  X_FREI:
    "repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(148,163,184,0.13) 4px, rgba(148,163,184,0.13) 6px)",
};

export const SCHICHT_TYP_COLORS: Record<
  string,
  { bg: string; text: string; border: string; dot: string }
> = {
  FRUEH: {
    bg: "bg-sky-100",
    text: "text-sky-800",
    border: "border-sky-200",
    dot: "bg-sky-500",
  },
  SPAET: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    border: "border-yellow-200",
    dot: "bg-yellow-500",
  },
  NACHT: {
    bg: "bg-violet-100",
    text: "text-violet-800",
    border: "border-violet-200",
    dot: "bg-violet-500",
  },
  SPRINGER: {
    bg: "bg-teal-100",
    text: "text-teal-800",
    border: "border-teal-200",
    dot: "bg-teal-500",
  },
  URLAUB: {
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  KRANK: {
    bg: "bg-rose-100",
    text: "text-rose-800",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  X_FREI: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
};

export const TEILANLAGE_LABELS: Record<string, string> = {
  MUEHLE: "Mühle",
  WALZE: "Walze",
  EXTRAKTION: "Extraktion",
  LECITHIN: "Lecithin",
  SPRINGER: "Springer",
};

/** Short readable shift labels for mobile view */
export const SCHICHT_TYP_SHORT: Record<string, string> = {
  FRUEH: "Früh",
  SPAET: "Spät",
  NACHT: "Nacht",
  SPRINGER: "Sp",
  URLAUB: "Url.",
  KRANK: "Krank",
  X_FREI: "Frei",
};

export const SKILL_LABELS: Record<string, string> = {
  MUEHLE: "Mühle",
  WALZE: "Walze",
  EXTRAKTION: "Extraktion",
  LECITHIN: "Lecithin",
};

export const SKILL_SHORT: Record<string, string> = {
  MUEHLE: "M",
  WALZE: "W",
  EXTRAKTION: "E",
  LECITHIN: "L",
};

export const NON_WORKING_SCHICHT_TYPEN = ["X_FREI", "URLAUB", "KRANK"] as const;

export const SCHICHT_ZEITEN: Record<string, { von: string; bis: string }> = {
  FRUEH: { von: "06:00", bis: "14:00" },
  SPAET: { von: "14:00", bis: "22:00" },
  NACHT: { von: "22:00", bis: "06:00" },
  SPRINGER: { von: "06:00", bis: "14:00" },
};

/** Maps Teilanlage to the required MitarbeiterSkill. SPRINGER requires no specific skill. */
export const TEILANLAGE_TO_SKILL: Record<string, string | null> = {
  MUEHLE: "MUEHLE",
  WALZE: "WALZE",
  EXTRAKTION: "EXTRAKTION",
  LECITHIN: "LECITHIN",
  SPRINGER: null,
};

export const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;

export const ALL_SCHICHT_TYPEN = [
  "FRUEH",
  "SPAET",
  "NACHT",
  "SPRINGER",
  "X_FREI",
  "URLAUB",
  "KRANK",
] as const;

/** Shift types relevant for facility view filtering */
export const FACILITY_FILTER_TYPEN = [
  "FRUEH",
  "SPAET",
  "NACHT",
  "SPRINGER",
  "X_FREI",
  "URLAUB",
  "KRANK",
] as const;

/** Sort order for shifts within a facility cell */
export const SCHICHT_SORT_ORDER: Record<string, number> = {
  FRUEH: 0,
  SPAET: 1,
  NACHT: 2,
  SPRINGER: 3,
};

/** Shift types that can be manually assigned by admin (no URLAUB/KRANK — those come from other features) */
export const ASSIGNABLE_SCHICHT_TYPEN = [
  "FRUEH",
  "SPAET",
  "NACHT",
  "SPRINGER",
  "X_FREI",
] as const;

export const ALL_TEILANLAGEN = [
  "MUEHLE",
  "WALZE",
  "EXTRAKTION",
  "LECITHIN",
  "SPRINGER",
] as const;

/** Production facilities that require a specific skill */
export const PRODUCTION_TEILANLAGEN = [
  "MUEHLE",
  "WALZE",
  "EXTRAKTION",
  "LECITHIN",
] as const;

/** The 3 shifts each production facility must have covered per day */
export const REQUIRED_SHIFTS = ["FRUEH", "SPAET", "NACHT"] as const;

/** Shift types shown in facility view assignment (Springer can optionally get a facility) */
export const FACILITY_SCHICHT_TYPEN = ["FRUEH", "SPAET", "NACHT", "SPRINGER"] as const;

/**
 * Returns the 7 dates (Mon–Sun) for a given ISO year and calendar week.
 */
export function getWeekDates(jahr: number, kw: number): Date[] {
  // ISO 8601: Week 1 contains Jan 4th
  const jan4 = new Date(Date.UTC(jahr, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7; // Convert Sunday=0 to 7
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (kw - 1) * 7);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    return d;
  });
}

/**
 * Returns ISO year and calendar week for a given date.
 */
export function getKwForDate(date: Date): { jahr: number; kw: number } {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const kw = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return { jahr: d.getUTCFullYear(), kw };
}

/**
 * Format a UTC date as "DD.MM." (German short format)
 */
export function formatDateShort(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}.${month}.`;
}

/**
 * Format a UTC date as "YYYY-MM-DD" for API transport
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}
