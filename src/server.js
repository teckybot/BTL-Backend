import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";
import schoolRoutes from "./routes/schoolRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import razorpayWebhookHandler from "./webhooks/razorpaywebhook2.js";

import teamRoutes from "./routes/team/teamRoutes.js";
import checkpointRoutes from "./routes/team/checkpointRoutes.js";
import eventRoutes from "./routes/team/eventRoutes.js";

dotenv.config();

const app = express();

// Configure CORS with specific options
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:5173', 'http://127.0.0.1:5173','https://btlregistrationsystem.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Increase JSON payload limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware for webhook route raw body parsing
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), razorpayWebhookHandler);

// Development mode rate limiter - more lenient
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More requests allowed in development
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for sensitive payment route
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 100,
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

//Team Routes
app.use("/api/team", teamRoutes);
app.use("/api/checkpoint", checkpointRoutes);
app.use("/api/events", eventRoutes);

// Health check route
app.get("/", (req, res) => {
  res.send("BTL School Registration Backend is Running");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
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
