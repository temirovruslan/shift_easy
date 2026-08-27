import { Request, Response } from "express";
import { hashPassword } from "../utils/hash.utils";
import UserModel, { IUser } from "../models/User.model";
import SiteModel from "../models/Site.model";
import { sendInviteEmail } from "../utils/email.utils";
import crypto from "crypto";
import {
  AssignWorkersBody,
  CreateWorkerBody,
  UpdateWorkerBody,
} from "../schemas/worker.schema";
import { success } from "zod";

type WorkerIdParam = { id: string };
type SiteIdParam = { siteId: string };

/**
 * Loads a worker that belongs to the requesting manager's company.
 *
 * Every manager-facing worker route must go through this. `requireManager`
 * only proves the caller is *a* manager, not that the worker in the URL is
 * theirs, so looking a worker up by id alone lets one company reach into
 * another. Missing and out-of-company workers both come back as `null` so the
 * caller answers 404 either way and never confirms that the id exists.
 */
const findCompanyWorker = (workerId: string, company: IUser["company"]) =>
  UserModel.findOne({ _id: workerId, role: "worker", company });

export const createWorker = async (
  req: Request<unknown, unknown, CreateWorkerBody>,
  res: Response,
) => {
  const { name, email, siteId, occupation } = req.body;
  const company = req.user.company;

  const existing = await UserModel.findOne({ email });
  if (existing) {
    res.status(409).json({
      success: false,
      message: "A user with this email already exists",
    });
    return;
  }

  // Resolved before anything is written: a site that belongs to someone else,
  // or to nobody, must not leave a half-created worker behind.
  const site = siteId ? await SiteModel.findOne({ _id: siteId, company }) : null;
  if (siteId && !site) {
    res.status(404).json({ success: false, message: "Site not found" });
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
    company,
    sites: site ? [site._id] : [],
    isActivated: false,
    occupation,
    inviteToken: hashedToken,
    inviteTokenExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  if (site) {
    await SiteModel.updateOne(
      { _id: site._id },
      { $push: { workers: worker._id } }, // [1]
    );
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

export const getWorker = async (
  req: Request<WorkerIdParam>,
  res: Response,
) => {
  const worker = await findCompanyWorker(req.params.id, req.user.company)
    .select("name email occupation isActivated sites createdAt")
    .populate("sites", "name");

  if (!worker) {
    res.status(404).json({ success: false, message: "Worker not found" });
    return;
  }

  res.status(200).json({ success: true, data: worker });
};

export const assignWorker = async (
  req: Request<SiteIdParam, unknown, AssignWorkersBody>,
  res: Response,
) => {
  const { siteId } = req.params;
  const company = req.user.company;
  const requestedIds = [...new Set(req.body.workerIds)];

  const site = await SiteModel.findOne({ _id: siteId, company });
  if (!site) {
    res.status(404).json({ success: false, message: "Site not found" });
    return;
  }

  // Both sides of the link have to be ours: the site above, and every worker
  // below. Anything else is either a typo or one company reaching into
  // another, and neither should be applied halfway.
  const workers = await UserModel.find({
    _id: { $in: requestedIds },
    role: "worker",
    company,
  }).select("_id");

  if (workers.length !== requestedIds.length) {
    res.status(404).json({ success: false, message: "Worker not found" });
    return;
  }

  const workerIds = workers.map((worker) => worker._id);

  await UserModel.updateMany(
    { _id: { $in: workerIds } },
    { $addToSet: { sites: site._id } },
  ); // [3]
  await SiteModel.updateOne(
    { _id: site._id },
    { $addToSet: { workers: { $each: workerIds } } },
  );

  res.status(200).json({ success: true });
};

export const removeWorker = async (
  req: Request<WorkerIdParam>,
  res: Response,
) => {
  const id = req.params.id;
  const worker = await findCompanyWorker(id, req.user.company);

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

export const restoreWorker = async (
  req: Request<WorkerIdParam>,
  res: Response,
) => {
  const id = req.params.id;

  const worker = await findCompanyWorker(id, req.user.company);
  if (!worker) {
    res.status(404).json({ success: false, message: "Worker not found" });
    return;
  }
  await worker.updateOne({ isArchived: false });
  res.status(200).json({ success: true, message: "Worker restored" });
};

export const sendInvite = async (
  req: Request<WorkerIdParam>,
  res: Response,
) => {
  const user = await findCompanyWorker(req.params.id, req.user.company);

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
    inviteTokenExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  const inviteLink = `${process.env.CLIENT_URL}/activate/${rawToken}`;
  sendInviteEmail(user.email, user.name, inviteLink).catch((err) =>
    console.error("Invite email failed:", err),
  );
  res.status(200).json({ success: true, message: "Invite sent" });
};

export const updateWorker = async (
  req: Request<WorkerIdParam, unknown, UpdateWorkerBody>,
  res: Response,
) => {
  const id = req.params.id;
  const { name, email, occupation } = req.body;

  const existing = await UserModel.findOne({ email, _id: { $ne: id } });
  if (existing) {
    res.status(409).json({ success: false, message: "Email already in use" });
    return;
  }
  const workerUpdated = await UserModel.findOneAndUpdate(
    { _id: id, role: "worker", company: req.user.company },
    {
      name,
      email,
      occupation,
    },
    { new: true },
  )
    .select("name email occupation isActivated sites createdAt")
    .populate("sites", "name");

  if (!workerUpdated) {
    res.status(404).json({ success: false, message: "Worker not found" });
    return;
  }

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
