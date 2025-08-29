import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  mode: String, // Online | InPerson
  date: String,
  slot: String,
  symptoms: String,
  animalType: String,
  status: { type:String, default: "Pending" }, // Pending, Accepted, Rejected, Suggested, Confirmed, Completed
  paymentStatus: { type: String, default: "Pending" }, // Pending, Paid
  meetLink: String,
  doctorNote: String,
  fromVillage: String // to show to doctor for in-person pending requests
}, { timestamps: true });

export default mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);
