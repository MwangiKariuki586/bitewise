import { z } from "zod";

import {
  cuisineOptions,
  dietaryOptions,
  equipmentOptions,
} from "@/features/profile/options";

const optionValues = <TValue extends string>(
  options: readonly { value: TValue }[],
) => options.map(({ value }) => value) as [TValue, ...TValue[]];

const optionalText = (maximum: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() ? value.trim() : undefined),
    z.string().max(maximum).optional(),
  );

const optionalNumber = (minimum: number, maximum: number) =>
  z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.coerce.number().int().min(minimum).max(maximum).optional(),
  );

const stringArray = (value: unknown) => {
  if (Array.isArray(value)) return value;
  return value === undefined || value === "" ? [] : [value];
};

export const discoverSearchSchema = z.object({
  q: optionalText(100),
  ingredient: optionalText(100),
  maxMinutes: optionalNumber(5, 480),
  maxCostKes: optionalNumber(1, 1_000_000),
  equipment: z.preprocess(
    stringArray,
    z.array(z.enum(optionValues(equipmentOptions))).max(equipmentOptions.length),
  ),
  diet: z.preprocess(
    stringArray,
    z.array(z.enum(optionValues(dietaryOptions))).max(dietaryOptions.length),
  ),
  cuisine: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.enum(optionValues(cuisineOptions)).optional(),
  ),
  skill: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.enum(["easy", "moderate"]).optional(),
  ),
  page: z.preprocess(
    (value) => (value === undefined || value === "" ? 1 : value),
    z.coerce.number().int().min(1).max(100),
  ),
});

export type DiscoverSearchInput = z.infer<typeof discoverSearchSchema>;
