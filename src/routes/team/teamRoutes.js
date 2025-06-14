
import express from "express";
import { registerTeam } from "../../controllers/team/teamController.js";

const router = express.Router();

// POST /api/team/register
router.post("/register", registerTeam);

export default router;
