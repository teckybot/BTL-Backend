import express from "express";
import { getTeamDetails, listTeams,listAllTeams, qualifyTeam, listTeamStats, validateSchoolAndTeamCount, registerTeamsBatch } from "../../controllers/team/teamController.js";
import { createTeamPaymentOrder, verifyTeamPaymentAndRegister } from "../../controllers/team/teamPaymentController.js";
import { downloadTeamPDF } from "../../controllers/downloadPDF.js";

const router = express.Router();


// Download team registration PDF
router.get("/pdf/:teamRegId", downloadTeamPDF);

// Get team details by teamRegId
router.get("/details/:teamRegId", getTeamDetails);

// List all teams (optional filter by schoolRegId via query)
router.get("/list", listTeams);

router.get("/list/all", listAllTeams);

// Mark a team as qualified
router.patch("/qualify/:teamRegId", qualifyTeam);

// Stats for dashboard
router.get("/stats", listTeamStats);

// Check school registration status and team limits
router.post("/validateSchool", validateSchoolAndTeamCount);

// Batch registration endpoint (used by frontend)
router.post("/registerBatch", registerTeamsBatch);

// Team Payment Endpoints (independent from school payment)
router.post("/payment/create-order", createTeamPaymentOrder);
router.post("/payment/verify", verifyTeamPaymentAndRegister);

export default router;
