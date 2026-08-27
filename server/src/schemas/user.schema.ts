import { z } from "zod";
import { password } from "./common";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

export const changePasswordSchema = z.object({
  // Only proof of identity, so the registration rule does not apply: an
  // account created before the rule existed must still be able to pass it.
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: password,
});

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordSchema>;
