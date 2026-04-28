/**
 * Central place for API limits and configurable constants.
 * Import from here rather than inlining magic numbers in route handlers.
 */
export const API_LIMITS = {
  /** Maximum allowed length for a user-supplied goal string. */
  goalMaxChars: 500,
  /** Claude max_tokens for interview question generation. */
  interviewMaxTokens: 1500,
  /** Claude max_tokens for prompt synthesis (streaming). */
  synthesizeMaxTokens: 2048,
  /** Daily prompt generation limit for the free tier. */
  freeDailyLimit: 10
} as const
