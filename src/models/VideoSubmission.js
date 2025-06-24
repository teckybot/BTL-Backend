import mongoose from "mongoose";

const videoSubmissionSchema = new mongoose.Schema({
  teamRegId: { type: String, required: true, unique: true },
  fileId: { type: String, required: true },
  driveLink: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.model("VideoSubmission", videoSubmissionSchema);
