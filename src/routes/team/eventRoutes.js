
import express from "express";
import { getAvailableEventDropdown } from "../../controllers/team/eventController.js";

const router = express.Router();

// GET /api/events/:schoolRegId
router.get("/:schoolRegId", getAvailableEventDropdown);

export default router;
