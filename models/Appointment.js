// models/Appointment.js
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ["online", "inperson"],
    required: true
  },
  slot: {
    type: String // for online appointments (e.g., "10:00 AM - 10:30 AM")
  },
  date: {
    type: Date // for in-person appointment date/time
  },
  village: {
    type: String
  },
  animalType: {
    type: String
  },
  symptoms: {
    type: String
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "suggested"],
    default: "pending"
  },
  suggestedDate: {
    type: Date
  },
  suggestedSlot: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Appointment", appointmentSchema);
