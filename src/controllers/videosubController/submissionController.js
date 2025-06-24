import multer from "multer";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

import { uploadFileToDrive } from "../../services/driveService.js";
import VideoSubmission from "../../models/VideoSubmission.js";

// Temp upload directory
const upload = multer({ dest: "uploads/" });

// Helper to extract video duration
const getVideoDuration = (filePath) =>
  new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration); // duration in seconds
    });
  });

export const handleVideoSubmission = [
  upload.single("video"),
  async (req, res) => {
    const { teamRegId } = req.body;
    const file = req.file;

    try {
      console.log("[VideoUpload] Received request for teamRegId:", teamRegId);
      if (!file) {
        console.log("[VideoUpload] No file uploaded.");
        return res.status(400).json({ message: "No file uploaded." });
      }

      // Filename must match team ID (without extension)
      const originalNameWithoutExt = path.parse(file.originalname).name;
      if (originalNameWithoutExt !== teamRegId) {
        fs.unlinkSync(file.path);
        console.log("[VideoUpload] Filename does not match Team ID.");
        return res.status(400).json({ message: "Filename must match Team ID." });
      }

      // File size should be ≤ 30MB
      if (file.size > 30 * 1024 * 1024) {
        fs.unlinkSync(file.path);
        console.log("[VideoUpload] File size exceeds 30MB.");
        return res.status(400).json({ message: "File size exceeds 30MB." });
      }

      // Validate duration ≤ 60 seconds
      const duration = await getVideoDuration(file.path);
      if (duration > 60) {
        fs.unlinkSync(file.path);
        console.log(`[VideoUpload] Video duration exceeds 1 minute. Actual: ${duration.toFixed(2)} sec`);
        return res.status(400).json({
          message: "Video duration exceeds 1 minute.",
          actualDuration: `${duration.toFixed(2)} sec`,
        });
      }

      // Prevent duplicate uploads
      const alreadyUploaded = await VideoSubmission.findOne({ teamRegId });
      if (alreadyUploaded) {
        fs.unlinkSync(file.path);
        console.log("[VideoUpload] Duplicate video submission for teamRegId:", teamRegId);
        return res.status(400).json({
          success: false,
          message: "A video has already been submitted for this team.",
        });
      }

      // Upload to Google Drive
      console.log("[VideoUpload] Uploading file to Google Drive for teamRegId:", teamRegId);
      const result = await uploadFileToDrive(
        file.path,
        `${teamRegId}.mp4`,
        file.mimetype
      );
      console.log("[VideoUpload] File uploaded to Google Drive. Drive response:", result);

      fs.unlinkSync(file.path); // Clean up temp file
      console.log("[VideoUpload] Temp file deleted after upload.");

      // Save to DB
      const submission = new VideoSubmission({
        teamRegId,
        fileId: result.id,
        driveLink: result.webViewLink,
      });

      await submission.save();
      console.log("[VideoUpload] Submission saved to DB for teamRegId:", teamRegId);

      return res.status(200).json({
        success: true,
        message: "Video uploaded and saved successfully.",
        driveLink: result.webViewLink,
        fileId: result.id,
      });
    } catch (err) {
      console.error("[VideoUpload] Upload Error:", err);
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path); // Ensure cleanup on error
        console.log("[VideoUpload] Temp file deleted after error.");
      }
      return res.status(500).json({
        message: "Upload failed.",
        error: err.message,
        stack: err.stack,
      });
    }
  },
];
