import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/asyncHandler";
import ShiftModel from "../models/Shift.model";
import AppError from "../errors/AppError";
import CompanyModel from "../models/Company.model";

export const startShift = asyncHandler(async (req, res) => {
  const { siteId } = req.body;
  const worker = req.user; // [1]
  const workerShift = await ShiftModel.findOne({
    worker: worker._id,
    status: "active",
  });
  if (workerShift) {
    throw new AppError("You already have an active shift", 400);
  }
  const isAssigned = worker.sites.some((s) => s.toString() === siteId);
  if (!isAssigned) {
    throw new AppError("You are not assigned to this site", 403);
  }
  const newShift = await ShiftModel.create({
    worker: worker._id,
    site: siteId,
    company: worker.company,
    startTime: new Date(),
    status: "active",
  });

  res.status(201).json({
    success: true,
    data: newShift,
  });
});

export const stopShift = asyncHandler(async (req, res) => {
  const { notes, materials } = req.body;

  const worker = req.user;
  const activeShift = await ShiftModel.findOne({
    worker: worker._id,
    status: "active",
  });
  if (!activeShift) {
    throw new AppError("Do not have active shift", 409);
  }

  const endTime = new Date();
  const duration = Math.round(
    (endTime.getTime() - activeShift.startTime.getTime()) / 60000,
  );

  const updatedShift = await ShiftModel.findByIdAndUpdate(
    activeShift._id,
    {
      endTime,
      duration,
      status: "completed",
      notes,
      materials,
    },
    { new: true },
  );
  res.status(200).json({ success: true, data: updatedShift });
});

export const getMyShifts = asyncHandler(async (req, res) => {
  const worker = req.user;
  const workerShifts = await ShiftModel.find({ worker: worker._id })
    .populate("site", "name address") // [2]
    .sort({ createdAt: -1 }); // [3]

  res.status(200).json({ success: true, data: workerShifts });
});

export const getAllShifts = asyncHandler(async (req, res) => {
  const manager = req.user;

  const shifts = await ShiftModel.find({ company: manager.company })
    .populate("worker", "name")
    .populate("site", "name")
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: shifts });
});

export const getShift = asyncHandler(async (req, res) => {
  const manager = req.user;
  const dat = req.params;

  const findShift = await ShiftModel.findOne({
    _id: req.params.id,
    company: manager.company,
  })
    .populate("worker", "name")
    .populate("site", "name address");
  if (!findShift) throw new AppError("Shift not found", 404);
  res.status(200).json({ success: true, data: findShift });
});

export const exportShifts = asyncHandler(async (req, res) => {
  const manager = req.user;

  const shifts = await ShiftModel.find({
    company: manager.company,
    status: "completed",
  })
    .populate("worker", "name")
    .populate("site", "name")
    .sort({ startTime: -1 });

  console.log(`[exportShifts] manager: ${manager.name} | shifts found: ${shifts.length}`);

  res.status(200).json({ success: true, count: shifts.length, data: shifts });
});
// * ─── NOTES ────────────────────────────────────────────────────────────────────

// ! [1]
// req.user comes from the protect middleware.
// When a request hits a protected route, it goes through protect first:
// Request → protect middleware → controller
// Inside protect:
// Reads the token from the Authorization: Bearer <token> header
// Verifies the token with jwt.verify()
// Decodes it to get the user's ID
// Finds the user in MongoDB: User.findById(userId)
// Attaches it to the request: req.user = user
// Then your controller runs and req.user is already there — the full user object from the database.
// That's why you can do req.user._id, req.user.role, req.user.sites etc. — it's the real user document.
// Go check protect.middleware.ts and you'll see exactly where req.user = is set.

// ! [2]

// .populate - replaces the site ID with the actual site name and address

// ! [3]
// sort - — newest shifts first
