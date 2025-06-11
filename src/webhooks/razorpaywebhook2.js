// controllers/razorpayWebhookHandler2.js
import crypto from "crypto";
import School from "../models/School.js";
import Payment from "../models/Payment.js";
import { generateSchoolId } from "../utils/idGenerator.js";
import { getNextSchoolSequence, incrementSchoolSequence } from "../services/sequenceService.js";
import { sendSchoolBatchEmail } from "../services/mailService.js";
import { stateDistrictCodeMap } from "../constants/stateDistrictMap.js";

const handleRazorpayWebhook = async (req, res) => {
  console.log("Webhook route hit");

  // Step 1: Read raw buffer from request body
  const rawBody = req.body.toString("utf8");
  const signature = req.headers["x-razorpay-signature"];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // Step 2: Verify Signature
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // console.log("Signature:", signature);
  // console.log("Secret:", secret);
  // console.log("Raw Body:", rawBody);
  // console.log("Expected Signature:", expectedSignature);

  if (signature !== expectedSignature) {
    console.log("Invalid webhook signature");
    return res.status(400).send("Invalid signature");
  }

  // Step 3: Parse the JSON body into an object
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (err) {
    console.error("Failed to parse webhook body JSON:", err);
    return res.status(400).send("Invalid JSON");
  }

  const event = body.event;

  //  PAYMENT SUCCESS
  if (event === "payment.captured") {
    const payment = body.payload.payment.entity;
    const notes = payment.notes || {};
    const schoolEmail = notes.schoolEmail;

    try {
      const existingPayment = await Payment.findOne({ paymentId: payment.id });

      // Email already sent — ignore
      if (existingPayment?.emailSent) {
        return res.status(200).send("Already handled");
      }

      let schoolRegId;

      // If payment exists but no email sent — send email now
      if (existingPayment) {
        schoolRegId = existingPayment.schoolId;
      } else {
        const existingSchool = await School.findOne({ schoolEmail });
        if (existingSchool) {
          schoolRegId = existingSchool.schoolRegId;
        } else {
          const stateCode = stateDistrictCodeMap[notes.state]?.code;
          const districtCode = stateDistrictCodeMap[notes.state]?.districts[notes.district];
          if (!stateCode || !districtCode) throw new Error("Invalid state/district");

          const nextSeq = await getNextSchoolSequence(stateCode, districtCode);
          schoolRegId = generateSchoolId(notes.state, notes.district, nextSeq);

          const newSchool = new School({ ...notes, schoolRegId });
          await newSchool.save();
          await incrementSchoolSequence(stateCode, districtCode);
        }

        await Payment.create({
          schoolEmail,
          schoolId: schoolRegId,
          orderId: payment.order_id,
          paymentId: payment.id,
          amount: payment.amount / 100,
          verified: true,
          paymentDate: new Date(),
          emailSent: false,
        });
      }

      // Send email if not already sent
      await sendSchoolBatchEmail({
        recipients: [{
          email: schoolEmail,
          name: notes.coordinatorName,
          mergeData: {
            school_reg_id: schoolRegId,
            district: notes.district,
            school_name: notes.schoolName,
            coordinator_name: notes.coordinatorName,
            state: notes.state,
            coordinator_number: notes.coordinatorNumber,
            principal_name: notes.principalName,
          },
        }],
        templateKey: "2518b.70f888d667329f26.k1.2cf64680-3e18-11f0-b2ad-ae9c7e0b6a9f.197263fbae8",
      });

      await Payment.updateOne({ paymentId: payment.id }, { $set: { emailSent: true } });

      return res.status(200).send("Email sent after payment captured");
    } catch (err) {
      console.error("Webhook handler error (payment captured):", err);
      return res.status(500).send("Error");
    }
  }

  // PAYMENT FAILURE
  if (event === "payment.failed") {
    const payment = body.payload.payment.entity;
    const notes = payment.notes || {};
    const schoolEmail = notes.schoolEmail || "UNKNOWN";

    try {
      const existingPayment = await Payment.findOne({ paymentId: payment.id });
      if (existingPayment) return res.status(200).send("Already handled");

      await Payment.create({
        schoolEmail,
        orderId: payment.order_id,
        paymentId: payment.id,
        amount: payment.amount / 100,
        verified: false,
        paymentDate: new Date(),
        failureReason: payment.error_description || "Unknown",
      });

      console.warn(`Payment failed for ${schoolEmail}`);
      return res.status(200).send("Payment failure recorded");
    } catch (err) {
      console.error("Webhook handler error (payment failed):", err);
      return res.status(500).send("Failure error");
    }
  }

  return res.status(200).send("Unhandled event");
};

export default handleRazorpayWebhook;
