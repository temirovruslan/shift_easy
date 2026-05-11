import { Request, Response, NextFunction } from 'express'
import AppError from '../errors/AppError'

const requireManager = (req: Request, res: Response, next: NextFunction) => { // [1]
    if (req.user?.role !== 'manager') { // [2]
        throw new AppError('Access denied. Managers only.', 403)
    }
    next() // [3]
}

export default requireManager

// ─── NOTES ───────────────────────────────────────────────────────────────────
// WHY THIS EXISTS:
//   protect confirms you are logged in.
//   requireManager confirms you are a manager.
//   both run together on manager-only routes — protect first, then this.
//  
// ! 401  Unauthorized — you're not logged in, we don't know who you are
// ! 403 Forbidden — we know exactly who you are, you just don't have permission

// [1] no asyncHandler needed — no DB call here, nothing async, can't throw unexpectedly.
//
// [2] req.user comes from protect middleware which ran just before this.
//     role is read from DB (via protect) — never from the token directly.
//     if role is not 'manager' → 403 forbidden, controller never runs.
//
// [3] role is 'manager' → let the request through to the controller.
//
// USAGE IN ROUTES:
//   router.post('/workers/invite', protect, requireManager, asyncHandler(inviteWorker))
//   router.get('/workers',         protect, requireManager, asyncHandler(getWorkers))
// ─────────────────────────────────────────────────────────────────────────────