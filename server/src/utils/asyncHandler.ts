import { Request, Response, NextFunction, RequestHandler } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { ParsedQs } from "qs"

// [1]
type AsyncFn<P, ResBody, ReqBody, ReqQuery> = (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction,
) => Promise<unknown>

// [2]
const asyncHandler = <
    P = ParamsDictionary,
    ResBody = any,
    ReqBody = any,
    ReqQuery = ParsedQs,
>(
    fn: AsyncFn<P, ResBody, ReqBody, ReqQuery>,
): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
    return (req, res, next) => {
        fn(req, res, next).catch(next) // [3]
    }
}

export default asyncHandler

// ─── NOTES ───────────────────────────────────────────────────────────────────
//
// [1] WHY THE GENERICS:
//     the old signature was `(req: Request, ...)`, which pins every wrapped
//     controller to Express's default params type. A controller could declare
//     `Request<{ id: string }>` all it liked — passing it through asyncHandler
//     threw that away, so `req.params.id` stayed `string | string[]` and no
//     route contract was ever type checked.
//
//     carrying P/ResBody/ReqBody/ReqQuery through means the wrapper is now
//     transparent: whatever the controller declares survives the wrapping, and
//     a route whose path stops matching the controller's params fails to
//     compile instead of failing at runtime.
//
// [2] WHY THIS EXISTS:
//     every controller talks to the DB — which can fail. when it fails,
//     you need to catch the error and pass it to the global error handler.
//     without asyncHandler you write try/catch in every controller (20+ times).
//     asyncHandler does it once for everyone.
//
//     WITHOUT (repeated 20 times across the app):
//       const startShift = async (req, res, next) => {
//           try {
//               const shift = await Shift.create(...)
//               res.json(shift)
//           } catch (err) {
//               next(err) // ← manually written every time
//           }
//       }
//
//     WITH (try/catch gone, asyncHandler handles it):
//       const startShift = asyncHandler(async (req, res, next) => {
//           const shift = await Shift.create(...)
//           res.json(shift) // if this throws, asyncHandler catches it for you
//       })
//
// [3] HOW IT CATCHES:
//     fn(req, res, next)        → runs your controller, returns a Promise
//     .catch(next)              → if that Promise fails, sends error to
//                                 the global error handler in app.ts automatically
//
// USAGE IN ROUTES:
//   router.post('/shifts/start', asyncHandler(startShift))
//   router.post('/auth/login',   asyncHandler(login))
//   router.get('/workers',       asyncHandler(getWorkers))
// ─────────────────────────────────────────────────────────────────────────────