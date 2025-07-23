import Razorpay from "razorpay";
import dotenv from 'dotenv';
import TeamPayment from "../../models/TeamPayment.js";
import Team from "../../models/Team.js";
import School from "../../models/School.js";
import crypto from "crypto";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createTeamPaymentOrder = async (req, res) => {
  try {
    const { schoolRegId, payerEmail, teams } = req.body;
    if (!schoolRegId || !payerEmail || !Array.isArray(teams) || teams.length === 0) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }
    // Validate school exists
    const school = await School.findOne({ schoolRegId });
    if (!school) {
      return res.status(404).json({ success: false, message: "School not found." });
    }
    // Validate teams (basic)
    for (const team of teams) {
      if (!team.teamNumber || !team.teamSize || !team.event || !Array.isArray(team.members) || team.members.length !== team.teamSize) {
        return res.status(400).json({ success: false, message: `Invalid team data for teamNumber ${team.teamNumber}` });
      }
    }
    // Calculate total amount
    const totalAmount = teams.reduce((sum, t) => sum + (t.teamSize * 499), 0);
    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: totalAmount * 100, // in paise
      currency: "INR",
      receipt: `team_reg_${Date.now()}`,
      notes: { schoolRegId, payerEmail },
    });
    // Save TeamPayment doc
    await TeamPayment.create({
      orderId: order.id,
      amount: totalAmount,
      payerEmail,
      schoolRegId,
      teamsSnapshot: teams,
      paymentStatus: 'created',
    });
    res.status(200).json({ success: true, order });
  } catch (err) {
    console.error("Team payment order creation failed:", err);
    res.status(400).json({ success: false, error: err.message });
  }
};


export const verifyTeamPaymentAndRegister = async (req, res) => {
  console.log("🔍 Team payment verify route hit");

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment data." });
    }

    // Step 1: Verify Razorpay signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature." });
    }

    // Step 2: Find the payment record (query by orderId, not paymentId)
    const teamPayment = await TeamPayment.findOne({ orderId: razorpay_order_id });

    if (!teamPayment) {
      return res.status(202).json({
        status: "pending",
        message: "Payment captured but not recorded yet. Please retry shortly.",
      });
    }

    // If webhook hasn't processed registration yet (race condition)
    if (!teamPayment.paymentId) {
      return res.status(202).json({
        status: "processing",
        message: "Payment is verified but registration is still in progress. Try again soon.",
      });
    }

    // If registration is done
    if (teamPayment.verified) {
      return res.status(200).json({
        success: true, // <-- Added for frontend compatibility
        status: "registered",
        schoolRegId: teamPayment.schoolRegId,
        teams: (teamPayment.teamIds || []).map((teamRegId, idx) => ({
          teamRegId,
          teamNumber: teamPayment.teamsSnapshot?.[idx]?.teamNumber || idx + 1,
        })),
        pdfBase64: teamPayment.pdfBase64 || null,
        pdfFileName: teamPayment.pdfFileName || null,
        amount: teamPayment.amount,
        paymentDate: teamPayment.paidAt,
      });
    }

    // If marked as failed
    if (teamPayment.paymentStatus === "failed") {
      return res.status(200).json({
        success: false,
        status: "failed",
        message: teamPayment.failureReason || "Payment failed.",
      });
    }

    // Otherwise still pending
    return res.status(202).json({
      success: false,
      status: "pending",
      message: "Payment is being processed. Please wait a few minutes.",
    });
  } catch (err) {
    console.error("Team payment verification failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

