import { Router } from "express";
import { changePassword, updateProfile, userProfile } from "../controllers/user.controller";
import asyncHandler from "../utils/asyncHandler";
import { protect } from "../middleware/protect.middleware";
import validate from "../middleware/validate.middleware";
import {
  changePasswordSchema,
  updateProfileSchema,
} from "../schemas/user.schema";

const router = Router();

router.get("/me", protect, asyncHandler(userProfile));
router.put("/me", protect, validate(updateProfileSchema), asyncHandler(updateProfile));
router.post(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  asyncHandler(changePassword),
);

export default router;
