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
  authLimiter,
  credentialsLimiter,
  emailLookupLimiter,
} from "../middleware/rateLimit.middleware";
import {
  checkEmailSchema,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  setPasswordSchema,
} from "../schemas/auth.schema";
// Applies to every route in this file, including the ones with their own
// tighter limit below.
router.use(authLimiter);

router.post(
  "/check-email",
  emailLookupLimiter,
  validate(checkEmailSchema),
  checkEmail,
);
router.post("/register", validate(registerSchema), register);
router.post("/login", credentialsLimiter, validate(loginSchema), login);
router.post(
  "/forgot-password",
  emailLookupLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);
router.post("/reset-password/:token", validate(setPasswordSchema), resetPassword);
router.post("/activate/:token", validate(setPasswordSchema), activate);

export default router;
