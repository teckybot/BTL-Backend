import express from "express";
import School from "../../models/School.js";
import { validateForm, listSchools, listSchoolStats, listAllSchools } from "../../controllers/schoolValidationController.js";
import { validateEmailDomain, checkDuplicateEmails } from "../../services/schoolValidationService.js";
import { downloadSchoolPDF } from "../../controllers/downloadPDF.js";
import { registerSchool } from "../../controllers/schoolController.js";

const router = express.Router();

// Step 1: Full form validation (client calls before submitting)
router.post("/validate", validateForm);

// Step 2: School registration (creates school + sends email + returns schoolRegId)
router.post("/register", registerSchool);

// Step 3: Email availability check (optional pre-check)
router.post("/check-email", async (req, res) => {
  try {
    const { schoolEmail, coordinatorEmail } = req.body;

    if (schoolEmail) validateEmailDomain(schoolEmail);
    if (coordinatorEmail) validateEmailDomain(coordinatorEmail);

    if (schoolEmail === coordinatorEmail) {
      return res.status(400).json({
        message: "School and Coordinator email cannot be the same",
        schoolEmailDuplicate: true,
        coordinatorEmailDuplicate: true,
      });
    }

    await checkDuplicateEmails(schoolEmail, coordinatorEmail);

    return res.status(200).json({
      message: "Emails are available",
      schoolEmailDuplicate: false,
      coordinatorEmailDuplicate: false,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Duplicate email",
      schoolEmailDuplicate: error.schoolEmailDuplicate || false,
      coordinatorEmailDuplicate: error.coordinatorEmailDuplicate || false,
      reasons: error.reasons || [],
    });
  }
});

// Step 4: Download school registration PDF
router.get("/pdf/:schoolRegId", downloadSchoolPDF);

// Step 5: Admin listing & stats
router.get("/list", listSchools);
router.get("/list/all", listAllSchools);
router.get("/stats", listSchoolStats);

// Fetch school details by regId
router.get("/:schoolRegId", async (req, res) => {
  try {
    const { schoolRegId } = req.params;

    if (!schoolRegId) {
      return res.status(400).json({ success: false, message: "schoolRegId is required." });
    }

    const school = await School.findOne({ schoolRegId }).select(
      "schoolName schoolEmail coordinatorName coordinatorEmail coordinatorNumber state district"
    );


    if (!school) {
      return res.status(404).json({ success: false, message: "School not found." });
    }

    res.status(200).json({ success: true, school });
  } catch (err) {
    console.error("Failed to fetch school:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

export default router;
