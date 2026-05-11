import { Request, Response, NextFunction } from "express"
import { ZodSchema } from "zod"

const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body) // [1]
        if (!result.success) {
            res.status(400).json({
                success: false,
                errors: result.error.flatten().fieldErrors, // [2]
            })
            return // [3]
        }
        req.body = result.data // [4]
        next()
    }
}

export default validate

// ─── NOTES ───────────────────────────────────────────────────────────────────
// WHY THIS EXISTS:
//   instead of calling schema.safeParse() manually in every controller,
//   you attach validate() as a middleware in the route.
//   it runs before the controller — bad data never reaches your logic.
//
// [1] safeParse — checks req.body against the schema. never throws.
//     returns { success: true, data: ... } or { success: false, error: ... }
//
// [2] .flatten().fieldErrors — formats errors by field so frontend gets:
//     { email: ['Invalid email'], password: ['Must be at least 8 chars'] }
//     each input box knows exactly what to show
//
// [3] return — stops here. controller never runs. no DB call made.
//
// [4] req.body = result.data — replaces raw input with clean validated data.
//     strips anything the client sent that wasn't in the schema.
//
// USAGE IN ROUTES:
//   router.post('/register', validate(registerSchema), asyncHandler(register))
//   router.post('/login',    validate(loginSchema),    asyncHandler(login))
// ─────────────────────────────────────────────────────────────────────────────