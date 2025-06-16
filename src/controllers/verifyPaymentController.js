
import crypto from "crypto";
import School from "../models/School.js";
import Payment from "../models/Payment.js";
import { generateSchoolId } from "../utils/idGenerator.js";
import { getCurrentSchoolSequence, incrementSchoolSequence } from "../services/sequenceService.js";
import { stateDistrictCodeMap } from "../constants/stateDistrictMap.js";
import { sendSchoolBatchEmail } from "../services/mailService.js";

export const verifyPayment = async (req, res) => {
  console.log('Payment verify route hit');
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      registrationData
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !registrationData) {
      return res.status(400).json({ message: "Missing required payment or registration data" });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");


    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const { state, district, schoolEmail } = registrationData;

    const existingSchool = await School.findOne({ schoolEmail });
    if (existingSchool) {
      return res.status(409).json({ message: "School already registered", schoolRegId: existingSchool.schoolRegId });
    }

    const stateCode = stateDistrictCodeMap[state]?.code;
    const districtCode = stateDistrictCodeMap[state]?.districts[district];
    if (!stateCode || !districtCode) throw new Error("Invalid state/district");

    const sequence = await getCurrentSchoolSequence(stateCode, districtCode);
    const schoolRegId = generateSchoolId(state, district, sequence + 1);

    const newSchool = new School({ ...registrationData, schoolRegId });
    await newSchool.save();

    await Payment.create({
      schoolEmail,
      schoolId: schoolRegId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: 999,
      verified: true,
      paymentDate: new Date(),
      emailSent: false,
    });

    await incrementSchoolSequence(stateCode, districtCode);

    // Send confirmation email
    await sendSchoolBatchEmail({
      recipients: [{
        email: schoolEmail,
        name: registrationData.coordinatorName,
        mergeData: {
          school_reg_id: schoolRegId,
          district,
          school_name: registrationData.schoolName,
          coordinator_name: registrationData.coordinatorName,
          state,
          coordinator_number: registrationData.coordinatorNumber,
          principal_name: registrationData.principalName,
        },
      }],
      templateKey: "2518b.70f888d667329f26.k1.2cf64680-3e18-11f0-b2ad-ae9c7e0b6a9f.197263fbae8",
    });

    await Payment.updateOne({ paymentId: razorpay_payment_id }, { $set: { emailSent: true } });

    res.status(200).json({ message: "Verified", schoolRegId });
  } catch (err) {
    console.error("❌ Payment verify error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
