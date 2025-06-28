import Razorpay from "razorpay";
import crypto from "crypto";

export const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


export const createRazorpayOrder = async (amount, receiptId,notes = {}) => {
  const options = {
    amount: amount * 100, // convert to paise
    currency: "INR",
    receipt: receiptId,
    notes, // include school form data here
  };

  try {
  return await razorpayInstance.orders.create(options);
} catch (error) {
  console.error("Error creating Razorpay order:", error);
  throw error;
}

};

export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(orderId + "|" + paymentId);
  const generatedSignature = hmac.digest("hex");
  return generatedSignature === signature;
};
