import mongoose, { Document } from 'mongoose'

// ISite — TypeScript interface for a Site document [1]
export interface ISite extends Document {
    name: string
    address: string
    company: mongoose.Types.ObjectId  // [2]
    managers: mongoose.Types.ObjectId[]
    workers: mongoose.Types.ObjectId[]
    status: 'active' | 'archived'    // [3]
}

const siteSchema = new mongoose.Schema<ISite>(
    {
        name: { type: String, required: true, trim: true }, // [4]
        address: { type: String, required: true, trim: true },
        company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }, // [2]
        managers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        workers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        status: { type: String, enum: ['active', 'archived'], default: 'active' }, // [3]
    },
    { timestamps: true }
)

export default mongoose.model<ISite>('Site', siteSchema)

// ─── NOTES ───────────────────────────────────────────────────────────────────
// [1] ISite extends Document — means a Site object has both your fields (name, address...)
//     AND built-in MongoDB fields (_id, save(), deleteOne()...) from Document.
//
// [2] ObjectId — instead of copying full user/company data into this document,
//     we just store a reference (like a foreign key in SQL).
//     ref: 'User' tells Mongoose where to look when you call .populate()
//     → Site.findById(id).populate('workers') → gives you full user objects, not just IDs
//
// [3] status: 'active' | 'archived' — sites are never deleted.
//     archived means hidden from active lists but shift history is preserved.
//     enum in schema means MongoDB rejects any other value at DB level.
//
// [4] trim: true — removes accidental spaces from start and end.
//     "  Site A  " → "Site A" — saved clean in DB automatically.

// ─────────────────────────────────────────────────────────────────────────────