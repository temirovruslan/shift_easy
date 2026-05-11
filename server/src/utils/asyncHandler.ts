import { Request, Response, NextFunction } from "express"

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<any> 

// [2]
const asyncHandler = (fn: AsyncFn) => {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next) // [3]
    }
}

export default asyncHandler

// ─── NOTES ───────────────────────────────────────────────────────────────────
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