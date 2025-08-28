import express from "express";
import Appointment from "../models/Appointment.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Book appointment (Farmer only)
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Farmer") {
      return res.status(403).json({ error: "Only farmers can book appointments" });
    }
    const { doctorId, date, time } = req.body;

    const appointment = new Appointment({
      farmer: req.user._id,
      doctor: doctorId,
      date,
      time
    });

    await appointment.save();
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Farmer's own appointments
router.get("/my", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Farmer") return res.status(403).json({ error: "Forbidden" });

    const list = await Appointment.find({ farmer: req.user._id })
      .populate("doctor", "firstName lastName specialization")
      .sort({ createdAt: -1 });

    res.json(list.map(a => ({
      doctorName: a.doctor.firstName + " " + a.doctor.lastName,
      specialization: a.doctor.specialization,
      date: a.date,
      time: a.time,
      status: a.status
    })));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Doctor's incoming appointments
router.get("/incoming", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Doctor") return res.status(403).json({ error: "Forbidden" });

    const list = await Appointment.find({ doctor: req.user._id })
      .populate("farmer", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json(list.map(a => ({
      farmerName: a.farmer.firstName + " " + a.farmer.lastName,
      date: a.date,
      time: a.time,
      status: a.status
    })));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
