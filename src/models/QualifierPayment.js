import mongoose from "mongoose";

const memberSnapshotSchema = new mongoose.Schema({
  name: { type: String, required: true },
  classGrade: { type: String, required: true },
  gender: { type: String, required: true },
}, { _id: false });

const qualifierPaymentSchema = new mongoose.Schema({
  teamRegId: { type: String, required: true },
  amount: { type: Number, required: true },
  razorpayOrderId: { type: String, required: true },
  paymentStatus: { type: String, required: true }, // e.g., 'created', 'paid', 'failed'
  membersSnapshot: { type: [memberSnapshotSchema], required: true },
  paidAt: { type: Date },
}, { timestamps: true });

export default mongoose.model("QualifierPayment", qualifierPaymentSchema); 