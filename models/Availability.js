import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true },
  time: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model("Availability", availabilitySchema);
