import { Router } from "express";
import { protect } from "../middleware/protect.middleware";
import requireManager from "../middleware/role.middleware";
import validate from "../middleware/validate.middleware";
import { siteSchema } from "../schemas/site.schema";
import asyncHandler from "../utils/asyncHandler";
import { activateSite, archiveSite, createSite, getActiveSites, getArchivedSites, getSite, updateSite } from "../controllers/site.controller";

const router = Router();

router.post("/", protect, requireManager,validate(siteSchema),asyncHandler(createSite) );
router.get("/", protect, requireManager, asyncHandler(getActiveSites));
router.get("/archived", protect, requireManager, asyncHandler(getArchivedSites));
router.get("/:id", protect, requireManager, asyncHandler(getSite)); // was missing

router.patch("/:id", protect, requireManager, asyncHandler(updateSite));
router.patch("/archive/:id", protect, requireManager, asyncHandler(archiveSite));
router.patch("/activate/:id", protect, requireManager, asyncHandler(activateSite));

export default router;