import bcrypt from "bcryptjs"

export const hashPassword = (password: string): Promise<string> => {
    return bcrypt.hash(password, 10) // [1]
}

export const comparePassword = (password: string, hashed: string): Promise<boolean> => {
    return bcrypt.compare(password, hashed) // [2]
}

// ─── NOTES ───────────────────────────────────────────────────────────────────
// WHY THIS EXISTS:
//   passwords must never be saved as plain text in the DB.
//   if your DB gets hacked, attacker sees hashes — useless without the original.
//   bcrypt turns "mypassword123" → "$2b$10$Xq8Kl..." (one way, can't reverse it)
//
// [1] hashPassword — call this before saving a new user to DB
//     10 = salt rounds (how hard it is to crack, 10 is the standard)
//     → const hashed = await hashPassword('mypassword123')
//     → save hashed to DB, never the original
//
// [2] comparePassword — call this on login
//     bcrypt hashes the input and compares it to the stored hash
//     returns true if match, false if not
//     → const match = await comparePassword('mypassword123', user.password)
//     → if (!match) throw new AppError('Wrong password', 401)
//
// USAGE:
//   register: const hashed = await hashPassword(req.body.password)
//             await User.create({ ...data, password: hashed })
//
//   login:    const match = await comparePassword(req.body.password, user.password)
//             if (!match) throw new AppError('Invalid credentials', 401)
// ─────────────────────────────────────────────────────────────────────────────