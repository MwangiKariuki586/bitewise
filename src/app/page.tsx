import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  Check,
  ChefHat,
  Clock3,
  Coins,
  CookingPot,
  Heart,
  Leaf,
  ListChecks,
  PackageCheck,
  ShoppingBasket,
  Sparkles,
  Sprout,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getSessionIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const situationCards = [
  {
    title: "Budget is tight",
    detail: "KES 300 for 3 people",
    result: "6 meals that fit",
    icon: Banknote,
    tone: "plum",
  },
  {
    title: "Use what I have",
    detail: "Rice, eggs + sukuma",
    result: "Only 2 items to buy",
    icon: PackageCheck,
    tone: "green",
  },
  {
    title: "Need it quick",
    detail: "I only have 25 minutes",
    result: "Quick local meals",
    icon: Clock3,
    tone: "terracotta",
  },
  {
    title: "Eat a little better",
    detail: "Healthy but affordable",
    result: "Balanced suggestions",
    icon: Sprout,
    tone: "leaf",
  },
] as const;

const journeySteps = [
  { label: "Decide", icon: Sparkles },
  { label: "Plan", icon: ListChecks },
  { label: "Shop", icon: ShoppingBasket },
  { label: "Cook", icon: CookingPot },
] as const;

function Brand() {
  return (
    <span className="landing-brand" aria-label="BiteWise">
      <span className="landing-brand-mark">
        <Leaf aria-hidden="true" />
      </span>
      <span>BiteWise</span>
    </span>
  );
}

export default async function HomePage() {
  const identity = await getSessionIdentity();

  if (identity) {
    const supabase = await createClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("user_id", identity.sub)
      .maybeSingle();

    if (error) throw new Error("Your profile could not be loaded.");
    redirect(profile?.onboarding_completed ? "/eat-now" : "/onboarding");
  }

  return (
    <main className="landing-shell">
      <header className="landing-header">
        <Link href="/" className="landing-logo-link">
          <Brand />
        </Link>
        <nav aria-label="Landing navigation" className="landing-nav">
          <a href="#how-it-works">How it works</a>
          <Link href="/discover">Recipes</Link>
          <Link href="/auth/sign-in">Sign in</Link>
          <Button asChild className="landing-nav-cta">
            <Link href="/onboarding">Get started</Link>
          </Button>
        </nav>
        <div className="landing-mobile-actions">
          <Link href="/auth/sign-in">Sign in</Link>
          <Button asChild size="sm">
            <Link href="/onboarding">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <p className="landing-kicker"><Sprout aria-hidden="true" /> Made for Kenyan kitchens</p>
          <h1 id="landing-title">A better answer to “what should we eat?”</h1>
          <p className="landing-hero-description">
            BiteWise suggests meals that fit your budget, ingredients, time, health needs, and the people you’re feeding—so dinner just makes sense.
          </p>
          <div className="landing-hero-actions">
            <Button asChild size="lg">
              <Link href="/onboarding">Find my next meal</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/discover">Explore local recipes</Link>
            </Button>
          </div>
          <ul className="landing-benefits" aria-label="BiteWise benefits">
            <li><Coins aria-hidden="true" /><span><strong>KES-first</strong> budgets</span></li>
            <li><PackageCheck aria-hidden="true" /><span><strong>Pantry-aware</strong> ideas</span></li>
            <li><Clock3 aria-hidden="true" /><span><strong>Practical</strong> cook times</span></li>
          </ul>
        </div>

        <div className="landing-food-stage">
          <div className="landing-recipe-card">
            <div className="landing-recipe-photo">
              <Image
                src="/images/recipes/githeri.webp"
                alt="A bowl of githeri with vegetables"
                fill
                priority
                sizes="(max-width: 767px) 92vw, (max-width: 1100px) 56vw, 520px"
              />
              <span className="landing-smart-pick"><Sparkles aria-hidden="true" /> Tonight’s smart pick</span>
            </div>
            <div className="landing-recipe-details">
              <h2>Githeri with avocado<br />&amp; sukuma wiki</h2>
              <div className="landing-recipe-meta">
                <span><Coins aria-hidden="true" /> KES 210</span>
                <span><Clock3 aria-hidden="true" /> 25 min</span>
                <span><ChefHat aria-hidden="true" /> Serves 4</span>
                <span className="landing-match"><Check aria-hidden="true" /> Pantry match</span>
              </div>
            </div>
          </div>
          <div className="landing-shopping-note">
            <span><ShoppingBasket aria-hidden="true" /></span>
            <p>You already<br />have 6 items</p>
            <strong>Only 3 things<br />to buy</strong>
          </div>
          <Leaf className="landing-decor-leaf landing-decor-leaf-one" aria-hidden="true" />
          <Leaf className="landing-decor-leaf landing-decor-leaf-two" aria-hidden="true" />
        </div>
      </section>

      <section className="landing-situations" aria-labelledby="situations-title">
        <div className="landing-section-heading">
          <h2 id="situations-title">Whatever today looks like.</h2>
          <p>Tight budgets, little time, or not knowing what to cook—BiteWise meets you there.</p>
        </div>
        <div className="landing-situation-grid">
          {situationCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link href="/onboarding" key={card.title} className={`landing-situation-card landing-tone-${card.tone}`}>
                <span className="landing-situation-icon"><Icon aria-hidden="true" /></span>
                <div><h3>{card.title}</h3><p>{card.detail}</p></div>
                <strong>{card.result}</strong>
                <ArrowRight aria-hidden="true" className="landing-card-arrow" />
              </Link>
            );
          })}
        </div>
      </section>

      <section id="how-it-works" className="landing-journey" aria-labelledby="journey-title">
        <div className="landing-section-heading">
          <h2 id="journey-title">From decision to dinner.</h2>
          <p>BiteWise helps you go from deciding what to eat to getting dinner on the table.</p>
        </div>
        <ol className="landing-steps">
          {journeySteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.label}>
                <span><Icon aria-hidden="true" /></span>
                <strong>{step.label}</strong>
                {index < journeySteps.length - 1 && <ArrowRight className="landing-step-arrow" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
        <div className="landing-value-grid">
          <article><span><Coins aria-hidden="true" /></span><div><h3>Spend smarter</h3><p>Meals that fit your budget without the guesswork.</p></div></article>
          <article><span><PackageCheck aria-hidden="true" /></span><div><h3>Use more of what you have</h3><p>Smarter ideas that reduce waste and save money.</p></div></article>
          <article><span><Heart aria-hidden="true" /></span><div><h3>Cook with confidence</h3><p>Clear guidance for meals your people will love.</p></div></article>
        </div>
      </section>

      <section className="landing-final-cta" aria-labelledby="final-cta-title">
        <Image src="/images/recipes/githeri.webp" alt="" fill sizes="100vw" />
        <div className="landing-final-overlay" />
        <div className="landing-final-content">
          <h2 id="final-cta-title">Your next meal doesn’t need to be a guess.</h2>
          <p>Tell BiteWise what today looks like.</p>
          <div>
            <Button asChild size="lg" className="landing-gold-button"><Link href="/onboarding">Find my next meal</Link></Button>
            <Link href="/discover" className="landing-browse-link">Browse recipes <ArrowRight aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

    </main>
  );
}
