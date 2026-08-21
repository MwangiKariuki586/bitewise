# Recommendation Engine POC

This proof of concept uses the existing Supabase development project and the
real BiteWise UI. It does not require a paid recommendation, analytics, vector,
queue, or AI service.

## 1. Seed the disposable account

Confirm that `.env` targets a development or staging project, then run:

```powershell
npm.cmd run poc:recommendations -- seed --allow-hosted
```

The command replaces only `bitewise-recommendations-poc@example.com`, creates a
strong temporary password, and prints it once. It seeds:

- a completed four-person profile with a KES 750 daily budget;
- eight pantry ingredients, including kale and tomatoes expiring soon;
- a like for Classic Githeri;
- a saved Ugali with Sukuma Wiki;
- a dislike for Matoke Beef Stew;
- a recent Chapati with Bean Stew meal.

Use `--password=YourStrongPassword` if a stable password is needed for a demo.
The password must have at least 12 characters with uppercase, lowercase,
numeric, and symbol characters. Never use a real user's password.

## 2. Exercise the real product

Start BiteWise and sign in with the printed credentials:

```powershell
npm.cmd run dev
```

Open `/eat-now`, keep the seeded defaults, and select **Find meals that fit**.
Confirm that five unique meals appear with pantry, budget, time, and preference
reasons. Matoke Beef Stew must not appear because it is disliked.

Open one result and use Like or Save. Return to Eat Now, dislike one visible
meal, then refresh the matches. The disliked meal should disappear from the
new shortlist.

For an automated UI exercise, keep the development server running and use the
password printed by the seed command:

```powershell
npm.cmd run poc:recommendations -- exercise --allow-hosted --password="YourStrongPassword"
```

This signs in through the real form, creates a five-meal run, opens a recipe,
dislikes a visible result, refreshes the constraints, confirms the disliked
meal disappears, and leaves both runs available to the verifier.

## 3. Verify stored evidence

```powershell
npm.cmd run poc:recommendations -- verify --allow-hosted
```

A passing report proves that:

- the seed profile and all baseline signals exist;
- the UI created an `eat-now-v2` recommendation run;
- the run contains five unique ordered meals;
- the pre-seeded disliked meal was excluded;
- impressions were recorded for the shortlist;
- the automated detail open and dislike were attributed to their originating
  run; manual likes, saves, and other actions appear in the same event summary;
- when two runs exist, the report lists recipes added and removed between them.

The verifier exits with code `2` when the seed is ready but the UI has not
generated a list yet, and code `1` when evidence exists but a required check
fails.

An impression count can exceed the shortlist size after returning from recipe
details because displaying the same persisted shortlist again is another real
impression. Recipe uniqueness is checked on the stored shortlist, not by event
count.

## 4. Remove the POC

```powershell
npm.cmd run poc:recommendations -- cleanup --allow-hosted
```

Cleanup deletes only the named disposable Auth account. Its profile, pantry,
personalisation, recommendation runs, shortlist items, and events are removed
through the existing foreign-key cascades.
