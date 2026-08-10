interface PageIntroProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <section
      data-slot="page-intro"
      className="overflow-hidden rounded-3xl bg-primary px-5 py-5 text-primary-foreground shadow-[0_20px_55px_-36px_rgba(17,55,39,0.9)] sm:rounded-[2rem] sm:px-8 sm:py-8"
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground/70">
        {eyebrow}
      </p>
      <h1 className="mt-2 max-w-3xl font-display text-[2rem] font-semibold leading-[1.05] tracking-tight sm:mt-3 sm:text-5xl">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-5 text-primary-foreground/78 sm:mt-3 sm:text-base sm:leading-6">
        {description}
      </p>
    </section>
  );
}
