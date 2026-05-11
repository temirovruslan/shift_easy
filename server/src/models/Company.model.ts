import mongoose, { Document } from 'mongoose'

export interface ICompany extends Document {
    name: string
    managers: mongoose.Types.ObjectId[]
}

const companySchema = new mongoose.Schema<ICompany>(
    {
        name: { type: String, required: true, trim: true },
        managers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    { timestamps: true }
)

export default mongoose.model<ICompany>('Company', companySchema)
