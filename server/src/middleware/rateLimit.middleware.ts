import rateLimit from "express-rate-limit";

const MINUTE = 60 * 1000;

const message = {
  success: false,
  message: "Too many requests. Please try again later.",
};

/**
 * Everything under /api/auth. Wide enough that no real person meets it, and
 * narrow enough to stop a script working through a list.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message,
});

/**
 * Password guessing. Ten attempts per quarter hour leaves room for someone
 * mistyping their own password and no room for working through a wordlist.
 */
export const credentialsLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message,
  // A wrong password is what we are counting; a successful sign-in should not
  // bring the user closer to being locked out.
  skipSuccessfulRequests: true,
});

/**
 * Endpoints that answer questions about an email address. `check-email` says
 * outright whether an address is registered — the register form needs that,
 * but only a handful of times per person. `forgot-password` also sends mail,
 * so an unlimited version is a way to use us to spam someone else's inbox.
 */
export const emailLookupLimiter = rateLimit({
  windowMs: 60 * MINUTE,
  limit: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message,
});
