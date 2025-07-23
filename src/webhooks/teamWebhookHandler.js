
import crypto from "crypto";
import TeamPayment from "../models/TeamPayment.js";
import { registerTeamsBatchService } from "../services/teamRegistrationService.js";

const handleTeamWebhook = async (req, res) => {
  console.log("Team webhook route hit");

  // Step 1: Read raw buffer for signature verification
  const rawBody = req.body.toString("utf8");
  const signature = req.headers["x-razorpay-signature"];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET_TEAM;

  // Step 2: Verify Razorpay signature
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSignature) {
    console.error("Invalid team webhook signature");
    console.error("Expected:", expectedSignature);
    console.error("Received:", signature);
    return res.status(400).send("Invalid signature");
  }

  // Step 3: Parse the webhook payload
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (err) {
    console.error("Invalid JSON in team webhook:", err);
    return res.status(400).send("Invalid JSON");
  }

  const event = body.event;

  // Handle Payment Captured
  if (event === "payment.captured") {
    const payment = body.payload.payment.entity;
    const orderId = payment.order_id;

    try {
      const teamPayment = await TeamPayment.findOne({ orderId });
      if (!teamPayment) {
        console.error(`No TeamPayment record found for order ${orderId}`);
        return res.status(200).send("No matching team payment record");
      }

      // Already processed? Ignore
      if (teamPayment.verified) {
        return res.status(200).send("Team payment already processed");
      }

      // Run the team registration logic (DB + Email + PDF)
      const result = await registerTeamsBatchService(
        teamPayment.schoolRegId,
        teamPayment.teamsSnapshot
      );

      // Save payment info + results
      teamPayment.verified = true;
      teamPayment.paymentId = payment.id;
      teamPayment.paidAt = new Date();
      teamPayment.paymentStatus = "paid";
      teamPayment.teamIds = result.teams.map(t => t.teamRegId);
      teamPayment.pdfBase64 = result.pdfBase64;
      teamPayment.pdfFileName = result.pdfFileName;
      await teamPayment.save();

      console.log(`Team registration complete for order ${orderId}`);
      return res.status(200).send("Team registration completed after payment");
    } catch (err) {
      console.error("Error in team payment webhook:", err);
      await TeamPayment.updateOne(
        { orderId },
        {
          $set: {
            paymentStatus: "failed",
            failureReason: err.message || "Team registration failed",
          },
        }
      );

      return res.status(500).send("Failed to register teams: " + err.message);
    }
  }

  // Handle Payment Failed
  if (event === "payment.failed") {
    const payment = body.payload.payment.entity;
    try {
      await TeamPayment.updateOne(
        { orderId: payment.order_id },
        {
          $set: {
            paymentStatus: "failed",
            failureReason: payment.error_description || "Unknown",
          },
        }
      );
      console.warn(`Team payment failed for order ${payment.order_id}`);
      return res.status(200).send("Team payment failure recorded");
    } catch (err) {
      console.error("Error marking team payment as failed:", err);
      return res.status(500).send("Error recording failure");
    }
  }

  // Other events (ignore)
  return res.status(200).send("Unhandled event");
};

export default handleTeamWebhook;
