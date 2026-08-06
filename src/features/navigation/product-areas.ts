import {
  ChefHat,
  Compass,
  CookingPot,
  Refrigerator,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

interface ProductArea {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export const productAreas: ProductArea[] = [
  {
    label: "Eat Now",
    href: "/eat-now",
    icon: Sparkles,
    description: "A practical meal for right now",
  },
  {
    label: "Meal Plan",
    href: "/meal-plan",
    icon: CookingPot,
    description: "Shape a calmer week of meals",
  },
  {
    label: "Discover",
    href: "/discover",
    icon: Compass,
    description: "Explore local recipes and ideas",
  },
  {
    label: "Cook",
    href: "/cook",
    icon: ChefHat,
    description: "Cook confidently, one step at a time",
  },
  {
    label: "My Kitchen",
    href: "/my-kitchen",
    icon: Refrigerator,
    description: "Use what you have before it goes to waste",
  },
];
