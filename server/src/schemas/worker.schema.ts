import { z } from "zod";
import { objectId } from "./common";

export const workerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  occupation: z.string().min(2, "Occupation is required"),
  siteId: objectId.optional(),
});

// The create form owns the site link; editing a worker only changes their
// own details, so siteId is deliberately not accepted here.
export const updateWorkerSchema = workerSchema.omit({ siteId: true });

export const assignWorkersSchema = z.object({
  workerIds: z.array(objectId).min(1, "Select at least one worker"),
});

// Derived from the schemas above so validation and types cannot drift apart.
export type CreateWorkerBody = z.infer<typeof workerSchema>;
export type UpdateWorkerBody = z.infer<typeof updateWorkerSchema>;
export type AssignWorkersBody = z.infer<typeof assignWorkersSchema>;
