import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, default: "Pending" } // Pending, Confirmed, Completed, Cancelled
}, { timestamps: true });

export default mongoose.model("Appointment", appointmentSchema);
