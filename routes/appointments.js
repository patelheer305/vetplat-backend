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

// Doctor updates appointment status
router.put("/:id/status", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Doctor") return res.status(403).json({ error: "Only doctors can update status" });

    const { status } = req.body; // expected: Confirmed / Completed / Cancelled
    const validStatuses = ["Pending", "Confirmed", "Completed", "Cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, doctor: req.user._id },
      { status },
      { new: true }
    ).populate("farmer", "firstName lastName");

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.json({
      id: appointment._id,
      farmerName: appointment.farmer.firstName + " " + appointment.farmer.lastName,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Farmer can cancel their own appointment
router.put("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "Farmer") return res.status(403).json({ error: "Only farmers can cancel appointments" });

    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, farmer: req.user._id },
      { status: "Cancelled" },
      { new: true }
    ).populate("doctor", "firstName lastName");

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.json({
      id: appointment._id,
      doctorName: appointment.doctor.firstName + " " + appointment.doctor.lastName,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
