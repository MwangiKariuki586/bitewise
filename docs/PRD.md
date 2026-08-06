# PRD – BiteWise

**App Name:** BiteWise

## 1. Product Vision

BiteWise is a personal food decision and meal-planning assistant that helps users decide what to eat based on their real-life circumstances.

Instead of only providing recipes, BiteWise considers each user’s:

- Available budget
- Ingredients at home
- Number of people being served
- Cooking time
- Available equipment
- Dietary preferences and restrictions
- Health and wellness goals

The app recommends affordable and practical meals, estimates preparation costs, suggests cheaper ingredient alternatives, and explains why each meal fits the user’s situation.

Users can create weekly meal plans, generate shopping lists, track pantry items and leftovers, and receive suggestions that prioritise ingredients likely to expire. The system adjusts future recommendations based on meals the user likes, dislikes, or has recently eaten.

Each meal includes written instructions and a **Watch & Cook** option. Users can search for relevant tutorial videos using queries such as “soft chapati tutorial,” “quick githeri recipe,” or “pilau without an oven.” Videos can be filtered by language, cooking time, skill level, equipment, and dietary needs.

**Core journey:**  
Decide what to eat → Confirm it fits the budget → Buy missing ingredients → Watch the tutorial → Cook step by step.

**Initial focus:** Affordable local meals, especially for Kenyan users, with support for local ingredients, KES-based budgets, common cooking equipment, and familiar dishes.

**Core product promise:**  
Meals that fit your budget, ingredients, health needs and lifestyle.

## 2. Target Users

- Kenyan individuals and families who cook at home
- Budget-conscious users
- People with limited time, equipment, or specific dietary/health needs
- Users who want practical suggestions rather than fancy recipes

## 3. Main App Areas

| Area           | Purpose                                        |
| -------------- | ---------------------------------------------- |
| **Eat Now**    | Immediate meal recommendations                 |
| **Meal Plan**  | Weekly meal planning                           |
| **Discover**   | Recipes + tutorial videos                      |
| **Cook**       | Guided preparation (written + Watch & Cook)    |
| **My Kitchen** | Pantry, leftovers, saved meals, shopping lists |

## 4. Core Features (MVP)

### 4.1 User Profile & Constraints

- Budget (daily/weekly in KES)
- Number of people to serve
- Available cooking time
- Available equipment (jiko, gas cooker, oven, microwave, blender, etc.)
- Dietary preferences & restrictions
- Health & wellness goals
- Preferred local dishes / cuisines

### 4.2 Eat Now

- Ranked meal suggestions that respect all current constraints
- Estimated cost in KES
- Explanation of why the meal fits
- Cheaper ingredient alternatives
- Missing ingredients list
- Like / Dislike / Mark as recently eaten

### 4.3 Meal Plan

- Generate or manually build a weekly plan
- One-click shopping list generation
- Ability to swap individual meals

### 4.4 My Kitchen

- Pantry inventory (with quantities and expiry dates)
- Leftovers tracking
- Saved / favourite meals
- Shopping lists
- Expiry-aware recommendations

### 4.5 Discover

- Search and browse recipes
- Filters: time, equipment, diet, cost, local ingredients
- Watch & Cook video search with rich filters (language, skill level, etc.)

### 4.6 Cook Mode

- Step-by-step written instructions
- Embedded / linked tutorial videos
- Scale recipe to number of people
- Mark steps as done

### 4.7 Personalisation

- Learns from likes, dislikes and recently eaten meals
- Prioritises ingredients about to expire
- Suggests cheaper alternatives when budget is tight

## 5. Non-Functional Requirements

- Secure (auth + RLS + Zod validation)
- Fast and responsive on mobile
- Efficient querying, smart caching, and rate limiting
- Affordable to run on Supabase
- Scalable
- Accessibility-friendly

## 6. Out of Scope for MVP

- Social features
- Multi-language UI (English first)
- Advanced calorie tracking
- Grocery delivery integration
- AI-generated meal images

## 7. Definition of Done (Whole App)

- All core flows work end-to-end
- Agent has written and passed tests after every feature
- Typecheck, lint and build pass
- Proper caching, rate limiting and efficient data access are implemented
- Mobile-responsive UI with shadcn/ui
- Security baseline (auth + RLS + validation) is solid
