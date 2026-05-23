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
import { registerSchema } from "../schemas/auth.schema";
router.post("/check-email", checkEmail);
router.post("/register", validate(registerSchema), register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/activate/:token", activate);

export default router;
