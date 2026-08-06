interface AuthErrorLike {
  code?: string;
  status?: number;
}

export function isEmailSendRateLimit(error: AuthErrorLike) {
  return error.status === 429 || error.code === "over_email_send_rate_limit";
}

export const emailSendRateLimitMessage =
  "Confirmation emails are temporarily limited. Please wait up to an hour before trying again.";
