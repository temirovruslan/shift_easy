import mongoose, { Document } from "mongoose";

export interface IShift extends Document {
  worker: mongoose.Types.ObjectId;
  site: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  duration: number;
  notes: string;
  materials: string;
  status: "active" | "completed";
}

const shiftSchema = new mongoose.Schema<IShift>(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number,
    },
    notes: {
      type: String,
    },
    materials: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
  },
  { timestamps: true },
);
shiftSchema.index({ worker: 1, status: 1 }); // [1]

export default mongoose.model<IShift>("Shift", shiftSchema);



// ─── NOTES ───────────────────────────────────────────────────────────────────
// [1] index({ worker: 1, status: 1 }) — pre-sorts shifts by worker + status.
//
//     Imagine 100,000 shifts in DB. You call:
//     Shift.findOne({ worker: "ali_id", status: "active" })
//
//     Without index → MongoDB checks all 100,000 shifts one by one.
//     With index    → MongoDB goes directly to Ali's active shift. Done.
//
//     We use this in startShift — before creating a shift we check
//     if the worker already has one running. This makes that check instant.
//
// ─────────────────────────────────────────────────────────────────────────────





