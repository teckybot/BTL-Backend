import express from "express";
import {
  validateAIWorkshopForm,
  checkAIWorkshopEmail,
  registerAIWorkshop,
  getAllAIWorkshopRegistrations,
  deleteAIWorkshopRegistration,
  markAIWorkshopPaid
} from "../controllers/aiWorkshopController.js";
import { downloadAIWorkshopPDF } from "../controllers/aiWorkshopPDFController.js";
import AIWorkshopRegistration from "../models/AIWorkshopRegistration.js";

const router = express.Router();

router.post("/validate", validateAIWorkshopForm);
router.post("/check-email", checkAIWorkshopEmail);
router.post("/register", registerAIWorkshop);
router.get("/download-pdf/:registrationId", downloadAIWorkshopPDF);

// Admin endpoints
router.get("/all", getAllAIWorkshopRegistrations);
router.delete("/:registrationId", deleteAIWorkshopRegistration);
router.patch("/:registrationId/mark-paid", markAIWorkshopPaid);

// Admin route to check registration count
router.get("/count", async (req, res) => {
  try {
    const count = await AIWorkshopRegistration.countDocuments();
    res.json({ count, maxRegistrations: 100, available: 100 - count });
  } catch (error) {
    res.status(500).json({ message: "Error getting registration count" });
  }
});

export default router; 