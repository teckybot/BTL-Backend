
import express from "express";
import { registerTeam } from "../../controllers/team/teamController.js";
import { downloadTeamPDF } from "../../controllers/downloadPDF.js";

const router = express.Router();

// POST /api/team/register
router.post("/register", registerTeam);
router.get("/pdf/:teamRegId", downloadTeamPDF);

export default router;
