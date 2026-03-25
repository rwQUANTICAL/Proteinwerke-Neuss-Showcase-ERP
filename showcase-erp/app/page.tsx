import HeroBackground from "@/app/components/HeroBackground";

export default function Home() {
  return (
    <HeroBackground>
      <h1 className="mb-5 text-4xl font-bold text-primary">
        Willkommen bei Öl &amp; Protein Werke Neuss
      </h1>
      <p className="mb-5 text-base-content">
        Ihr digitales Schichtplan- und Personalmanagement – einfach,
        übersichtlich und effizient.
      </p>
      <button className="btn btn-primary">Zum Schichtplan</button>
    </HeroBackground>
  );
}
