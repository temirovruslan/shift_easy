import { z } from "zod";

export const startShiftSchema = z.object({
  siteId: z.string().min(1, "Site is required"), // [1]
});

export const stopShiftSchema = z.object({
  notes: z.string().min(10, "Notes must be at least 10 characters"),
  materials: z.string().optional(),
});

// Derived from the schemas above so validation and types cannot drift apart.
export type StartShiftBody = z.infer<typeof startShiftSchema>;
export type StopShiftBody = z.infer<typeof stopShiftSchema>;




// * ─── NOTES ────────────────────────────────────────────────────────────────────
// [1]
// The worker sends the site's ID, not its name
// The ID is what the backend uses to find the site in MongoDB. 
// The name is just for display in the UI — the backend doesn't need it.