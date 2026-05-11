import { Router } from "express";
const router = Router();
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  activate,
} from "../controllers/auth.controller";
import validate from "../middleware/validate.middleware";
import { registerSchema } from "../schemas/auth.schema";
import asyncHandler from "../utils/asyncHandler";
import { hashPassword } from "../utils/hash.utils";
import UserModel from "../models/User.model";

router.post("/register", validate(registerSchema), register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/activete/:token", activate);

// TEMPRORY FILE DELELTE IT

router.post(
  "/dev/create-worker",
  asyncHandler(async (req, res) => {
    const { email, name, password, companyId, siteId } = req.body;

    const hashedPassword = await hashPassword(password);
    const worker = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role: "worker",
      company: companyId,
      sites: [siteId],
      isActivated: true,
    });
    res.status(201).json({ success: true, data: worker });
  }),
);

export default router;
