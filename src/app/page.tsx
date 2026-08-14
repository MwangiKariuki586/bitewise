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

const contentWidth =
  "mx-auto w-[min(calc(100%_-_40px),1240px)] max-[1050px]:w-[min(calc(100%_-_48px),920px)] max-[760px]:w-[min(calc(100%_-_32px),560px)] max-[480px]:w-[min(calc(100%_-_28px),420px)]";

const situationCards = [
  {
    title: "Budget is tight",
    detail: "KES 300 for 3 people",
    result: "6 meals that fit",
    icon: Banknote,
    cardClassName: "bg-[#fff1e9]",
    iconClassName: "bg-[#681039]",
  },
  {
    title: "Use what I have",
    detail: "Rice, eggs + sukuma",
    result: "Only 2 items to buy",
    icon: PackageCheck,
    cardClassName: "bg-[#f1f2e5]",
    iconClassName: "bg-[#718c32]",
  },
  {
    title: "Need it quick",
    detail: "I only have 25 minutes",
    result: "Quick local meals",
    icon: Clock3,
    cardClassName: "bg-[#fff0e9]",
    iconClassName: "bg-[#ad5546]",
  },
  {
    title: "Eat a little better",
    detail: "Healthy but affordable",
    result: "Balanced suggestions",
    icon: Sprout,
    cardClassName: "bg-[#f2f2e7]",
    iconClassName: "bg-[#789430]",
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
    <span
      className="inline-flex items-center gap-2.5 font-display text-[31px] font-semibold leading-none max-[760px]:gap-[7px] max-[760px]:text-2xl"
      aria-label="BiteWise"
    >
      <span className="grid h-[35px] w-[43px] place-items-center border-b-[5px] border-[#e5a84b] text-[#56112f] max-[760px]:h-[29px] max-[760px]:w-[34px] [&>svg]:size-[30px] max-[760px]:[&>svg]:size-6">
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
    <main className="min-h-dvh overflow-hidden bg-[#fffdf9] text-[#241c1e]">
      <header className={`${contentWidth} flex min-h-[92px] items-center justify-between gap-8 max-[760px]:min-h-[72px]`}>
        <Link href="/" className="text-[#56112f]">
          <Brand />
        </Link>
        <nav
          aria-label="Landing navigation"
          className="flex items-center gap-[clamp(24px,4vw,54px)] text-[15px] max-[760px]:hidden [&>a:not(:last-child)]:py-3 [&>a:not(:last-child)]:hover:text-[#6a173a]"
        >
          <a href="#how-it-works">How it works</a>
          <Link href="/discover">Recipes</Link>
          <Link href="/auth/sign-in">Sign in</Link>
          <Button asChild className="h-12 min-w-[142px] rounded-[10px]">
            <Link href="/onboarding">Get started</Link>
          </Button>
        </nav>
        <div className="hidden items-center gap-3 text-[13px] max-[760px]:flex max-[480px]:[&>a:first-child]:hidden">
          <Link href="/auth/sign-in">Sign in</Link>
          <Button asChild size="sm">
            <Link href="/onboarding">Get started</Link>
          </Button>
        </div>
      </header>

      <section
        className={`${contentWidth} grid min-h-[650px] grid-cols-[minmax(0,.92fr)_minmax(460px,1.08fr)] items-center gap-[52px] pb-[74px] pt-10 max-[1050px]:min-h-[580px] max-[1050px]:grid-cols-[.9fr_1.1fr] max-[1050px]:gap-[30px] max-[1050px]:pt-5 max-[760px]:flex max-[760px]:min-h-0 max-[760px]:flex-col max-[760px]:gap-[26px] max-[760px]:py-8 max-[760px]:pb-[54px] max-[760px]:text-center max-[480px]:pt-[22px]`}
        aria-labelledby="landing-title"
      >
        <div>
          <p className="hidden items-center justify-center gap-[7px] text-xs font-bold uppercase tracking-[.12em] text-[#6b173a] max-[760px]:inline-flex [&>svg]:size-4">
            <Sprout aria-hidden="true" /> Made for Kenyan kitchens
          </p>
          <h1
            id="landing-title"
            className="max-w-[610px] font-display text-[clamp(62px,5.6vw,83px)] font-medium leading-[.98] tracking-[-.045em] text-[#56112f] max-[1050px]:text-[clamp(52px,6.3vw,66px)] max-[760px]:mx-auto max-[760px]:mt-[13px] max-[760px]:max-w-[520px] max-[760px]:text-[clamp(47px,13vw,65px)] max-[760px]:leading-[.95] max-[480px]:text-[clamp(43px,13.5vw,58px)]"
          >
            A better answer to “what should we eat?”
          </h1>
          <p className="mt-[26px] max-w-[560px] text-[17px] leading-[1.65] text-[#40373a] max-[1050px]:text-[15px] max-[760px]:mx-auto max-[760px]:mt-5 max-[760px]:leading-[1.6] max-[480px]:text-sm">
            BiteWise suggests meals that fit your budget, ingredients, time, health needs, and the people you’re feeding—so dinner just makes sense.
          </p>
          <div className="mt-8 flex gap-4 max-[760px]:mt-[25px] max-[760px]:justify-center max-[760px]:[&>a]:min-w-0 max-[480px]:flex-col max-[480px]:items-stretch max-[480px]:gap-2.5 max-[480px]:[&>a]:w-full">
            <Button asChild size="lg" className="h-[52px] min-w-[186px] rounded-[9px]">
              <Link href="/onboarding">Find my next meal</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-[52px] min-w-[186px] rounded-[9px] border-[#7b4660] bg-[#fffdfa] text-[#56112f]"
            >
              <Link href="/discover">Explore local recipes</Link>
            </Button>
          </div>
          <ul
            className="mt-9 grid max-w-[560px] grid-cols-3 gap-[22px] max-[1050px]:gap-3 max-[760px]:mx-auto max-[760px]:mt-[27px] max-[760px]:max-w-[490px] max-[760px]:text-left max-[480px]:w-fit max-[480px]:grid-cols-1 max-[480px]:gap-3"
            aria-label="BiteWise benefits"
          >
            {[
              { label: "KES-first", suffix: "budgets", icon: Coins },
              { label: "Pantry-aware", suffix: "ideas", icon: PackageCheck },
              { label: "Practical", suffix: "cook times", icon: Clock3 },
            ].map((benefit) => {
              const Icon = benefit.icon;
              return (
                <li key={benefit.label} className="flex items-center gap-[11px] text-xs leading-[1.45] max-[480px]:text-[13px]">
                  <Icon
                    className="size-[42px] shrink-0 rounded-full border-[1.5px] border-[#d99316] p-[9px] text-[#9d6504] max-[1050px]:size-9 max-[1050px]:p-2"
                    aria-hidden="true"
                  />
                  <span>
                    <strong className="block font-semibold max-[480px]:inline">{benefit.label}</strong> {benefit.suffix}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative min-h-[560px] before:absolute before:inset-[60px_-100px_16px_100px] before:-rotate-[7deg] before:rounded-[36px] before:bg-[#9c6055] before:opacity-[.46] before:shadow-[0_20px_45px_rgb(53_25_31_/_15%)] before:content-[''] max-[1050px]:min-h-[470px] max-[760px]:min-h-[465px] max-[760px]:w-full max-[480px]:mt-[3px] max-[480px]:min-h-[390px] max-[480px]:before:inset-[48px_-40px_14px_55px]">
          <div className="absolute inset-[24px_42px_18px_26px] z-[1] rotate-[4.5deg] overflow-hidden rounded-3xl border-[7px] border-white bg-white shadow-[0_24px_45px_rgb(45_28_31_/_22%)] max-[1050px]:inset-[22px_26px_16px_4px] max-[760px]:inset-[8px_28px_8px_12px] max-[760px]:rotate-[2.5deg] max-[480px]:inset-[3px_12px_7px_4px] max-[480px]:rounded-[18px] max-[480px]:border-[5px]">
            <div className="relative h-[67%] overflow-hidden rounded-[14px] max-[1050px]:rounded-[17px] max-[480px]:h-[62%] max-[480px]:rounded-xl">
              <Image
                src="/images/recipes/githeri.webp"
                alt="A bowl of githeri with vegetables"
                fill
                priority
                sizes="(max-width: 767px) 92vw, (max-width: 1100px) 56vw, 520px"
                className="scale-[1.03] object-cover max-[1050px]:scale-[1.08] max-[1050px]:-rotate-[4.5deg] max-[760px]:-rotate-[2.5deg]"
              />
              <span className="absolute left-[22px] top-[22px] flex items-center gap-[7px] rounded-full bg-[#e7a629] px-4 py-2.5 text-xs text-white shadow-[0_8px_18px_rgb(55_31_7_/_18%)] max-[480px]:left-3.5 max-[480px]:top-3.5 max-[480px]:px-[11px] max-[480px]:py-2 max-[480px]:text-[10px] [&>svg]:size-4">
                <Sparkles aria-hidden="true" /> Tonight’s smart pick
              </span>
            </div>
            <div className="px-[22px] py-[18px] text-[#21191c] max-[480px]:px-3.5 max-[480px]:py-[13px]">
              <h2 className="font-display text-[29px] font-medium leading-[.94] tracking-[-.025em] max-[480px]:text-2xl">
                Githeri with avocado<br />&amp; sukuma wiki
              </h2>
              <div className="mt-4 flex items-center gap-[15px] text-[11px] font-semibold max-[480px]:mt-2.5 max-[480px]:grid max-[480px]:grid-cols-2 max-[480px]:gap-x-2.5 max-[480px]:gap-y-[7px] max-[480px]:text-[10px] [&>span]:inline-flex [&>span]:items-center [&>span]:gap-[5px] [&>span]:whitespace-nowrap [&_svg]:size-[15px] [&_svg]:text-[#6a173a]">
                <span><Coins aria-hidden="true" /> KES 210</span>
                <span><Clock3 aria-hidden="true" /> 25 min</span>
                <span><ChefHat aria-hidden="true" /> Serves 4</span>
                <span className="text-[#5d7c28] [&>svg]:text-[#6d9a2e]"><Check aria-hidden="true" /> Pantry match</span>
              </div>
            </div>
          </div>
          <div className="absolute right-[-12px] top-40 z-[2] w-[170px] rotate-[8deg] rounded-[20px] bg-white p-[18px] shadow-[0_15px_36px_rgb(43_25_30_/_18%)] max-[1050px]:right-[-10px] max-[1050px]:w-[145px] max-[1050px]:p-3.5 max-[760px]:right-[-4px] max-[760px]:top-[132px] max-[480px]:top-[106px] max-[480px]:w-[120px] max-[480px]:p-3">
            <span className="grid size-[46px] place-items-center rounded-full bg-[#f4f5ec] text-[#596238] max-[480px]:size-9 [&>svg]:w-6">
              <ShoppingBasket aria-hidden="true" />
            </span>
            <p className="mt-[13px] text-[15px] leading-[1.35] max-[480px]:mt-2 max-[480px]:text-[11px]">You already<br />have 6 items</p>
            <strong className="mt-2 block text-[17px] font-medium leading-[1.35] max-[480px]:mt-[5px] max-[480px]:text-[13px]">Only 3 things<br />to buy</strong>
          </div>
          <Leaf className="absolute bottom-[52px] right-[-30px] z-[2] size-11 -rotate-[35deg] text-[#496529] drop-shadow-[0_4px_3px_rgb(25_45_17_/_25%)] max-[480px]:hidden" aria-hidden="true" />
          <Leaf className="absolute bottom-[-4px] right-8 z-[2] size-11 rotate-[22deg] text-[#496529] drop-shadow-[0_4px_3px_rgb(25_45_17_/_25%)] max-[480px]:hidden" aria-hidden="true" />
        </div>
      </section>

      <section className={`${contentWidth} pb-[58px] pt-7 max-[760px]:pt-2.5`} aria-labelledby="situations-title">
        <div className="text-center">
          <h2 id="situations-title" className="font-display text-[39px] font-medium leading-[1.1] tracking-[-.025em] text-[#651739] max-[760px]:text-[34px]">
            Whatever today looks like.
          </h2>
          <p className="mt-2 text-sm text-[#4f4749]">Tight budgets, little time, or not knowing what to cook—BiteWise meets you there.</p>
        </div>
        <div className="mt-7 grid grid-cols-4 gap-[18px] max-[1050px]:grid-cols-2 max-[480px]:grid-cols-1 max-[480px]:gap-3">
          {situationCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                href="/onboarding"
                key={card.title}
                className={`relative grid min-h-[177px] grid-cols-[55px_1fr] gap-4 rounded-[14px] border border-[rgb(105_67_73_/_8%)] px-5 pb-[18px] pt-[22px] transition-[transform,box-shadow] duration-180 hover:-translate-y-[3px] hover:shadow-[0_12px_28px_rgb(73_36_45_/_10%)] max-[1050px]:min-h-[155px] max-[480px]:min-h-[145px] ${card.cardClassName}`}
              >
                <span className={`grid size-[55px] place-items-center rounded-full text-white [&>svg]:size-[27px] ${card.iconClassName}`}>
                  <Icon aria-hidden="true" />
                </span>
                <div>
                  <h3 className="mt-[9px] font-display text-lg font-semibold">{card.title}</h3>
                  <p className="mt-[5px] text-xs text-[#51494b]">{card.detail}</p>
                </div>
                <strong className="col-span-full self-end border-t border-[rgb(58_45_48_/_15%)] pt-[15px] text-sm font-semibold">{card.result}</strong>
                <ArrowRight aria-hidden="true" className="absolute bottom-[18px] right-[18px] w-[18px]" />
              </Link>
            );
          })}
        </div>
      </section>

      <section id="how-it-works" className={`${contentWidth} pb-[52px] pt-1.5`} aria-labelledby="journey-title">
        <div className="text-center">
          <h2 id="journey-title" className="font-display text-[39px] font-medium leading-[1.1] tracking-[-.025em] text-[#651739] max-[760px]:text-[34px]">
            From decision to dinner.
          </h2>
          <p className="mt-2 text-sm text-[#4f4749]">BiteWise helps you go from deciding what to eat to getting dinner on the table.</p>
        </div>
        <ol className="mx-auto mt-[22px] grid max-w-[760px] grid-cols-4">
          {journeySteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.label} className="relative grid justify-items-center gap-[7px] text-xs">
                <span className="grid size-[58px] place-items-center rounded-full border border-[#eccdaf] bg-[#fff8f2] text-[#6a173a] max-[480px]:size-[49px] [&>svg]:size-[26px] max-[480px]:[&>svg]:size-[22px]">
                  <Icon aria-hidden="true" />
                </span>
                <strong>{step.label}</strong>
                {index < journeySteps.length - 1 && (
                  <ArrowRight
                    className="absolute left-[calc(50%+49px)] top-[22px] h-[15px] w-[calc(100%-98px)] text-[#8d8587] [stroke-dasharray:3_5] max-[480px]:left-[calc(50%+37px)] max-[480px]:top-[17px] max-[480px]:w-[calc(100%-74px)]"
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ol>
        <div className="mx-auto mt-[26px] grid max-w-[980px] grid-cols-3 max-[760px]:max-w-[510px] max-[760px]:grid-cols-1 max-[760px]:gap-[18px]">
          <article className="flex items-center gap-3.5 border-r border-[#ddd3d5] px-[34px] max-[1050px]:px-[18px] max-[760px]:border-r-0 max-[760px]:px-5">
            <span className="grid size-[52px] shrink-0 place-items-center rounded-full border-[1.5px] border-[#b77915] text-[#b77915] [&>svg]:size-[26px]"><Coins aria-hidden="true" /></span>
            <div><h3 className="font-display text-base font-semibold">Spend smarter</h3><p className="mt-[3px] text-[11px] leading-[1.5] text-[#534b4d]">Meals that fit your budget without the guesswork.</p></div>
          </article>
          <article className="flex items-center gap-3.5 border-r border-[#ddd3d5] px-[34px] max-[1050px]:px-[18px] max-[760px]:border-r-0 max-[760px]:px-5">
            <span className="grid size-[52px] shrink-0 place-items-center rounded-full border-[1.5px] border-[#6a9436] text-[#6a9436] [&>svg]:size-[26px]"><PackageCheck aria-hidden="true" /></span>
            <div><h3 className="font-display text-base font-semibold">Use more of what you have</h3><p className="mt-[3px] text-[11px] leading-[1.5] text-[#534b4d]">Smarter ideas that reduce waste and save money.</p></div>
          </article>
          <article className="flex items-center gap-3.5 px-[34px] max-[1050px]:px-[18px] max-[760px]:px-5">
            <span className="grid size-[52px] shrink-0 place-items-center rounded-full border-[1.5px] border-[#681039] text-[#681039] [&>svg]:size-[26px]"><Heart aria-hidden="true" /></span>
            <div><h3 className="font-display text-base font-semibold">Cook with confidence</h3><p className="mt-[3px] text-[11px] leading-[1.5] text-[#534b4d]">Clear guidance for meals your people will love.</p></div>
          </article>
        </div>
      </section>

      <section
        className="relative mx-auto min-h-[190px] w-[min(calc(100%_-_40px),1240px)] overflow-hidden rounded-2xl text-white max-[1050px]:w-[min(calc(100%_-_48px),920px)] max-[760px]:w-full max-[760px]:rounded-none"
        aria-labelledby="final-cta-title"
      >
        <Image src="/images/recipes/githeri.webp" alt="" fill sizes="100vw" className="object-cover object-[center_52%]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(75_8_40_/_96%)_16%,rgb(86_11_47_/_87%)_55%,rgb(39_10_22_/_48%))]" />
        <div className="relative z-[1] grid min-h-[190px] place-content-center justify-items-center text-center max-[480px]:px-[18px] max-[480px]:py-[30px]">
          <h2 id="final-cta-title" className="font-display text-[34px] font-medium max-[480px]:text-[30px] max-[480px]:leading-[1.05]">
            Your next meal doesn’t need to be a guess.
          </h2>
          <p className="mt-[5px] text-base">Tell BiteWise what today looks like.</p>
          <div className="mt-[17px] flex items-center gap-[30px] max-[480px]:w-full max-[480px]:flex-col max-[480px]:gap-[15px]">
            <Button
              asChild
              size="lg"
              className="min-w-[260px] border border-[rgb(255_255_255_/_36%)] bg-[#fff7f9] text-[#5b1733] shadow-[0_8px_18px_rgb(29_9_15_/_25%)] hover:bg-[#f1e4e7] hover:text-[#4b102a] max-[480px]:w-[min(100%,290px)] max-[480px]:min-w-0"
            >
              <Link href="/onboarding">Find my next meal</Link>
            </Button>
            <Link href="/discover" className="inline-flex items-center gap-2 font-semibold text-[#f4dce5] hover:text-white [&>svg]:w-[19px]">
              Browse recipes <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
