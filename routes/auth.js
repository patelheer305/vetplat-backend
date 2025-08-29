import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "devsecret";
function createToken(user){
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

// register
router.post("/register", async (req,res)=>{
  try {
    const { email } = req.body;
    const existing = await User.findOne({ email });
    if(existing) return res.json({ error: "This email ID already exists. Try to log in." });
    const salt = bcrypt.genSaltSync(8);
    const hash = bcrypt.hashSync(req.body.password, salt);
    const u = new User({ ...req.body, passwordHash: hash });
    // doctors are not approved by default
    if(u.role === 'Doctor') u.approved = false;
    await u.save();
    res.json({ ok: true });
  } catch(e){
    console.error(e); res.json({ error: 'Failed' });
  }
});

// login
router.post("/login", async (req,res)=>{
  try {
    const { email, password } = req.body;
    const u = await User.findOne({ email });
    if(!u) return res.json({ error: 'Invalid credentials' });
    const match = bcrypt.compareSync(password, u.passwordHash || '');
    if(!match) return res.json({ error: 'Invalid credentials' });
    const token = createToken(u);
    res.json({ token, user: {
      id: u._id, firstName: u.firstName, lastName: u.lastName, role: u.role,
      village: u.village, district: u.district, approved: u.approved
    }});
  } catch(e){
    console.error(e); res.json({ error: 'Failed' });
  }
});

export default router;
