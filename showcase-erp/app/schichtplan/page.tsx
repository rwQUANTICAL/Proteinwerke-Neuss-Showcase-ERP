import { MdCalendarMonth } from "react-icons/md";

const TEILANLAGEN = ["Mühle", "Walze", "Extraktion", "Lecithin"] as const;
const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;

const MOCK_DATA: Record<string, Record<string, string>> = {
  Mühle: {
    Mo: "Müller, F.",
    Di: "Müller, F.",
    Mi: "Schmidt, H.",
    Do: "Schmidt, H.",
    Fr: "Weber, K.",
    Sa: "—",
    So: "—",
  },
  Walze: {
    Mo: "Fischer, A.",
    Di: "Fischer, A.",
    Mi: "Fischer, A.",
    Do: "Braun, M.",
    Fr: "Braun, M.",
    Sa: "—",
    So: "—",
  },
  Extraktion: {
    Mo: "Wagner, T.",
    Di: "Wagner, T.",
    Mi: "Wagner, T.",
    Do: "Wagner, T.",
    Fr: "Wagner, T.",
    Sa: "Becker, L.",
    So: "—",
  },
  Lecithin: {
    Mo: "Hoffmann, S.",
    Di: "Hoffmann, S.",
    Mi: "Hoffmann, S.",
    Do: "Klein, R.",
    Fr: "Klein, R.",
    Sa: "—",
    So: "—",
  },
};

export default function SchichtplanPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <MdCalendarMonth className="size-8 text-primary" />
        <h1 className="text-2xl font-bold">Schichtplan</h1>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg">
            KW 13 — 24.03.2026 – 30.03.2026
          </h2>
          <p className="text-sm text-base-content/60 mb-4">
            Frühschicht — Übersicht (Mockdaten)
          </p>

          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Teilanlage</th>
                  {WOCHENTAGE.map((tag) => (
                    <th key={tag} className="text-center">
                      {tag}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TEILANLAGEN.map((anlage) => (
                  <tr key={anlage}>
                    <td className="font-medium">{anlage}</td>
                    {WOCHENTAGE.map((tag) => (
                      <td key={tag} className="text-center">
                        {MOCK_DATA[anlage]?.[tag] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
