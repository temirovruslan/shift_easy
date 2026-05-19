import { Router } from "express";
import asyncHandler from "../utils/asyncHandler";
import { assignWorker, createWorker, getArchivedWorkers, getWorker, getWorkers, removeWorker, restoreWorker, sendInvite, updateWorker } from "../controllers/worker.controller";
import { protect } from "../middleware/protect.middleware";
import requireManager from "../middleware/role.middleware";
import validate from "../middleware/validate.middleware";
import { workerSchema } from "../schemas/worker.schema";


const router = Router();

router.post("/", protect, requireManager, validate(workerSchema), asyncHandler(createWorker));
router.get("/", protect, requireManager, asyncHandler(getWorkers));
router.get("/archived", protect, requireManager, asyncHandler(getArchivedWorkers));
router.get("/:id", protect, requireManager, asyncHandler(getWorker));
router.delete("/:id", protect, requireManager, asyncHandler(removeWorker));
router.patch("/restore/:id", protect, requireManager, asyncHandler(restoreWorker));
router.post("/assign/:siteId", protect, requireManager, asyncHandler(assignWorker));
router.post("/:id/invite", protect, requireManager, asyncHandler(sendInvite));


export default router;
