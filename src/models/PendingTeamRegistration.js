// models/PendingTeamRegistration.js
import mongoose from "mongoose";

const pendingTeamRegistrationSchema = new mongoose.Schema(
  {
    schoolRegId: { type: String, required: true },
    teams: { type: Array, required: true },
    reason: { type: String, default: "Webhook not received" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("PendingTeamRegistration", pendingTeamRegistrationSchema);
