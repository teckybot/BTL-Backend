import express from "express";
import * as qualifierController from "../controllers/qualifierController.js";

const router = express.Router();

router.get("/check/:teamId", qualifierController.checkQualification);
router.post("/tempSave", qualifierController.tempSaveMembers);
router.post("/create-order", qualifierController.createQualifierOrder);
router.post("/verify-payment", qualifierController.verifyQualifierPayment);
router.get("/team-pdf/:teamId", qualifierController.getTeamPDF);

export default router; 