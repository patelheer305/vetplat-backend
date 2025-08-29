import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  village: String,
  tehsil: String,
  district: String,
  state: String,
  mobile: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: { type: String, default: "Farmer" }, // Farmer, Doctor, Admin
  specialization: String,
  feesTeleconsult: Number,
  feesVisit: Number,
  approved: { type: Boolean, default: false }, // doctors need admin approval
  availability: [
    {
      date: String, // YYYY-MM-DD
      slots: [String]
    }
  ]
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);
