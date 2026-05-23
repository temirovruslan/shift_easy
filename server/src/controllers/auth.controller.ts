import { sendPasswordResetEmail } from '../utils/email.utils';
import crypto from 'crypto'
import User from "../models/User.model";
import Company from "../models/Company.model";
import AppError from "../errors/AppError";
import { Request, Response, NextFunction } from 'express'
import asyncHandler from "../utils/asyncHandler";
import { comparePassword, hashPassword } from '../utils/hash.utils'
import Site from "../models/Site.model";
import { generateToken } from "../utils/jwt.utils";


export const checkEmail = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body
    const exists = await User.findOne({ email })
    res.status(200).json({ available: !exists })
})

export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, companyName, siteName, siteAddress } = req.body

    const isEmailExist = await User.findOne({ email })
    if (isEmailExist) {
        throw new AppError("Email already exist", 409)
    }
    const hashedPassword = await hashPassword(password)
    const newCompany = await Company.create({ name: companyName })
    const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'manager',
        company: newCompany._id,
        isActivated: true
    })
    const newSite = await Site.create({
        name: siteName,
        address: siteAddress,
        company: newCompany._id,
        managers: [newUser._id],
    })

    await Company.findByIdAndUpdate(newCompany._id, { $push: { managers: newUser._id } })
    const token = generateToken(newUser._id.toString())
    res.status(201).json({ success: true, data: { role: newUser.role, name: newUser.name, token } })
})




export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) {
        throw new AppError("Wrong credentials", 401)
    }


    const isPasswordMatch = await comparePassword(password, user.password)
    if (!isPasswordMatch) {
        throw new AppError("Wrong credentials", 401)
    }

    if (!user.isActivated) {
        throw new AppError("Account not activated. Check your invite email to set your password.", 403)
    }
    const token = generateToken(user._id.toString())

    res.status(200).json({ success: true, data: { role: user.role, name: user.name, token } })

})

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body
    const user = await User.findOne({ email })

    if (!user) {
        res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent' })
        return
    }


    const rawToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex")
    // changed code here
    await User.findOneAndUpdate({ _id: user._id }, {
        inviteToken: hashedToken,
        inviteTokenExpires: new Date(Date.now() + 15 * 60 * 1000)
    })
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${rawToken}`
    await sendPasswordResetEmail(user.email, resetLink)
    res.status(200).json({ success: true })
}
)



export const resetPassword = asyncHandler(async (req, res) => {
    const { password } = req.body
    const token = req.params.token as string
    const hashedToken = crypto.createHash("sha256").update(token).digest('hex')
    const user = await User.findOne({
        inviteToken: hashedToken,
        inviteTokenExpires: { $gt: new Date() }
    })
    if (!user) {
        throw new AppError('Invalid or expired token', 400)
    }
    const hashedPassword = await hashPassword(password)

    await User.findByIdAndUpdate(user._id, {
        password: hashedPassword,
        inviteToken: undefined,
        inviteTokenExpires: undefined
    })
    res.status(200).json({
        success: true,
        message: "Password reset successfull"
    })
})



export const activate = asyncHandler(async (req, res) => {
    const { password } = req.body
    const token = req.params.token as string
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")


    const user = await User.findOne({
        inviteToken: hashedToken,
        inviteTokenExpires: { $gt: new Date() }
    })

    if (!user) {
        throw new AppError('Invalid or expired token', 400)
    }

    const hashedPassword = await hashPassword(password)
    await User.findByIdAndUpdate(user._id, {
        password: hashedPassword,
        inviteToken: undefined,
        inviteTokenExpires: undefined,
        isActivated: true
    })

    res.status(200).json({
        success: true,
        message: "Password sent"
    })
})
// asyncHandler — any async controller must be wrapped so errors are caught automatically.

