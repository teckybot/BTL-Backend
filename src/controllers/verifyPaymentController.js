import crypto from "crypto";
import Payment from "../models/Payment.js";

export const verifyPayment = async (req, res) => {
  console.log('🔍 Payment verify route hit (Read-Only)');

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing required payment data" });
    }

    // Verify Razorpay Signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    // Check if payment exists in DB
    const payment = await Payment.findOne({ paymentId: razorpay_payment_id });

    if (!payment) {
      return res.status(202).json({ status: "pending", message: "Payment received but not yet processed. Please wait a few minutes." });
    }

    if (payment.verified) {
      return res.status(200).json({
        status: "registered",
        schoolRegId: payment.schoolId,
        emailSent: payment.emailSent,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
      });
    }

    return res.status(200).json({
      status: "failed",
      message: payment.failureReason || "Payment verification failed",
    });

  } catch (err) {
    console.error("❌ Payment verify error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
