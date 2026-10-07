/**
 * Universal Justdy credit pricing.
 *
 * These are usage prices, not dollar values.
 * Stripe remains the fiat payment gateway.
 */
export const AI_CREDIT_COSTS = {
  CHAT: 1,
  RESEARCH: 5,
  IMAGE: 5,
  VIDEO: 20,
  AUDIO: 10,
  DOCUMENT: 3,
  WORKSHEET: 5,
  WORKBOOK: 10,
  QUIZ: 3,
  LESSON_PLAN: 3,
  PRESENTATION: 8,
} as const;

export type AICreditOperation = keyof typeof AI_CREDIT_COSTS;
