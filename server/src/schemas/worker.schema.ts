import { z } from "zod";

export const workerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  occupation: z.string().min(2, "Occupation is required"),
});
