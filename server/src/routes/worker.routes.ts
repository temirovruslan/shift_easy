import { Router } from "express";
import asyncHandler from "../utils/asyncHandler";
import { assignWorker, createWorker, getWorkers } from "../controllers/worker.controller";
import { protect } from "../middleware/protect.middleware";
import requireManager from "../middleware/role.middleware";

const router = Router();

router.post("/", protect, requireManager, asyncHandler(createWorker));
router.get("/", protect, requireManager, asyncHandler(getWorkers));
router.post("/assign/:siteId", protect, requireManager, asyncHandler(assignWorker));


export default router;
