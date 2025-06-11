import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit"; // You forgot to import this
import schoolRoutes from "./routes/schoolRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import razorpayWebhookHandler from "./webhooks/razorpaywebhook2.js";

dotenv.config();

const app = express();

// Middleware for webhook route raw body parsing
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), razorpayWebhookHandler);

// CORS and JSON parsing for all other routes
app.use(cors());
app.use(express.json());

// Global rate limiter - 100 requests per 15 minutes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for sensitive payment route - 10 requests per 15 minutes
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many payment requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply global limiter AFTER body parsing & cors
app.use(globalLimiter);

// Apply strict limiter ONLY on /api/payments/create-order POST route
app.use("/api/payments/create-order", strictLimiter);

// Routes
app.use("/api/school", schoolRoutes);
app.use("/api/payments", paymentRoutes);

// Health check route
app.get("/", (req, res) => {
  res.send("BTL School Registration Backend is Running");
});

// Connect MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB Connection Failed:", err.message);
    process.exit(1);
  });
