import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import seed from "./seed.js";

// Import routes
import authRoutes from "./routes/auth.js";
import doctorRoutes from "./routes/doctors.js";
import appointmentRoutes from "./routes/appointments.js";
import adminRoutes from "./routes/admin.js";

// Load env only in development
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const app = express();
app.use(cors());
app.use(express.json());

// Root check
app.get("/", (req, res) => {
  res.send("Vet Platform Backend Running 🚀");
});

// Register APIs
app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/admin", adminRoutes);

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    await seed();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

startServer();
