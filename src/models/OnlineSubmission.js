import mongoose from "mongoose";

const OnlineSubmissionSchema = new mongoose.Schema({
  teamRegId: { type: String, required: true, unique: true },
  fileId: { type: String, required: true },
  driveLink: { type: String, required: true },
  type: {
    type: String,
    enum: ["video", "pdf"],
  },
  uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Submission", OnlineSubmissionSchema);
