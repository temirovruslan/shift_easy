import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt.utils'
import User from '../models/User.model'

import asyncHandler from '../utils/asyncHandler'
import AppError from '../errors/AppError'

export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization 

    if (!authHeader || !authHeader.startsWith('Bearer ')) { 
        throw new AppError('Not authorized, no token', 401)
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)     // [4]

    const user = await User.findById(decoded.id).select('-password') // [5]
    if (!user) {
        throw new AppError('User no longer exists', 401)
    }

    req.user = user // [6]
    next()
})

// ─── NOTES ───────────────────────────────────────────────────────────────────
// WHY THIS EXISTS:
//   a guard that runs before protected routes.
//   checks: do you have a valid token? are you a real user?
//   if yes → lets you through. if no → stops you with 401.

// [4] verifyToken checks the token is valid and not expired.
//     if invalid or expired → throws → asyncHandler catches it → 401 sent.
//     if valid → returns payload { id: userId }
//
// [5] use the id from token to find the real user in DB.
//     .select('-password') — loads everything except the password field.
//     we always read user fresh from DB — never trust what's inside the token alone.
//
// [6] attach user to req so the next middleware or controller can use it.
//     → req.user.role, req.user._id, req.user.company — all available after this.
//
// USAGE IN ROUTES:
//   router.get('/shifts', protect, asyncHandler(getShifts))
//   router.post('/shifts/start', protect, asyncHandler(startShift))
// ─────────────────────────────────────────────────────────────────────────────