export interface VorschlagItem {
  mitarbeiterId: string;
  mitarbeiterName: string;
  mitarbeiterSkills: string[];
  datum: string; // ISO date "YYYY-MM-DD"
  schicht: string;
  teilanlage: string;
  confidence: "high" | "medium" | "low";
  conflicts: string[];
}
