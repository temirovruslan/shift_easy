import { Request, Response } from "express";
import { hashPassword } from "../utils/hash.utils";
import UserModel from "../models/User.model";
import SiteModel from "../models/Site.model";
import { sendInviteEmail } from "../utils/email.utils";
import crypto from "crypto";
import { success } from "zod";

export const createWorker = async (req: Request, res: Response) => {
  const { name, email, siteId, occupation } = req.body;

  const existing = await UserModel.findOne({ email });
  if (existing) {
    res.status(409).json({
      success: false,
      message: "A user with this email already exists",
    });
    return;
  }

  const tempPassword = await hashPassword(
    crypto.randomBytes(16).toString("hex"),
  );

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const worker = await UserModel.create({
    name,
    email,
    password: tempPassword,
    role: "worker",
    company: req.user.company,
    sites: siteId ? [siteId] : [],
    isActivated: false,
    occupation,
    inviteToken: hashedToken,
    inviteTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  if (siteId) {
    await SiteModel.findByIdAndUpdate(siteId, {
      $push: { workers: worker._id },
    });
  }

  const inviteLink = `${process.env.CLIENT_URL}/activate/${rawToken}`;
  sendInviteEmail(worker.email, worker.name, inviteLink).catch((err) =>
    console.error("Invite email failed:", err),
  );

  res.status(201).json({ success: true, data: worker });
};

export const getWorkers = async (req: Request, res: Response) => {
  const workers = await UserModel.find({
    role: "worker",
    company: req.user.company, // [0]
    isArchived: { $ne: true }, // $ne - not equel
  })
    .select("name email sites isActivated occupation") // [2]
    .populate("sites", "name");
  res.status(200).json({ success: true, data: workers });
};

export const getWorker = async (req: Request, res: Response) => {
  const worker = await UserModel.findById(req.params.id)
    .select("name email occupation isActivated sites createdAt")
    .populate("sites", "name");

  if (!worker) {
    res.status(404).json({ success: false, message: "Worker not found" });
    return;
  }

  res.status(200).json({ success: true, data: worker });
};

export const assignWorker = async (req: Request, res: Response) => {
  const { workerIds } = req.body;
  const siteId = req.params.siteId;

  await UserModel.updateMany(
    { _id: { $in: workerIds } },
    { $addToSet: { sites: siteId } },
  ); // [3]
  await SiteModel.findByIdAndUpdate(siteId, {
    $addToSet: { workers: { $each: workerIds } },
  });
};

export const removeWorker = async (req: Request, res: Response) => {
  const id = req.params.id;
  const worker = await UserModel.findById(id);

  if (!worker) {
    res.status(404).json({ success: false, message: "Worker not found" });
    return;
  }

  await worker.updateOne({ isArchived: true });
  res.status(200).json({ success: true, message: "Worker removed" });
};

export const getArchivedWorkers = async (req: Request, res: Response) => {
  const workers = await UserModel.find({
    role: "worker",
    isArchived: true,
    company: req.user.company,
  })
    .select("name email sites isActivated occupation")
    .populate("sites", "name");

  res.status(200).json({ success: true, data: workers });
};

export const restoreWorker = async (req: Request, res: Response) => {
  const id = req.params.id;

  const worker = await UserModel.findById(id);
  if (!worker) {
    res.status(404).json({ success: false, message: "Worker not found" });
    return;
  }
  await worker.updateOne({ isArchived: false });
  res.status(200).json({ success: true, message: "Worker restored" });
};

export const sendInvite = async (req: Request, res: Response) => {
  const user = await UserModel.findById(req.params.id);

  if (!user) {
    res.status(404).json({ success: false, message: "Worker not found" });
    return;
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  await user.updateOne({
    inviteToken: hashedToken,
    inviteTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  const inviteLink = `${process.env.CLIENT_URL}/activate/${rawToken}`;
  sendInviteEmail(user.email, user.name, inviteLink).catch((err) =>
    console.error("Invite email failed:", err),
  );
  res.status(200).json({ success: true, message: "Invite sent" });
};

export const updateWorker = async (req: Request, res: Response) => {
  const id = req.params.id;
  const { name, email, occupation } = req.body;

  const existing = await UserModel.findOne({ email, _id: { $ne: id } });
  if (existing) {
    res.status(409).json({ success: false, message: "Email already in use" });
    return;
  }
  const workerUpdated = await UserModel.findByIdAndUpdate(
    id,
    {
      name,
      email,
      occupation,
    },
    { new: true },
  )
    .select("name email occupation isActivated sites createdAt")
    .populate("sites", "name");

  res.status(200).json({ success: true, data: workerUpdated });
};
// ─── NOTES ───────────────────────────────────────────────────────────────────

// [0]
// req.user.company is the company ID of the logged-in manager.
// When the manager logs in, the protect middleware decodes their JWT
//  and attaches their user object to req.user. So req.user.company is
//  just "which company does this manager belong to."
// We filter by it so a manager can only see workers from their own company —
// not workers from other companies in the database.

// [1] $push — adds worker._id to the site's workers array.
//     Safe to use here because worker is brand new — no duplicates possible.
//
// [2] .select("name email sites") — returns only these 3 fields.
//     Keeps the response small, no passwords or sensitive data leaked.
//
// [3] workerIds is an array of IDs from req.body e.g. ["id1", "id2", "id3"]
//
//     updateMany({ _id: { $in: workerIds } }) — updates ALL matched workers at once.
//     $in means: find documents where _id is in this array.
//     Each worker gets the siteId added to their sites[].
//
//     $each: workerIds — adds multiple IDs to the site's workers[] in one operation.
//     Without $each, MongoDB would nest the array: workers: [["id1","id2"]] ← wrong.
//     With $each:                                  workers: ["id1", "id2"] ← correct.
//
//     $addToSet on both sides prevents duplicates.
