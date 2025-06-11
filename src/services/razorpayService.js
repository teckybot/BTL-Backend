
import Razorpay from "razorpay";

export const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
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
