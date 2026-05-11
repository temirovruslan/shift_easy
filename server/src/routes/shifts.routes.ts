import { Router } from "express";
const router = Router();
import {
  getAllShifts,
  getMyShifts,
  getShift,
  startShift,
  stopShift,
} from "../controllers/shift.controller";
import validate from "../middleware/validate.middleware";
import { startShiftSchema, stopShiftSchema } from "../schemas/shift.schema";
import  {protect}  from "../middleware/protect.middleware";
import requireManager from "../middleware/role.middleware";

router.post("/start", protect, validate(startShiftSchema), startShift);
router.post("/stop", protect, validate(stopShiftSchema), stopShift);
router.get("/my", protect, getMyShifts);
router.get("/", protect, requireManager, getAllShifts);
router.get("/:id", protect, requireManager, getShift);
export default router;

// * ─── NOTES ────────────────────────────────────────────────────────────────────

// protect middleware — must come before validate so unauthenticated users are rejected first
