// routes/appointment.js
const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const auth = require("../middleware/auth");

// Create new appointment
router.post("/", auth, async (req, res) => {
  try {
    const { doctorId, type, slot, date, village, animalType, symptoms } = req.body;

    if (!doctorId || !type) {
      return res.status(400).json({ message: "Doctor and type are required" });
    }

    let appointment = new Appointment({
      doctor: doctorId,
      farmer: req.user.id,
      type,
      slot: type === "online" ? slot : null,
      date: type === "inperson" ? date : null,
      village,
      animalType,
      symptoms,
      status: "pending"
    });

    await appointment.save();

    res.json(appointment);
  } catch (err) {
    console.error("Error creating appointment:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all appointments for logged-in user (farmer/doctor)
router.get("/my", auth, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === "Farmer") {
      filter.farmer = req.user.id;
    } else if (req.user.role === "Doctor") {
      filter.doctor = req.user.id;
    }
    const appointments = await Appointment.find(filter)
      .populate("doctor", "firstName lastName specialization")
      .populate("farmer", "firstName lastName village district state mobile");
    res.json(appointments);
  } catch (err) {
    console.error("Error fetching appointments:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Doctor updates appointment (accept/reject/suggest new time/date)
router.put("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "Doctor") {
      return res.status(403).json({ message: "Only doctors can update appointments" });
    }

    const { status, newDate, newSlot } = req.body;
    let appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    if (appointment.doctor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (status === "accepted") {
      appointment.status = "accepted";
    } else if (status === "rejected") {
      appointment.status = "rejected";
    } else if (status === "suggested") {
      appointment.status = "suggested";
      appointment.suggestedDate = newDate || appointment.date;
      appointment.suggestedSlot = newSlot || appointment.slot;
    }

    await appointment.save();
    res.json(appointment);
  } catch (err) {
    console.error("Error updating appointment:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Farmer confirms suggested time/date
router.put("/:id/confirm", auth, async (req, res) => {
  try {
    if (req.user.role !== "Farmer") {
      return res.status(403).json({ message: "Only farmers can confirm appointments" });
    }

    let appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    if (appointment.farmer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    appointment.status = "accepted";
    if (appointment.suggestedDate) appointment.date = appointment.suggestedDate;
    if (appointment.suggestedSlot) appointment.slot = appointment.suggestedSlot;
    appointment.suggestedDate = null;
    appointment.suggestedSlot = null;

    await appointment.save();
    res.json(appointment);
  } catch (err) {
    console.error("Error confirming appointment:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
