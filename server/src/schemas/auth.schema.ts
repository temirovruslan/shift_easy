import { z } from 'zod'
import { password } from './common'

// WHY ZOD:
//   never trust what the client sends. Zod checks req.body
//   before any DB query runs. bad data → 400 immediately, nothing saved.

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password,
    companyName: z.string().min(2, 'Company name must be at least 2 characters'),
    siteName: z.string().min(2, 'Site name must be at least 2 characters'),
    siteAddress: z.string().min(5, 'Please enter a full address'),
})


export const loginSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(1, "Password is required"),
})

export const forgotPasswordSchema = z.object({
    email: z.string().email(),
})

// [5] the reset-password and activate pages send only { password } — the
//     "passwords match" check happens in the UI. This validates the password
//     itself server-side so a weak/missing one is rejected with a clean 400
//     instead of blowing up deeper in the request.
export const setPasswordSchema = z.object({
    password,
})

export type SetPasswordBody = z.infer<typeof setPasswordSchema>
export type TokenParam = { token: string }

// ─── NOTES ───────────────────────────────────────────────────────────────────

//
// USAGE:
//   const parsed = registerSchema.safeParse(req.body)
//   if (!parsed.success) throw new AppError('Invalid input', 400)
//   const { name, email, password } = parsed.data
// ─────────────────────────────────────────────────────────────────────────────