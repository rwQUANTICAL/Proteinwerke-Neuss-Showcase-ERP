export default function HeroBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="hero min-h-[calc(100vh-4rem)]"
      style={{ backgroundImage: "url(/hero_background.jpg)" }}
    >
      <div className="hero-overlay bg-neutral/70"></div>
      <div className="hero-content text-center">
        <div className="w-full max-w-xl rounded-box bg-base-100/90 p-12 shadow-xl">
          {children}
        </div>
      </div>
    </div>
  );
}
