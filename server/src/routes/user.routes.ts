import { Router } from "express";
import { changePassword, updateProfile, userProfile } from "../controllers/user.controller";
import asyncHandler from "../utils/asyncHandler";
import { protect } from "../middleware/protect.middleware";

const router = Router();

router.get("/me", protect, asyncHandler(userProfile));
router.put("/me", protect, asyncHandler(updateProfile));
router.post("/change-password", protect, asyncHandler(changePassword));

export default router;
