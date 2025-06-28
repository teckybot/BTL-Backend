import express from "express";
import { registerTeam, getTeamDetails, listTeams, qualifyTeam, listTeamStats } from "../../controllers/team/teamController.js";
import { downloadTeamPDF } from "../../controllers/downloadPDF.js";

const router = express.Router();

// POST /api/team/register
router.post("/register", registerTeam);
router.get("/pdf/:teamRegId", downloadTeamPDF);
router.get("/details/:teamRegId", getTeamDetails);
router.get("/list", listTeams);
router.patch("/qualify/:teamRegId", qualifyTeam);
router.get("/stats", listTeamStats);

export default router;
