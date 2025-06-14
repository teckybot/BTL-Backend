import express from "express";
import { verifySchoolEligibility } from "../../controllers/team/checkpointController.js";

const router = express.Router();

// GET /api/checkpoint/:schoolRegId
router.get("/:schoolRegId", verifySchoolEligibility);

export default router;
