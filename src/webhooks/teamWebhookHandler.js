import crypto from "crypto";
import TeamPayment from "../models/TeamPayment.js";
import { registerTeamsBatchService } from "../services/teamRegistrationService.js";

const handleTeamWebhook = async (req, res) => {
  console.log("Team webhook route hit");

  try {
    const rawBody = req.body.toString("utf8");
    const signature = req.headers["x-razorpay-signature"];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET_TEAM;

    // Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Invalid team webhook signature");
      return res.status(400).send("Invalid signature");
    }

    // Parse Razorpay payload
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (err) {
      console.error("Invalid JSON in team webhook:", err);
      return res.status(400).send("Invalid JSON");
    }

    const event = body.event;

    // --- Payment Captured ---
    if (event === "payment.captured") {
      const payment = body.payload.payment.entity;
      const orderId = payment.order_id;
      const schoolRegId = payment.notes?.schoolRegId;
      const teamsRaw = payment.notes?.teams;
      let teams;

      try {
        teams = teamsRaw ? JSON.parse(teamsRaw) : [];
      } catch {
        console.error("Invalid teams data in Razorpay notes for", orderId);
        return res.status(400).send("Invalid teams data");
      }

      // Allow multiple registrations per school
      const existingPayment = await TeamPayment.findOne({
        orderId,
        paymentStatus: "paid",
        verified: true,
      });

      if (existingPayment) {
        console.warn(`Duplicate webhook for order ${orderId}`);
        return res.status(200).send("Payment already processed for this order.");
      }


      try {
        // Register the teams (DB + email + PDF)
        const result = await registerTeamsBatchService(schoolRegId, teams);

        // Save the TeamPayment record (only now, after successful payment)
        const teamPayment = new TeamPayment({
          orderId,
          paymentId: payment.id,
          schoolRegId,
          payerEmail: payment.email || "", // fallback if missing
          amount: payment.amount / 100,
          paidAt: new Date(),
          paymentStatus: "paid",
          verified: true,
          teamIds: result.teams.map(t => t.teamRegId),
          pdfBase64: result.pdfBase64,
          pdfFileName: result.pdfFileName,
          paymentMeta: payment,
        });
        await teamPayment.save();

        console.log(`Team registration completed for ${schoolRegId}`);
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
          },
          { upsert: true } // Ensure we still log failed payment
        );
        return res.status(500).send("Failed to register teams: " + err.message);
      }
    }

    // --- Payment Failed ---
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
          },
          { upsert: true }
        );
        console.warn(`Team payment failed for order ${payment.order_id}`);
        return res.status(200).send("Team payment failure recorded");
      } catch (err) {
        console.error("Error marking team payment as failed:", err);
        return res.status(500).send("Error recording failure");
      }
    }

    return res.status(200).send("Unhandled event");
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).send("Internal Server Error");
  }
};

export default handleTeamWebhook;
