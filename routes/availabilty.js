import express from "express";
import Availability from "../models/Availability.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Add availability (Doctor only)
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Doctor") return res.status(403).json({ error: "Only doctors can set availability" });

    const { date, time } = req.body;
    const slot = new Availability({ doctor: req.user._id, date, time });
    await slot.save();
    res.json(slot);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get doctor's availability
router.get("/my", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Doctor") return res.status(403).json({ error: "Forbidden" });

    const slots = await Availability.find({ doctor: req.user._id }).sort({ date: 1 });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
