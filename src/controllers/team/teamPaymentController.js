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
    const { schoolRegId, teams } = req.body;

    if (!schoolRegId || !Array.isArray(teams) || teams.length === 0) {
      console.log("DEBUG: Missing required fields", req.body);
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const school = await School.findOne({ schoolRegId });
    if (!school) {
      console.log("DEBUG: School not found", schoolRegId);
      return res.status(404).json({ success: false, message: "School not found." });
    }

    const payerEmail = school.schoolEmail;

    const existingTeams = await Team.find({ schoolRegId });
    if (existingTeams.length + teams.length > 10) {
      console.log("DEBUG: Team limit exceeded", {
        existing: existingTeams.length,
        incoming: teams.length,
      });
      return res.status(400).json({
        success: false,
        message: `Cannot register more than 10 teams. Already: ${existingTeams.length}`,
      });
    }

    for (const team of teams) {
      if (
        !team.teamNumber ||
        !team.teamSize ||
        !team.event ||
        !Array.isArray(team.members) ||
        team.members.length !== team.teamSize
      ) {
        console.log("DEBUG: Invalid team data", team);
        return res.status(400).json({ success: false, message: `Invalid team data for team ${team.teamNumber}` });
      }
    }

    const totalAmount = teams.reduce((sum, t) => sum + t.teamSize * 499, 0);

    const order = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `team_reg_${Date.now()}`,
      notes: {
        schoolRegId,
        payerEmail,
        teams: JSON.stringify(teams),
      },
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

    // Verify Razorpay signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature." });
    }

    const teamPayment = await TeamPayment.findOne({ orderId: razorpay_order_id });

    if (!teamPayment) {
      return res.status(202).json({
        status: "pending",
        message: "Payment captured but registration is not complete yet. Please retry shortly.",
      });
    }

    // If webhook hasn't processed registration yet
    if (!teamPayment.paymentId) {
      return res.status(202).json({
        status: "processing",
        message: "Payment is verified but registration is still in progress. Try again soon.",
      });
    }

    // If registration completed
    if (teamPayment.verified) {
      const teams = await Team.find({ teamRegId: { $in: teamPayment.teamIds } }).lean();

      return res.status(200).json({
        success: true,
        status: "registered",
        schoolRegId: teamPayment.schoolRegId,
        teams: teams.map(t => ({
          teamRegId: t.teamRegId,
          teamNumber: t.teamNumber,
        })),
        pdfBase64: teamPayment.pdfBase64 || null,
        pdfFileName: teamPayment.pdfFileName || null,
        amount: teamPayment.amount,
        paymentDate: teamPayment.paidAt,
      });
    }

    // If failed
    if (teamPayment.paymentStatus === "failed") {
      return res.status(200).json({
        success: false,
        status: "failed",
        message: teamPayment.failureReason || "Payment failed.",
      });
    }

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

