// models/TeamPayment.js
import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  classGrade: { type: String, required: true },
  gender: { type: String, required: true },
}, { _id: false });

const teamSnapshotSchema = new mongoose.Schema({
  teamNumber: { type: Number, required: true },
  teamSize: { type: Number, required: true },
  event: { type: String, required: true },
  members: { type: [memberSchema], required: true },
}, { _id: false });

const teamPaymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  paymentId: { type: String, unique: true, sparse: true },

  schoolRegId: { type: String, required: true },
  payerEmail: { type: String, required: true, lowercase: true },
  teamsSnapshot: { type: [teamSnapshotSchema], required: true },

  amount: { type: Number, required: true },
  paidAt: { type: Date },
  paymentStatus: { type: String, default: 'created' }, // created, paid, failed
  verified: { type: Boolean, default: false },
  failureReason: { type: String }, // for failed payments

  emailSent: { type: Boolean, default: false },

  // NEW FIELDS (for webhook registration results)
  teamIds: { type: [String], default: [] },  // Registered team IDs
  pdfBase64: { type: String, default: null }, // Registration PDF
  pdfFileName: { type: String, default: null },

  paymentMeta: { type: Object }, // Razorpay metadata if needed
}, { timestamps: true });

export default mongoose.model("TeamPayment", teamPaymentSchema);
