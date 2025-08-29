import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// public: list doctors (approved only)
router.get("/", async (req, res) => {
  const { specialization, location } = req.query;
  const q = { role: 'Doctor', approved: true };
  if(specialization) q.specialization = { $regex: specialization, $options: 'i' };
  if(location) q.$or = [{ district: { $regex: location, $options: 'i' } }, { state: { $regex: location, $options: 'i' } }];
  const docs = await User.find(q).select('-passwordHash');
  res.json(docs);
});

// single doctor
router.get("/:id", async (req,res)=>{
  const d = await User.findById(req.params.id).select('-passwordHash');
  res.json(d);
});

// middleware to authenticate doctor
function auth(req,res,next){
  const token = req.headers.authorization?.split(' ')[1];
  if(!token) return res.status(401).json({ error: 'Unauth' });
  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    req.user = decoded;
    next();
  }catch(e){ return res.status(401).json({ error: 'Unauth' }); }
}

// add availability (doctor only)
router.post("/:id/availability", auth, async (req,res)=>{
  try {
    if(req.user.id !== req.params.id) return res.json({ error: 'Not allowed' });
    const { date, slots } = req.body;
    const doc = await User.findById(req.params.id);
    if(!doc) return res.json({ error: 'Doctor not found' });
    // replace or add
    const idx = doc.availability.findIndex(a => a.date === date);
    if(idx >= 0) doc.availability[idx].slots = slots;
    else doc.availability.push({ date, slots });
    await doc.save();
    res.json({ ok: true });
  } catch(e){ console.error(e); res.json({ error: 'Failed' }); }
});

export default router;
