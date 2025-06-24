import express from "express";
import { createSchoolPaymentOrder } from "../../controllers/paymentController.js";
import handleRazorpayWebhook from "../../webhooks/razorpaywebhook2.js";
import { verifyPayment } from "../../controllers/verifyPaymentController.js";

const router = express.Router();

router.post("/create-order", createSchoolPaymentOrder); 
router.post("/verify", verifyPayment);
// router.post("/webhook", handleRazorpayWebhook); 

export default router;
