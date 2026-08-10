interface PageIntroProps {
  eyebrow: string;
  title: string;
  description: string;
  variant?: "compact" | "standard" | "promotional";
}

const variantClasses = {
  compact:
    "rounded-3xl bg-primary px-5 py-4 text-primary-foreground shadow-[0_18px_48px_-36px_rgba(91,23,51,0.85)] sm:px-7 sm:py-6",
  standard:
    "px-1 py-0 text-foreground sm:px-0",
  promotional:
    "rounded-[2rem] bg-primary px-6 py-8 text-primary-foreground shadow-[0_24px_60px_-34px_rgba(91,23,51,0.9)] sm:px-10 sm:py-12",
} as const;

export function PageIntro({
  eyebrow,
  title,
  description,
  variant = "compact",
}: PageIntroProps) {
  const onBrandSurface = variant !== "standard";

  return (
    <section
      data-slot="page-intro"
      data-variant={variant}
      className={`overflow-hidden ${variantClasses[variant]}`}
    >
      <p
        className={`text-[0.68rem] font-bold uppercase tracking-[0.18em] ${
          onBrandSurface ? "text-primary-foreground/72" : "text-primary"
        }`}
      >
        {eyebrow}
      </p>
      <h1
        className={`mt-1.5 max-w-3xl text-balance font-display font-semibold tracking-tight ${
          variant === "promotional"
            ? "text-[2.35rem] leading-[1.02] sm:mt-3 sm:text-6xl"
            : "text-[1.85rem] leading-[1.08] sm:text-4xl"
        }`}
      >
        {title}
      </h1>
      <p
        className={`mt-1.5 max-w-2xl text-sm leading-5 sm:mt-2 sm:text-base sm:leading-6 ${
          onBrandSurface ? "text-primary-foreground/78" : "text-muted-foreground"
        }`}
      >
        {description}
      </p>
    </section>
  );
}
