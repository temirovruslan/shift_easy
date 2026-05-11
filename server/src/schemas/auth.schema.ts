import { z } from 'zod'

// WHY ZOD:
//   never trust what the client sends. Zod checks req.body
//   before any DB query runs. bad data → 400 immediately, nothing saved.

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/\d/, 'Password must contain at least one number'),
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

export const resetPasswordSchema = z.object({
    password: z.string().min(8).regex(/\d/, "Password must contain at least one number"),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, { // [2]
    message: 'Passwords do not match',
    path: ['confirmPassword'], // [3]
})

export const activateSchema = resetPasswordSchema // [4]

// ─── NOTES ───────────────────────────────────────────────────────────────────

//
// [2] normally you check one field at a time — is email valid? is password long enough?
//     but here you need to check two fields against each other: do they match?
//     .refine() does that. it runs after all fields pass, then compares password vs confirmPassword.
//     if they don't match → user sees "Passwords do not match" on the screen immediately.
//     → "abc123" vs "abc999" → fails → error shows up, form doesn't submit
//
// [3] path: ['confirmPassword'] — pins the error to the confirmPassword input box.
//     you COULD do this manually with if (password !== confirmPassword) throw new AppError(...)
//     but then you get a general error with no field attached.
//     with path — frontend knows exactly which input to highlight red. no extra work needed.

// [4] activateSchema = same as resetPasswordSchema.
//     worker clicks invite link → sets password + confirm password. same rules, no need to rewrite.
//
// USAGE:
//   const parsed = registerSchema.safeParse(req.body)
//   if (!parsed.success) throw new AppError('Invalid input', 400)
//   const { name, email, password } = parsed.data
// ─────────────────────────────────────────────────────────────────────────────