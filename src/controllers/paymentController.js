import Razorpay from "razorpay";
import dotenv from 'dotenv';
import { validateSchoolFormData } from "../services/schoolValidationService.js";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createSchoolPaymentOrder = async (req, res) => {
  try {
    const formData = req.body.notes || req.body;
    
    // Step 1: Validate input
    await validateSchoolFormData(formData);

    // Step 2: Prepare notes (all string values)
    const cleanedNotes = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        cleanedNotes[key] = String(value);
      }
    });


    // Step 3: Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Number(process.env.SCHOOL_REG_FEE || 1) * 100, // in paise
      currency: "INR",
      receipt: `school_reg_${Date.now()}`,
      notes: cleanedNotes,
    });

    res.status(200).json({ success: true, order });
  } catch (err) {
    console.error("Payment order creation failed:", err);
    res.status(400).json({ success: false, error: err.message });
  }
};
