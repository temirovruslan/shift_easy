import { Response, Request } from "express";
import UserModel from "../models/User.model";
import { comparePassword, hashPassword } from "../utils/hash.utils";
import AppError from "../errors/AppError";

export const userProfile = async (req: Request, res: Response) => {
  const user = await UserModel.findById(req.user._id) // [1]
    .select("-password -inviteToken -inviteTokenExpires") // [2]
    .populate({
      path: "company", // [3]
      select: "name managers", // [4]
      populate: {
        // [5]
        path: "managers",
        select: "name", // [6]
      },
    })
    .populate("sites", "name");

  res.json({ success: true, data: user });
};

export const changePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = await UserModel.findById(req.user._id);

  const isMatch = await comparePassword(currentPassword, user!.password);

  if (!isMatch) throw new AppError("Current password is incorrect", 400);

  user!.password = await hashPassword(newPassword);
  await user!.save();

  res.json({ seccess: true, message: "Password updated" });
};

// ─── NOTES ───────────────────────────────────────────────────────────────────
// [1]  findById — finds one user in the database by their _id.
//      req.user._id comes from the auth middleware that decoded the JWT token.
//
// [2]  select("-field") — the minus sign means EXCLUDE this field.
//      So password, inviteToken, and inviteTokenExpires are stripped out
//      before the data is sent to the client. Never send these to the frontend.
//
// [3]  path: "company" — user.company is stored in MongoDB as just an ID
//      e.g. "664f1a2b3c4d5e6f7a8b9c0d". populate replaces that ID with
//      the full Company document from the companies collection.
//
// [4]  select: "name managers" — no minus sign means INCLUDE only these fields.
//      From the Company document, only return name and managers. Everything
//      else (address, createdAt, etc.) is ignored.
//
// [5]  nested populate — managers inside Company are also stored as IDs.
//      This second populate goes one level deeper and fetches each Manager
//      document from the users collection.
//
// [6]  select: "name" — from each Manager document, only return their name.
//      Final result looks like:
//      user.company = { name: "BuildCo", managers: [{ name: "Sara" }, { name: "John" }] }
// ─────────────────────────────────────────────────────────────────────────────
