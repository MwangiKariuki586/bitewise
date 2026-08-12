interface AuthErrorLike {
  code?: string;
  status?: number;
}

type AuthOperation = "sign-in" | "sign-up" | "update-password";

export function isEmailSendRateLimit(error: AuthErrorLike) {
  return error.status === 429 || error.code === "over_email_send_rate_limit";
}

export const emailSendRateLimitMessage =
  "Confirmation emails are temporarily limited. Please wait up to an hour before trying again.";

const requestLimitMessage =
  "Too many requests were made. Please wait a few minutes before trying again.";

export function authErrorMessage(
  error: AuthErrorLike,
  operation: AuthOperation,
) {
  if (isEmailSendRateLimit(error)) return emailSendRateLimitMessage;
  if (error.status === 429 || error.code === "over_request_rate_limit") {
    return requestLimitMessage;
  }
  if (error.code === "request_timeout") {
    return "The request took too long. Check your connection and try again.";
  }

  if (operation === "sign-in") {
    if (error.code === "invalid_credentials") {
      return "The email or password is incorrect. Check both and try again.";
    }
    if (error.code === "email_not_confirmed") {
      return "Confirm your email before signing in. Check your inbox or request a new confirmation email.";
    }
    if (error.code === "user_banned") {
      return "This account cannot sign in right now. Please try again later.";
    }
    return "Sign-in is temporarily unavailable. Please try again.";
  }

  if (operation === "sign-up") {
    if (error.code === "email_exists" || error.code === "user_already_exists") {
      return "An account already uses this email. Sign in or reset your password instead.";
    }
    if (error.code === "weak_password") {
      return "Choose a stronger password and try again.";
    }
    if (error.code === "email_address_invalid") {
      return "This email address cannot be used. Check it or use another address.";
    }
    if (error.code === "email_address_not_authorized") {
      return "Confirmation email cannot be sent to this address yet. Please use an allowed address or try again later.";
    }
    if (error.code === "email_provider_disabled") {
      return "Email registration is temporarily unavailable. Please try again later.";
    }
    return "Your account could not be created right now. Please try again.";
  }

  if (error.code === "same_password") {
    return "Choose a password you have not used for this account.";
  }
  if (error.code === "weak_password") {
    return "Choose a stronger password and try again.";
  }
  return "Your password could not be updated right now. Please try again.";
}
