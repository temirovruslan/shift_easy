import mongoose, { Document } from "mongoose";

// IUser — TypeScript interface for a User document [1]
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "worker" | "manager";
  company: mongoose.Types.ObjectId;
  sites: mongoose.Types.ObjectId[];
  occupation?: string; // [2]
  isActivated: boolean; // [3]
  isArchived: boolean;
  inviteToken?: string; // [4]
  inviteTokenExpires?: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    }, // [5]
    password: { type: String, required: true }, // [6]
    role: { type: String, enum: ["worker", "manager"], required: true },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    sites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Site" }],
    occupation: { type: String, trim: true },
    isActivated: { type: Boolean, default: false }, // [3]
    isArchived: { type: Boolean, default: false }, // [3]
    inviteToken: { type: String }, // [4]
    inviteTokenExpires: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model<IUser>("User", userSchema);

// ─── NOTES ───────────────────────────────────────────────────────────────────
// [1] IUser extends Document — your fields + built-in MongoDB fields (_id, save()...)
//
// [2] ? means optional — occupation is set by manager after invite, not required at creation.
//     inviteToken and inviteTokenExpires are also optional — only exist during invite/reset flow.

//
// [4] inviteToken — random token sent in invite/reset email link.
//     we never save the raw token — only the hashed version (same idea as password).
//     inviteTokenExpires — token is only valid for a limited time (e.g. 24h).
//     after expiry → link is dead → manager must resend.
//
// [5] unique: true — MongoDB rejects duplicate emails at DB level.
//     lowercase: true — "User@Gmail.com" saved as "user@gmail.com" automatically.
//     so login works regardless of how user typed their email.
//
// [6] password is stored hashed — never plain text.
//     hashPassword() from hash.utils.ts runs before save in the controller.
// ─────────────────────────────────────────────────────────────────────────────
