import { z } from "zod";

/**
 * Environment the HTTP application needs in order to start.
 *
 * Parsed once, at import. A missing or malformed value fails the process
 * immediately with the name of the variable, instead of surfacing later as a
 * request that behaves strangely — an empty JWT_SECRET, for instance, used to
 * produce tokens that simply never verified.
 *
 * Values the database connection needs are validated in config/connect.ts, so
 * a process that only serves HTTP is not forced to declare database settings.
 */
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  // Signs and verifies auth tokens. Short secrets are the reason JWT
  // implementations get broken, so a floor is enforced here rather than
  // trusted to whoever fills in the .env file.
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("90d"),

  // Where the web client lives. Used for CORS and for the links inside invite
  // and password reset emails.
  CLIENT_URL: z.string().url(),

  // Additional allowed origins, comma separated. Local development ports used
  // to be hard coded into the source, which meant a new environment needed a
  // code change and a redeploy.
  CORS_ORIGINS: z
    .string()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  // How many proxies sit in front of the API. Render adds one. This decides
  // which address the rate limiters count, so it is deliberately explicit.
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),

  BREVO_API_KEY: z.string().min(1),

  // The address invite and reset mail is sent from. Brevo refuses to send on
  // behalf of an address it has not verified, so this changes per environment.
  EMAIL_FROM: z.string().email().default("noreply@shifteasy.site"),

  // Advertised in the API documentation as the server to try requests
  // against. Hardcoded to localhost in the OpenAPI file before, which made
  // the published docs point at the reader's own machine.
  PUBLIC_API_URL: z.string().url().default("http://localhost:5000"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const problems = Object.entries(parsed.error.flatten().fieldErrors)
    .map(([key, errors]) => `  ${key}: ${errors?.join(", ")}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${problems}`);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
