import express from "express";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all doctors
router.get("/", authMiddleware, async (req, res) => {
  try {
    const doctors = await User.find({ role: "Doctor" }).select("-password");
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
