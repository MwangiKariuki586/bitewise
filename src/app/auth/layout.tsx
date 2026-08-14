import Link from "next/link";
import { Leaf, PiggyBank, Salad, Timer } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const benefits = [
  { icon: PiggyBank, text: "Meals that respect your budget" },
  { icon: Timer, text: "Ideas matched to your time" },
  { icon: Salad, text: "Kenyan food shaped around you" },
];

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(22rem,0.85fr)_minmax(30rem,1.15fr)]">
      <aside className="hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col xl:p-14">
        <Link
          href="/"
          className="flex w-fit items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground"
        >
          <span className="grid size-11 place-items-center rounded-2xl bg-primary-foreground/12">
            <Leaf className="size-5" aria-hidden="true" />
          </span>
          <span className="font-display text-2xl font-semibold">BiteWise</span>
        </Link>
        <div className="my-auto max-w-lg py-14">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-primary-foreground/65">
            Everyday food, thoughtfully planned
          </p>
          <h2 className="mt-5 font-display text-5xl font-semibold leading-[1.06] xl:text-6xl">
            Eat well without stretching the day or the wallet.
          </h2>
          <div className="mt-10 space-y-5">
            {benefits.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-4 text-primary-foreground/82"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-primary-foreground/10">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-primary-foreground/60">
          Made for real Kenyan kitchens.
        </p>
      </aside>

      <div className="relative flex min-h-dvh items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="absolute left-5 top-5 flex items-center gap-2 rounded-xl font-display text-xl font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Leaf className="size-4" aria-hidden="true" />
          </span>
          BiteWise
        </Link>
        {children}
      </div>
    </main>
  );
}
