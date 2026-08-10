"use client";

import { useMemo, useState } from "react";
import { ExternalLink, PlayCircle, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { dietaryOptions, equipmentOptions } from "@/features/profile/options";
import {
  buildYouTubeTutorialSearchUrl,
  tutorialLanguages,
  type TutorialLanguage,
} from "@/features/watch-cook/youtube-search";

interface WatchCookPanelProps {
  recipeName: string;
  recipeMinutes: number;
  recipeSkill: "easy" | "moderate";
  suggestedEquipment: string[];
  dietaryTags: string[];
}

const selectClassName = "h-12 w-full rounded-xl border border-input bg-background px-3.5 text-sm shadow-sm outline-none transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/25";

export function WatchCookPanel({
  recipeName,
  recipeMinutes,
  recipeSkill,
  suggestedEquipment,
  dietaryTags,
}: WatchCookPanelProps) {
  const [language, setLanguage] = useState<TutorialLanguage>("english");
  const [maxMinutes, setMaxMinutes] = useState(
    Math.min(120, Math.max(10, Math.ceil(recipeMinutes / 5) * 5)),
  );
  const [skill, setSkill] = useState<"easy" | "moderate">(recipeSkill);
  const [equipment, setEquipment] = useState(suggestedEquipment[0] ?? "");
  const [selectedDietary, setSelectedDietary] = useState<string[]>(dietaryTags);

  const searchUrl = useMemo(
    () =>
      buildYouTubeTutorialSearchUrl({
        recipeName,
        language,
        maxMinutes,
        skill,
        equipment: equipment || undefined,
        dietaryTerms: selectedDietary,
      }),
    [equipment, language, maxMinutes, recipeName, selectedDietary, skill],
  );

  function toggleDietary(value: string) {
    setSelectedDietary((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  return (
    <Card className="overflow-hidden bg-card shadow-[0_22px_65px_-42px_rgba(24,64,45,0.8)]">
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
        <div>
          <Badge className="bg-accent/20 text-accent-foreground"><PlayCircle className="mr-2 size-4" aria-hidden="true" />Watch & Cook</Badge>
          <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Find a tutorial that fits your kitchen.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Choose the tutorial details that matter, then open a focused YouTube search in a new tab. The BiteWise interface remains in English.</p>
          <div className="mt-5 rounded-2xl bg-background/75 p-4 ring-1 ring-border/60">
            <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />BiteWise creates the search phrase only. It has not reviewed or endorsed individual videos in the results.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tutorial-language">Tutorial language</Label>
            <select id="tutorial-language" value={language} onChange={(event) => setLanguage(event.target.value as TutorialLanguage)} className={selectClassName}>
              {tutorialLanguages.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tutorial-time">Maximum video time</Label>
            <select id="tutorial-time" value={maxMinutes} onChange={(event) => setMaxMinutes(Number(event.target.value))} className={selectClassName}>
              {[10, 15, 20, 30, 45, 60, 90, 120].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes or less</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tutorial-skill">Skill level</Label>
            <select id="tutorial-skill" value={skill} onChange={(event) => setSkill(event.target.value as "easy" | "moderate")} className={selectClassName}>
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tutorial-equipment">Equipment</Label>
            <select id="tutorial-equipment" value={equipment} onChange={(event) => setEquipment(event.target.value)} className={selectClassName}>
              <option value="">No equipment term</option>
              {equipmentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <fieldset className="space-y-2 sm:col-span-2">
            <legend className="text-sm font-medium">Dietary search terms</legend>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map((option) => (
                <label key={option.value} className="cursor-pointer">
                  <input
                    className="peer sr-only"
                    type="checkbox"
                    value={option.value}
                    checked={selectedDietary.includes(option.value)}
                    onChange={() => toggleDietary(option.value)}
                  />
                  <span className="flex min-h-10 items-center rounded-full bg-background px-3 text-xs font-bold ring-1 ring-border transition-colors peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring">{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <Button asChild size="lg" className="min-h-12 sm:col-span-2">
            <a href={searchUrl} target="_blank" rel="noreferrer">Search YouTube tutorials<ExternalLink className="size-4" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
          </Button>
        </div>
      </div>
    </Card>
  );
}
