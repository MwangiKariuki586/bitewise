export interface ProfileOption<TValue extends string = string> {
  value: TValue;
  label: string;
}

export const equipmentOptions = [
  { value: "gas_cooker", label: "Gas cooker" },
  { value: "electric_cooker", label: "Electric cooker" },
  { value: "jiko", label: "Jiko" },
  { value: "oven", label: "Oven" },
  { value: "microwave", label: "Microwave" },
  { value: "air_fryer", label: "Air fryer" },
  { value: "blender", label: "Blender" },
  { value: "pressure_cooker", label: "Pressure cooker" },
  { value: "refrigerator", label: "Refrigerator" },
] as const satisfies readonly ProfileOption[];

export const dietaryOptions = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "halal", label: "Halal" },
  { value: "gluten_free", label: "Gluten-free" },
  { value: "dairy_free", label: "Dairy-free" },
  { value: "nut_free", label: "Nut-free" },
] as const satisfies readonly ProfileOption[];

export const healthGoalOptions = [
  { value: "balanced_eating", label: "Balanced eating" },
  { value: "weight_management", label: "Weight management" },
  { value: "heart_health", label: "Heart health" },
  { value: "blood_sugar_support", label: "Blood sugar support" },
  { value: "high_protein", label: "More protein" },
  { value: "high_fibre", label: "More fibre" },
  { value: "low_sodium", label: "Lower sodium" },
] as const satisfies readonly ProfileOption[];

export const cuisineOptions = [
  { value: "kenyan", label: "Kenyan classics" },
  { value: "swahili_coast", label: "Swahili coast" },
  { value: "kikuyu", label: "Kikuyu" },
  { value: "luo", label: "Luo" },
  { value: "luhya", label: "Luhya" },
  { value: "kamba", label: "Kamba" },
  { value: "kisii", label: "Kisii" },
  { value: "indian_kenyan", label: "Indian-Kenyan" },
  { value: "ethiopian", label: "Ethiopian" },
  { value: "mediterranean", label: "Mediterranean" },
] as const satisfies readonly ProfileOption[];

export type Equipment = (typeof equipmentOptions)[number]["value"];
export type DietaryPreference = (typeof dietaryOptions)[number]["value"];
export type HealthGoal = (typeof healthGoalOptions)[number]["value"];
export type Cuisine = (typeof cuisineOptions)[number]["value"];
