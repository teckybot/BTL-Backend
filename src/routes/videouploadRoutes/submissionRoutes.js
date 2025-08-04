
import express from "express";
import { handleDynamicSubmission, checkSubmissionStatus  } from "../../controllers/videosubController/submissionController.js";


const router = express.Router();
router.post("/dynamic-upload", handleDynamicSubmission);;

router.get("/check/:teamRegId", checkSubmissionStatus);

export default router;
