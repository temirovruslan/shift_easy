import { Router } from "express";
const router = Router();
import {
  register,
  checkEmail,
  login,
  forgotPassword,
  resetPassword,
  activate,
} from "../controllers/auth.controller";
import validate from "../middleware/validate.middleware";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  setPasswordSchema,
} from "../schemas/auth.schema";
router.post("/check-email", checkEmail);
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password/:token", validate(setPasswordSchema), resetPassword);
router.post("/activate/:token", validate(setPasswordSchema), activate);

export default router;
