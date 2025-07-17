import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";
import schoolRoutes from "./routes/school/schoolRoutes.js";
import paymentRoutes from "./routes/payment/paymentRoutes.js";
import razorpayWebhookHandler from "./webhooks/razorpaywebhook2.js";

import teamRoutes from "./routes/team/teamRoutes.js";
import checkpointRoutes from "./routes/team/checkpointRoutes.js";
import eventRoutes from "./routes/team/eventRoutes.js";

import submissionRoutes from "./routes/videouploadRoutes/submissionRoutes.js";
import qualifierRoutes from "./routes/qualifierRoutes.js";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();

// Configure CORS with specific options
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:5173', 'http://127.0.0.1:5173','https://btlregistrationsystem.vercel.app','https://www.bharatteckleague.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


// Logger Middleware 
const enableDevLogging = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const morgan = (await import('morgan')).default;
    app.use(morgan('dev'));
  } else {
    app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const ms = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${res.statusCode} ${req.originalUrl} (${ms}ms)`);
      });
      next();
    });
  }
};
await enableDevLogging();

// Middleware for webhook route raw body parsing
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), razorpayWebhookHandler);

// Increase JSON payload limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Serve sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  const sitemapPath = path.join(process.cwd(), 'src', 'public', 'sitemap.xml');
  res.setHeader('Content-Type', 'application/xml');
  fs.createReadStream(sitemapPath).pipe(res);
});

// Routes
app.use("/api/school", schoolRoutes);
app.use("/api/payments", paymentRoutes);

//Team Routes
app.use("/api/team", teamRoutes);
app.use("/api/checkpoint", checkpointRoutes);
app.use("/api/events", eventRoutes);

//File submission Routes
app.use("/api/submission", submissionRoutes);
app.use("/api/qualifier", qualifierRoutes);

// Log every incoming request: method and URL
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

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
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB Connection Failed:", err.message);
    process.exit(1);
  });
