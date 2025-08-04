// src/controllers/videosubController/submissionController.js

import multer from "multer";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

import { uploadFileToDrive } from "../../services/driveService.js";
import Submission from "../../models/OnlineSubmission.js";
import { COMPETITION_FOLDERS, COMPETITION_TYPES } from "../../config/competitionConfig.js";

// Temp upload directory - use a dynamic upload handler
const upload = multer({ dest: "uploads/" });

// Helper to extract video duration
const getVideoDuration = (filePath) =>
  new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration); // duration in seconds
    });
  });

// New unified controller
export const handleDynamicSubmission = [
  // Multer middleware will handle both video and PDF uploads
  upload.single("submissionFile"), // The file field name should be consistent
  async (req, res) => {
    const { teamRegId, messageContent } = req.body;
    const file = req.file;

    try {
      if (!teamRegId) {
        return res.status(400).json({ message: "Team Registration ID is required." });
      }

      // 1. Determine the competition type from the teamRegId
      const competitionCode = teamRegId.substring(2, 5).toUpperCase();
      const competitionType = COMPETITION_TYPES[competitionCode];

      if (!competitionType) {
        return res.status(400).json({ message: "Invalid competition code in Team ID." });
      }
      
      const folderId = COMPETITION_FOLDERS[competitionCode];
      let submissionType = competitionType; // Use this variable for all checks

      // OPTIMIZATION: Check for duplicate BEFORE uploading any file
      const alreadyUploaded = await Submission.findOne({ teamRegId, type: submissionType });
      if (alreadyUploaded) {
        // If a duplicate is found, delete the temp file immediately
        if (file && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        return res.status(400).json({ message: `A ${submissionType} submission has already been made for this team.` });
      }

      let result;

      // 2. Conditional logic based on competition type
      switch (submissionType) {
        case "video":
          if (!file) return res.status(400).json({ message: "No video file uploaded." });
          
          // Perform video-specific validation (size, duration)
          const originalNameWithoutExt = path.parse(file.originalname).name;
          if (originalNameWithoutExt !== teamRegId) {
            fs.unlinkSync(file.path);
            return res.status(400).json({ message: "Filename must match Team ID." });
          }
          if (file.size > 30 * 1024 * 1024) {
            fs.unlinkSync(file.path);
            return res.status(400).json({ message: "File size exceeds 30MB." });
          }
          const duration = await getVideoDuration(file.path);
          if (duration > 60) {
            fs.unlinkSync(file.path);
            return res.status(400).json({ message: "Video duration exceeds 1 minute." });
          }

          result = await uploadFileToDrive(file.path, `${teamRegId}.mp4`, file.mimetype, folderId);
          break;

        case "pdf":
          if (!file) return res.status(400).json({ message: "No PDF file uploaded." });

          // Perform PDF-specific validation (file type, size)
          if (file.mimetype !== "application/pdf") {
            fs.unlinkSync(file.path);
            return res.status(400).json({ success: false, message: "Only PDF files are allowed." });
          }
          if (file.size > 10 * 1024 * 1024) {
            fs.unlinkSync(file.path);
            return res.status(400).json({ success: false, message: "PDF file exceeds 10MB size limit." });
          }

          result = await uploadFileToDrive(file.path, file.originalname, file.mimetype, folderId);
          break;

        case "text":
          // For CDX (text), we don't upload a file. Just save the message to the DB.
          result = { id: null, webViewLink: null }; // No Drive result for text
          break;
      }
      
      // Clean up temp file after successful upload for file-based submissions
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path); 
      }
      
      // Save to DB
      const submission = new Submission({
        teamRegId,
        fileId: result.id,
        driveLink: result.webViewLink,
        type: submissionType,
        message: messageContent, // Save the message if it exists
      });

      await submission.save();

      return res.status(200).json({
        success: true,
        message: `${submissionType.toUpperCase()} submitted successfully.`,
        driveLink: result.webViewLink,
        fileId: result.id,
      });

    } catch (err) {
      console.error("[Dynamic Submission] Error:", err);
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(500).json({ message: "Submission failed.", error: err.message });
    }
  },
];

export const checkSubmissionStatus = async (req, res) => {
  try {
    const { teamRegId } = req.params;
    const submission = await Submission.findOne({ teamRegId });

    if (submission) {
      return res.status(200).json({ hasSubmitted: true, submissionType: submission.type });
    } else {
      return res.status(200).json({ hasSubmitted: false });
    }
  } catch (err) {
    console.error("Error checking submission status:", err);
    return res.status(500).json({ message: "Server error." });
  }
};