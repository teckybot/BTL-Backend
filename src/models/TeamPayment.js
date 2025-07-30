
import mongoose from "mongoose";

const teamPaymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true }, // Razorpay order ID
  paymentId: { type: String, unique: true, sparse: true }, // Razorpay payment ID (after success)

  schoolRegId: { type: String, required: true },           // Link to the school
  payerEmail: { type: String, required: true, lowercase: true }, // Will be school email

  amount: { type: Number, required: true },                // Total payment amount

  paidAt: { type: Date },                                  // Timestamp of successful payment
  paymentStatus: { type: String, default: "created" },     // created, paid, failed
  verified: { type: Boolean, default: false },             // Payment verified flag
  failureReason: { type: String },                         // If failed

  emailSent: { type: Boolean, default: false },            // Whether confirmation email was sent

  // After successful payment, these fields get filled:
  teamIds: { type: [String], default: [] },                // List of teamRegIds created
  pdfBase64: { type: String, default: null },              // PDF generated after registration
  pdfFileName: { type: String, default: null },            // PDF filename

  paymentMeta: { type: Object },                           // Any extra data from Razorpay
}, { timestamps: true });

export default mongoose.model("TeamPayment", teamPaymentSchema);
