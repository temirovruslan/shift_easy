import { z } from "zod";

export const siteSchema = z.object({
  name: z.string().min(4, "Name should be longer than 4"),
  address: z.string().min(4, "Address should be longer than 4"),
});
