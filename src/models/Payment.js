// models/Payment.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  schoolId: {
    type: String,
    default: null, // Only available after success
  },
  schoolEmail: {
    type: String,
    required: true,
    lowercase: true,
  },
  orderId: String,
  paymentId: {
    type: String,
    unique: true, // prevent duplicates
  },
  verified: {
    type: Boolean,
    default: false,
  },
  emailSent: { type: Boolean, default: false },
  amount: Number,
  paymentDate: Date,
  failureReason: String, // nullable, only set on failure
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);
