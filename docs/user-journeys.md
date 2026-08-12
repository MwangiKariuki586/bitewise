# BiteWise User Journeys

## Purpose

These journeys define how BiteWise will be evaluated against its core promise:

> Meals that fit your budget, ingredients, health needs and lifestyle.

They are not a restatement of the milestone list. They connect the implemented
features into outcomes a person should be able to achieve from beginning to end.
The next product audit should assess these journeys in the running app at mobile
and desktop widths, using realistic user data and the hosted development database.

## Evaluation principles

Every primary journey must answer five questions:

1. **Fit:** Does BiteWise respect the user's budget, pantry, household, time,
   equipment, dietary requirements, and health preferences?
2. **Trust:** Can the user understand the recommendation, its estimated cost,
   and any assumptions or price limitations?
3. **Continuity:** Can the user move from deciding to planning, buying, and
   cooking without re-entering or reconstructing the same decision?
4. **Recovery:** When no meal fits or an action fails, does BiteWise preserve
   hard constraints and offer a useful next move?
5. **Learning:** Do pantry changes, feedback, saved meals, and cooking history
   improve later recommendations in a way the user can notice?

Dietary requirements are hard constraints. A journey fails if BiteWise silently
relaxes them to produce a result. The current product models health selections as
goals and ranking preferences, not medical restrictions; the audit must ensure
that the interface never presents those signals as a clinical safety guarantee.

## Journey architecture

```text
Discover BiteWise
      |
      v
Create account / sign in --> Complete or resume food profile
      |                                |
      +--------------------------------+
                       |
                       v
        Keep kitchen reality current
          pantry | expiry | leftovers
                       |
          +------------+-------------+
          |                          |
          v                          v
   Decide with Eat Now       Build a weekly plan
          |                          |
          v                          v
 Confirm fit and gaps       Generate shopping list
          |                          |
          +------------+-------------+
                       |
                       v
             Get ingredients / choose
                       |
                       v
             Cook, pause, and finish
                       |
                       v
          Save feedback and meal history
                       |
                       +----> Better next decision
```

## Journey catalogue

| ID | Priority | Journey | Primary user need | Successful outcome |
| --- | --- | --- | --- | --- |
| J1 | P0 | First confident meal decision | "Help me choose something realistic now." | A new user receives and understands a safe, affordable shortlist. |
| J2 | P0 | Pantry-aware meal to cooked outcome | "Use what I have and tell me what is missing." | A returning user chooses a meal, resolves ingredient gaps, and starts cooking without rebuilding the decision. |
| J3 | P0 | Plan the week, shop once | "Help me feed the household within the weekly budget." | A complete plan becomes an accurate, pantry-adjusted shopping list. |
| J4 | P0 | Constraint-safe no-match recovery | "Do not ignore my needs just to show an answer." | The user gets specific, safe adjustments and can recover to a valid result. |
| J5 | P1 | Rescue expiring food and leftovers | "Help me use food before it is wasted." | Expiring pantry items and usable leftovers materially influence the next action. |
| J6 | P1 | Discover a meal and act on it | "Let me explore before I commit." | A guest can evaluate a recipe, then retain that choice through authentication into planning or cooking. |
| J7 | P1 | Guided cooking with interruption | "Guide me while I cook and remember my place." | The user scales, pauses, resumes, completes, and records a meal. |
| J8 | P1 | Recommendations improve over time | "Learn what works for me without trapping me in repetition." | Likes, dislikes, saves, and recent meals visibly change later ranking. |
| J9 | P2 | Account and profile recovery | "Let me get back in without losing progress." | The user can recover access and resume incomplete onboarding safely. |

## Detailed journeys

### J1 - First confident meal decision

**User:** A budget-conscious Kenyan home cook visiting BiteWise for the first
time, with a specific household, limited equipment, and at least one dietary or
health need.

**Trigger:** "What should we eat today?"

**Starting state:** Signed out, no BiteWise profile.

**Path:** `/` -> authentication -> `/onboarding` -> `/eat-now`

**Steps:**

1. Understand from the landing page that BiteWise is KES-first, pantry-aware,
   and designed for practical Kenyan kitchens.
2. Choose "Find my next meal" and create an account or sign in.
3. Enter budget period and amount, household size, normal cooking time, and a
   name.
4. Select available equipment.
5. Select dietary needs, health goals, preferred cuisines, and favourite dishes.
6. Finish setup and arrive at Eat Now with sensible defaults derived from the
   saved profile.
7. Adjust today's meal budget, servings, time, meal type, or available equipment
   without weakening saved dietary requirements.
8. Generate a shortlist and compare total cost, per-person cost, pantry match,
   missing ingredients, cheaper substitutions, and "why it fits" explanations.
9. Commit to one meal with confidence.

**Promise checks:**

- The budget default correctly translates daily or weekly budget into a meal
  allowance and is clearly explained.
- Household size, equipment, time, and dietary requirements survive the entire
  handoff from onboarding to Eat Now.
- Every displayed result satisfies the hard constraints.
- The user can explain why the top result ranked first.
- The route from the chosen recommendation to its next action is obvious.

**Failure and recovery states:** Invalid onboarding data, interrupted setup,
expired session, recommendation rate limit, recommendation service failure, and
an empty shortlist.

### J2 - Pantry-aware meal to cooked outcome

**User:** A returning user who has food at home and wants to minimise additional
spend tonight.

**Trigger:** "What can I make with what I already have?"

**Starting state:** Signed in with completed profile and a pantry containing
usable, expiring, and expired items.

**Path:** `/my-kitchen` -> `/eat-now` -> chosen recipe -> ingredient resolution
-> `/cook/[recipeId]`

**Steps:**

1. Add or update pantry quantities and expiry dates.
2. Open Eat Now and use today's actual budget, servings, time, and equipment.
3. Generate matches.
4. Confirm that expired stock is excluded, usable stock contributes to coverage,
   and soon-to-expire ingredients influence ranking and explanation.
5. Inspect which ingredients are covered, which are missing, and whether an
   approved cheaper substitution reduces the cost.
6. Choose one meal.
7. Resolve the missing-ingredient list through a shopping action or confirm that
   nothing needs to be bought.
8. Start Cook Mode for that same recipe and serving count.
9. Finish the meal and have the completion recorded for future variety.

**Promise checks:**

- Pantry coverage is quantity-aware, unit-aware, and expiry-aware.
- The displayed estimated cost and missing ingredients agree with the user's
  pantry state.
- The selected meal, serving count, and ingredient gaps carry into the next step.
- The user does not need to search for the chosen meal again.
- Cooking completion updates future recommendation history.

**Failure and recovery states:** Empty pantry, stale quantities, all pantry stock
expired, a price reference missing, a substitution unavailable, or the chosen
meal no longer fitting after a constraint change.

### J3 - Plan the week, shop once

**User:** A household planner trying to control a weekly food budget and reduce
last-minute decisions.

**Trigger:** "Plan breakfasts, lunches, and dinners for the household this week."

**Starting state:** Signed in with completed profile and representative pantry
stock.

**Path:** `/meal-plan` -> `/my-kitchen/shopping-list` -> recipe or Cook Mode

**Steps:**

1. Choose the intended week and understand the available weekly budget.
2. Generate a complete 21-slot week or build it manually.
3. Review estimated total, repeated meals, and per-slot servings.
4. Swap a meal, resize servings, remove a meal, and manually restore an open
   slot while remaining within hard constraints and budget.
5. Generate the shopping list.
6. Confirm that usable pantry quantities are subtracted, expired inventory is
   ignored, equivalent units are combined, and indicative totals remain clear.
7. Check purchased items, add a non-plan item, edit it, and regenerate without
   losing manual items or checked state.
8. Return to a planned meal and begin preparation.

**Promise checks:**

- The complete plan stays within the correct weekly budget.
- Meals fit saved dietary, equipment, time, and household constraints.
- The shopping list reconciles exactly with plan servings and pantry quantities.
- The user can trace a shopping-list item back to the meals that require it.
- Regeneration is predictable and preserves intentional user edits.

**Failure and recovery states:** No eligible meal for a slot, budget exceeded by
an edit, partial plan, empty plan, stale pantry after list generation, and
shopping-list generation failure.

### J4 - Constraint-safe no-match recovery

**User:** A person with a non-negotiable dietary requirement and a very tight
combination of budget, time, and equipment.

**Trigger:** A valid Eat Now request produces no matches.

**Starting state:** Signed in with at least one saved dietary restriction.

**Path:** `/eat-now` -> adjust situation -> regenerate

**Steps:**

1. Submit a deliberately restrictive but valid combination.
2. Receive an explicit no-match state rather than irrelevant meals.
3. Confirm that saved dietary requirements remain visible, fixed, and unchanged.
4. Understand which situational constraint is most useful to change: budget,
   time, equipment, or pantry information.
5. Make one suggested adjustment and regenerate.
6. Reach a valid shortlist or a truthful second no-match state.

**Promise checks:**

- No result violates a hard constraint.
- Suggestions are concrete, prioritised, and consistent with what the user can
  edit on the page.
- Previously entered values remain intact.
- A user can recover without returning to onboarding unless a saved default must
  genuinely change.

### J5 - Rescue expiring food and leftovers

**User:** A user with ingredients nearing expiry and a prepared meal with one or
more servings remaining.

**Trigger:** "What should I use before it goes bad?"

**Starting state:** Signed in, with a completed profile.

**Path:** `/my-kitchen` and `/my-kitchen/leftovers` -> `/eat-now` or direct reuse
action

**Steps:**

1. Record a pantry item with a near expiry date.
2. Record a custom or recipe-linked leftover with a use-by date and servings.
3. See both items grouped with the right urgency in My Kitchen.
4. Ask BiteWise what to eat now.
5. Receive a next action that prefers safe, soon-to-expire food over unnecessary
   new purchases.
6. Use, resize, or dismiss the leftover and see the kitchen state update.

**Promise checks:**

- Expired food is never recommended as usable inventory.
- Expiring food changes ranking or produces a clear reuse prompt.
- A recipe-linked leftover can be selected as a meal without pretending its
  ingredients are still raw pantry stock.
- Servings and use-by urgency are respected.
- The user can close the loop by consuming, updating, or deleting the leftover.

**Current implementation seam to validate:** Static source mapping confirms that
Eat Now ranking reads pantry items. The audit must verify whether leftovers have
any direct decision or recommendation handoff; if not, this journey is not yet
continuous despite leftover CRUD being complete.

### J6 - Discover a meal and act on it

**User:** A signed-out visitor exploring familiar local meals before deciding to
create an account.

**Trigger:** "Show me a practical chapati, githeri, pilau, or sukuma meal."

**Starting state:** Signed out.

**Path:** `/discover` -> `/recipes/[slug]` -> authentication -> original intended
action

**Steps:**

1. Search or filter by recipe name, local ingredient, cost, time, diet,
   equipment, cuisine, or skill.
2. Open a result and inspect total and per-serving cost, price date and location,
   ingredients, written method, and image attribution.
3. Configure a Watch & Cook tutorial search and understand that it opens
   external, unreviewed YouTube results.
4. Choose to save, plan, or cook the recipe.
5. Authenticate if required.
6. Return to the same recipe and intended action rather than a generic start
   screen.

**Promise checks:**

- Public discovery is genuinely useful before registration.
- Filters and displayed facts are mutually consistent.
- Authentication preserves the selected recipe and intent.
- "Open Meal Plan" carries the recipe into a slot-selection action, rather than
  merely opening a generic plan.
- The external tutorial handoff is transparent and does not imply endorsement.

### J7 - Guided cooking with interruption

**User:** A mobile user cooking in a real kitchen with wet hands, distractions,
and intermittent attention.

**Trigger:** The user has chosen a recipe and is ready to prepare it.

**Starting state:** Signed in with a completed profile.

**Path:** `/cook/[recipeId]` -> `/cook` -> `/cook/[recipeId]`

**Steps:**

1. Choose servings and start Cook Mode.
2. Verify that every ingredient quantity scales correctly.
3. Move one clear step at a time using large, accessible controls.
4. Mark steps done, move backward if needed, and optionally enable Screen Wake
   Lock.
5. Leave the session and return later.
6. Resume at the saved step with completed-step state intact.
7. Finish only after every step is complete.
8. Receive confirmation that the meal was recorded for personalisation.

**Promise checks:**

- Progress survives navigation and session interruption.
- Current step, total steps, completion state, and next action are always clear.
- The primary controls remain reachable above mobile navigation.
- Completion cannot be recorded accidentally or prematurely.
- Screen Wake Lock failure does not block cooking.

### J8 - Recommendations improve over time

**User:** A repeat user who wants variety without losing familiar favourites.

**Trigger:** The user reacts to a recommendation or completes a meal.

**Starting state:** Signed in, with a stable profile and enough eligible recipes
to observe ranking changes.

**Path:** recommendation or recipe detail -> feedback/save/eaten -> `/eat-now`
and `/meal-plan`

**Steps:**

1. Like one meal, dislike another, save a third, and complete or mark a meal as
   recently eaten.
2. Regenerate the same Eat Now request.
3. Confirm that the disliked meal is excluded, liked and saved meals receive a
   positive signal, and recently eaten meals move lower for variety.
4. Understand the changed ranking through concise explanations.
5. Open Saved Meals in My Kitchen and reuse a favourite.
6. Generate a weekly plan and confirm that the same personalisation rules apply.

**Promise checks:**

- Feedback has a visible, deterministic effect.
- Undo is available and takes effect immediately.
- Recent-meal penalties balance variety without permanently hiding favourites.
- Personal data never leaks across accounts.
- The app explains material ranking changes rather than appearing arbitrary.

### J9 - Account and profile recovery

**User:** A user with an unconfirmed account, forgotten password, expired session,
or partially completed onboarding.

**Trigger:** The user cannot reach a personalised journey.

**Starting state:** Signed out or signed in without a completed profile.

**Path:** authentication recovery -> `/onboarding?step=...` -> original protected
destination

**Steps:**

1. Receive a clear sign-in handoff from a protected route.
2. Resend confirmation or request password recovery without account enumeration.
3. Return through a valid email link and regain access.
4. Resume onboarding at the last incomplete step with saved values intact.
5. Complete setup and return to the originally intended journey.

**Promise checks:**

- Recovery messages are safe, specific enough to act on, and do not reveal
  whether an account exists.
- Rate limiting explains when and how to retry.
- Profile progress is preserved.
- Redirects do not lose the user's original intent.

## Promise coverage matrix

| Journey | Budget | Ingredients and waste | Health and diet | Lifestyle constraints | Plan / buy / cook continuity | Learning |
| --- | --- | --- | --- | --- | --- | --- |
| J1 First decision | Primary | Supporting | Primary | Primary | Entry point | Baseline |
| J2 Pantry to cook | Primary | Primary | Primary | Primary | Primary | Supporting |
| J3 Plan and shop | Primary | Primary | Primary | Primary | Primary | Supporting |
| J4 No-match recovery | Primary | Supporting | Primary | Primary | Recovery | Not applicable |
| J5 Rescue food | Supporting | Primary | Supporting | Supporting | Primary | Supporting |
| J6 Discover and act | Supporting | Supporting | Supporting | Primary | Primary | Supporting |
| J7 Guided cook | Not applicable | Supporting | Supporting | Primary | Primary | Primary |
| J8 Improve over time | Supporting | Supporting | Supporting | Supporting | Supporting | Primary |
| J9 Recover access | Not applicable | Not applicable | Not applicable | Supporting | Supporting | Not applicable |

## Cross-journey seams to test first

Static source and existing end-to-end coverage confirm that the individual
features exist. They also reveal several handoffs that must be tested explicitly
before claiming that the product promise works end to end:

1. **Recommendation to action:** Eat Now recommendation cards explain cost,
   pantry coverage, missing ingredients, substitutions, and personalisation, but
   the mapped card surface has no direct recipe-detail, plan, shopping, or Cook
   CTA.
2. **Eat Now to shopping:** The implemented shopping-list generator begins from
   Meal Plan. A single chosen Eat Now meal does not yet have a confirmed direct
   route to an actionable shopping list.
3. **Leftovers to decision:** Leftovers can be recorded and managed, while the
   mapped recommendation ranking path reads pantry items. The runtime audit must
   determine whether leftovers change the next meal decision at all.
4. **Discovery intent through authentication:** Public recipe pages link to Cook
   Mode and a generic Meal Plan route. The selected recipe and intended action
   must survive the authentication handoff.
5. **Planned meal to cooking:** Weekly plan and shopping-list flows are covered,
   but the path from a specific planned slot to its recipe or Cook Mode must be
   validated as one continuous task.

These are evaluation hypotheses, not final product findings. They should be
confirmed in the running application before fixes are prioritised.

## Evaluation order

Run the promise audit in this order:

1. **J1 + J2:** Prove the core "what should we eat?" decision and the path from
   recommendation to action.
2. **J3:** Prove weekly affordability and the plan-to-shopping reconciliation.
3. **J4:** Prove that safety and trust hold when no valid answer exists.
4. **J5:** Prove the waste-reduction promise, especially leftovers.
5. **J6 + J7:** Prove exploration and cooking continuity.
6. **J8:** Prove that the product gets better with use.
7. **J9:** Complete the resilience and release-readiness pass.

For every run, capture the starting data, viewport, each screen transition, the
user-visible evidence, any dead end or context loss, and the final outcome. Score
the journey separately for completion, constraint correctness, clarity, effort,
and confidence.
