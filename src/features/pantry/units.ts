export const pantryUnits = [
  { value: "g", label: "grams (g)" },
  { value: "kg", label: "kilograms (kg)" },
  { value: "ml", label: "millilitres (ml)" },
  { value: "l", label: "litres (l)" },
  { value: "piece", label: "pieces" },
  { value: "packet", label: "packets" },
  { value: "bunch", label: "bunches" },
  { value: "cup", label: "cups" },
  { value: "tbsp", label: "tablespoons" },
  { value: "tsp", label: "teaspoons" },
] as const;

export type PantryUnit = (typeof pantryUnits)[number]["value"];
