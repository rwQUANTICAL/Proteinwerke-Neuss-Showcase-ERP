export default function MuehleIconPreview() {
  return (
    <div className="flex flex-col items-center gap-12 py-16">
      <h1 className="text-2xl font-bold">Mühle Icon — Industrielle Mühle</h1>

      <div className="flex flex-col items-center gap-6">
        <div className="card bg-base-100 shadow-sm p-8">
          <svg
            className="size-32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Hopper / funnel */}
            <path d="M7 1h10l-2.5 4h-5z" />
            {/* Feed neck */}
            <rect x="9.5" y="5" width="5" height="2" />
            {/* Grinding body */}
            <rect x="7" y="7" width="10" height="8" rx="1" />
            {/* Control panel */}
            <rect x="9" y="9" width="6" height="4" rx="0.5" />
            <circle cx="12" cy="11" r="0.5" fill="currentColor" />
            {/* Outlet chute */}
            <path d="M15 15l2 2" />
            {/* Legs */}
            <line x1="8" y1="15" x2="8" y2="20" />
            <line x1="16" y1="15" x2="16" y2="20" />
            {/* Feet / wheels */}
            <circle cx="8" cy="21" r="1" />
            <circle cx="16" cy="21" r="1" />
          </svg>
        </div>

        <button className="btn btn-primary gap-2">
          <svg
            className="size-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 1h10l-2.5 4h-5z" />
            <rect x="9.5" y="5" width="5" height="2" />
            <rect x="7" y="7" width="10" height="8" rx="1" />
            <rect x="9" y="9" width="6" height="4" rx="0.5" />
            <circle cx="12" cy="11" r="0.5" fill="currentColor" />
            <path d="M15 15l2 2" />
            <line x1="8" y1="15" x2="8" y2="20" />
            <line x1="16" y1="15" x2="16" y2="20" />
            <circle cx="8" cy="21" r="1" />
            <circle cx="16" cy="21" r="1" />
          </svg>
          Mühle
        </button>

        <p className="text-sm text-base-content/60">
          Industrielle Mühle mit Trichter, Mahlkörper, Bedienfeld und Rollen
        </p>
      </div>
    </div>
  );
}
