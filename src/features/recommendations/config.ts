export const recommendationScoringProfile = {
  version: "eat-now-v2",
  weights: {
    pantryCoverage: 30,
    expiringFood: 20,
    budgetHeadroom: 15,
    preferenceMatch: 15,
    timeHeadroom: 10,
    liked: 6,
    saved: 8,
    eatenWithinSevenDays: 20,
    eatenWithinFourteenDays: 10,
  },
  shortlist: {
    size: 5,
    maximumSimilarityPenalty: 12,
    similarityWeights: {
      ingredients: 0.6,
      cuisine: 0.25,
      mealTypes: 0.15,
    },
  },
} as const;

export type RecommendationScoringVersion =
  typeof recommendationScoringProfile.version;
