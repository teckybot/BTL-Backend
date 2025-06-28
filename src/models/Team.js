import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  classGrade: { type: String, required: true },
  gender: { type: String, required: true },
});

const teamSchema = new mongoose.Schema({
  schoolRegId: { type: String, required: true },
  teamName: { type: String, required: true, unique: true },
  teamSize: { type: Number, enum: [2, 3, 4], required: true },
  members: { type: [memberSchema], required: true },
  event: { type: String, required: true },
  state: String,
  teamRegId: { type: String, required: true },
  isQualified: { type: Boolean, default: false },
  qualifierPaid: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'teams' });

teamSchema.index({ teamRegId: 1, event: 1, state: 1 }, { unique: true });

export default mongoose.model("Team", teamSchema);
