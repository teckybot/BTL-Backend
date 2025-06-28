import express from "express";
import { validateForm, listSchools, listSchoolStats } from "../../controllers/schoolValidationController.js";
import { validateEmailDomain, checkDuplicateEmails } from "../../services/schoolValidationService.js";
import {downloadSchoolPDF} from "../../controllers/downloadPDF.js"

const router = express.Router();

// Route for full form validation (before payment)
router.post("/validate", validateForm);

//pdf download
router.get("/pdf/:schoolRegId", downloadSchoolPDF);

// Route to check email availability and validity
// router.post("/check-email", async (req, res) => {
//   try {
//     const { schoolEmail, coordinatorEmail } = req.body;

//     // Validate domains
//     if (schoolEmail) validateEmailDomain(schoolEmail);
//     if (coordinatorEmail) validateEmailDomain(coordinatorEmail);

//     // Check if same
//     if (schoolEmail === coordinatorEmail) {
//       return res.status(400).json({ message: "School and Coordinator email cannot be the same" });
//     }

//     // Check duplicates
//     await checkDuplicateEmails(schoolEmail, coordinatorEmail);

//     return res.status(200).json({ message: "Emails are available" });
//   } catch (error) {
//     return res.status(400).json({ message: error.message });
//   }
// });

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

router.get("/list", listSchools);
router.get("/stats", listSchoolStats);

export default router;
