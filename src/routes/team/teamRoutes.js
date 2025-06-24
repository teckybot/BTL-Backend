import express from "express";
import { registerTeam, getTeamDetails } from "../../controllers/team/teamController.js";
import { downloadTeamPDF } from "../../controllers/downloadPDF.js";

const router = express.Router();

// POST /api/team/register
router.post("/register", registerTeam);
router.get("/pdf/:teamRegId", downloadTeamPDF);
router.get("/details/:teamRegId", getTeamDetails);

export default router;
