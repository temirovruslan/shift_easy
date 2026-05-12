import { Router } from "express";
import { changePassword, userProfile } from "../controllers/user.controller";
import asyncHandler from "../utils/asyncHandler";
import { protect } from "../middleware/protect.middleware";

const router = Router();

router.get("/me", protect, asyncHandler(userProfile));
router.post("/change-password", protect, asyncHandler(changePassword));

export default router;
