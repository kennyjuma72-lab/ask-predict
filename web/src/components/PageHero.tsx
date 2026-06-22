type PageHeroProps = {
  title: string;
  description: string;
  highlight?: string;
  action?: React.ReactNode;
};

export default function PageHero({
  title,
  description,
  highlight,
  action,
}: PageHeroProps) {
  return (
    <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] -mt-24">
      <section className="relative overflow-hidden bg-[#f9f7f4] pt-32 pb-20 border-b border-black/5">
        {/* Subtle brand glow */}
        <div
          aria-hidden
          className="absolute -top-40 left-1/2 -translate-x-1/2 h-[480px] w-[820px] rounded-full opacity-[0.08] blur-3xl bg-brand-gradient"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent"
        />

        <div className="relative mx-auto max-w-6xl px-6">
          {highlight && (
            <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 backdrop-blur px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-700">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-gradient" />
              {highlight}
            </span>
          )}
          <h1 className="mt-6 text-balance text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.05]">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg md:text-xl text-gray-600 leading-relaxed">
            {description}
          </p>
          {action && <div className="mt-9">{action}</div>}
        </div>
      </section>
    </div>
  );
}
