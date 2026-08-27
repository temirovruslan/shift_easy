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
