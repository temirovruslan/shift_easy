class AppError extends Error {
    statusCode: number     // [1]
    isOperational: boolean // [2]

    constructor(message: string, statusCode: number) {
        super(message)                                  // [3]
        this.statusCode = statusCode
        this.isOperational = true
        Error.captureStackTrace(this, this.constructor) // [4]
    }
}

export default AppError

// ─── NOTES ───────────────────────────────────────────────────────────────────
//
// WHY THIS FILE EXISTS:
//   Normal Error only carries a message. In an API you also need to tell the
//   client WHAT went wrong (404 not found, 401 unauthorized, etc).
//   So instead of writing res.status(404).json(...) in every controller,
//   you just throw new AppError('Not found', 404) and the global error handler
//   in app.ts handles the response for you.
//

// [1] HTTP status code sent back to the client
//     400 bad input | 401 not logged in | 403 no permission | 404 not found | 409 already exists
//     → throw new AppError('Shift already active', 400)
//     → throw new AppError('Worker not found', 404)
//     → throw new AppError('Email already taken', 409)
//
// [2] true = you threw this on purpose (wrong password, missing field)
//     false = something crashed (bug, DB down) → handler hides details from client
//
// [3] passes message to built-in Error → becomes err.message down the line
//     → new AppError('Not authorized', 401) → err.message === 'Not authorized'
//
// [4] terminal shows where YOU threw the error, not where AppError was built
//     → without it: trace starts inside this file (useless)
//     → with it: trace starts in your controller (useful)


// ─────────────────────────────────────────────────────────────────────────────