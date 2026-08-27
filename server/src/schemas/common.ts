import { isValidObjectId } from "mongoose";
import { z } from "zod";

/**
 * A MongoDB ObjectId that arrived from a client as a string.
 *
 * Without this check an id like "abc" reaches Mongoose, throws a CastError and
 * surfaces as a 500 — a client mistake reported as a server fault. Validating
 * it at the edge answers 400 with a field level message instead.
 */
export const objectId = z.string().refine(isValidObjectId, "Invalid id");

/**
 * The password policy, in one place.
 *
 * It used to be written out at each door that accepts a password, which is
 * how the change-password endpoint ended up with no policy at all: a user
 * could register under the rule and then step straight around it. Anything
 * that sets a password imports this.
 */
export const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/\d/, "Password must contain at least one number");
