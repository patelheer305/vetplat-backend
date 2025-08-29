import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

function auth(req,res,next){
  const token = req.headers.authorization?.split(' ')[1];
  if(!token) return res.status(401).json({ error: 'Unauth' });
  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    req.user = decoded; next();
  }catch(e){ return res.status(401).json({ error: 'Unauth' }); }
}

router.get("/pending-doctors", auth, async (req,res)=>{
  if(req.user.role !== 'Admin') return res.json([]);
  const list = await User.find({ role: 'Doctor', approved: false }).select('-passwordHash');
  res.json(list);
});

router.post("/decide-doctor", auth, async (req,res)=>{
  if(req.user.role !== 'Admin') return res.json({ error: 'Not allowed' });
  const { doctorId, decision } = req.body;
  const doc = await User.findById(doctorId);
  if(!doc) return res.json({ error: 'Not found' });
  if(decision === 'approve') doc.approved = true;
  else doc.approved = false;
  await doc.save();
  res.json({ ok: true });
});

export default router;
