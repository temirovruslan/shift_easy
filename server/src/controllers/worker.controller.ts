import { Request, Response } from "express";
import { hashPassword } from "../utils/hash.utils";
import UserModel from "../models/User.model";
import SiteModel from "../models/Site.model";

export const createWorker = async (req: Request, res: Response) => {
  const { name, email, companyId, siteId, password } = req.body;

  const hashedPassword = await hashPassword(password);
  const worker = await UserModel.create({
    name,
    email,
    password: hashedPassword,
    role: "worker",
    company: req.user.company,
    sites: [siteId],
    isActivated: true,
  });

  await SiteModel.findByIdAndUpdate(siteId, { $push: { workers: worker._id } }); // [1]

  res.status(201).json({ success: true, data: worker });
};

export const getWorkers = async (req: Request, res: Response) => {
  const workers = await UserModel.find({
    role: "worker",
    company: req.user.company,
  }).select("name email sites"); // [2]
  res.status(200).json({ success: true, data: workers });
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

// ─── NOTES ───────────────────────────────────────────────────────────────────
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
//
// ─────────────────────────────────────────────────────────────────────────────