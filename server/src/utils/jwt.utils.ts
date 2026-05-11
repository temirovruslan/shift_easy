import jwt from 'jsonwebtoken'

export const generateToken = (userId: string): string => {
    return jwt.sign(
        { id: userId },                              // [1]
        process.env.JWT_SECRET as string,            // [2]
        { expiresIn: process.env.JWT_EXPIRES_IN } as jwt.SignOptions// [3]
    )
}

export const verifyToken = (token: string): jwt.JwtPayload => {
    return jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload // [4]
}





// ─── NOTES ───────────────────────────────────────────────────────────────────
// WHY THIS EXISTS:
//   after login, the server gives the client a token (like a pass).
//   on every next request the client sends that token back.
//   server verifies it and knows who you are — no DB lookup needed.
//
// [1] payload — data locked inside the token. we only store userId (id).
//     never store role or email here — token can be decoded by anyone who has it.
//     role is always read fresh from DB on every request (see protect middleware)
//
// [2] JWT_SECRET — secret key used to sign the token.
//     if someone changes the token, signature breaks and verify() throws.
//     lives in .env — never hardcode it.
//
// [3] JWT_EXPIRES_IN — how long the token is valid (e.g. "7d", "1h")
//     after expiry, verify() throws and user must log in again.
//     set in .env as JWT_EXPIRES_IN=7d
//
// [4] verifyToken — checks the token is valid and not expired.
//     returns the payload { id: userId } if valid.
//     throws an error if invalid or expired → asyncHandler catches it → 401 sent
//
// USAGE:
//   login:   const token = generateToken(user._id.toString())
//            res.json({ token })
//
//   protect: const payload = verifyToken(token)
//            const user = await User.findById(payload.id)
// ─────────────────────────────────────────────────────────────────────────────