// routes/submissionRoutes.js
import express from "express";
import { handleVideoSubmission } from "../../controllers/videosubController/submissionController.js";

const router = express.Router();

router.post("/upload", handleVideoSubmission);

export default router;
