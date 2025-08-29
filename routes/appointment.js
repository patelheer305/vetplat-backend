import express from "express";
import jwt from "jsonwebtoken";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";

const router = express.Router();

function authMiddleware(req,res,next){
  const token = req.headers.authorization?.split(' ')[1];
  if(!token) return res.status(401).json({ error: 'Unauth' });
  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    req.user = decoded;
    next();
  }catch(e){ return res.status(401).json({ error: 'Unauth' }); }
}

// create appointment (request)
router.post("/", authMiddleware, async (req,res)=>{
  try {
    const body = req.body;
    // store limited farmer info for doctor to see before payment
    const farmer = await User.findById(body.farmerId);
    const appt = new Appointment({
      farmerId: body.farmerId,
      doctorId: body.doctorId,
      mode: body.mode,
      date: body.date,
      slot: body.slot,
      symptoms: body.symptoms,
      animalType: body.animalType,
      status: 'Pending',
      fromVillage: farmer?.village || ''
    });
    await appt.save();
    res.json(appt);
  } catch(e){ console.error(e); res.json({ error: 'Failed' }); }
});

// get appointments (filter)
router.get("/", authMiddleware, async (req,res)=>{
  // filter by farmerId or doctorId
  const { farmerId, doctorId } = req.query;
  const q = {};
  if(farmerId) q.farmerId = farmerId;
  if(doctorId) q.doctorId = doctorId;
  const list = await Appointment.find(q).populate('farmerId','firstName lastName mobile village').populate('doctorId','firstName lastName specialization');
  // convert to nicer object
  const out = list.map(a => ({
    _id: a._id, mode: a.mode, date: a.date, slot: a.slot, symptoms: a.symptoms, animalType: a.animalType,
    status: a.status, paymentStatus: a.paymentStatus, meetLink: a.meetLink, doctorNote: a.doctorNote,
    farmer: a.farmerId, doctor: a.doctorId, fromVillage: a.fromVillage
  }));
  res.json(out);
});

// doctor decide accept/reject
router.post("/:id/decide", authMiddleware, async (req,res)=>{
  try {
    const { decision } = req.body; // accept | reject
    const appt = await Appointment.findById(req.params.id);
    if(!appt) return res.json({ error: 'Not found' });
    // only doctor can decide
    if(req.user.id !== String(appt.doctorId)) return res.json({ error: 'Not allowed' });
    if(decision === 'accept'){
      appt.status = 'Accepted';
      await appt.save();
      // notify farmer (simulate) - in real system send push/whatsapp
      return res.json({ ok: true });
    } else if(decision === 'reject'){
      appt.status = 'Rejected';
      await appt.save();
      return res.json({ ok: true });
    } else {
      res.json({ error: 'Unknown decision' });
    }
  } catch(e){ console.error(e); res.json({ error: 'Failed' }); }
});

// doctor suggests new time
router.post("/:id/suggest", authMiddleware, async (req,res)=>{
  try {
    const appt = await Appointment.findById(req.params.id);
    if(!appt) return res.json({ error: 'Not found' });
    if(req.user.id !== String(appt.doctorId)) return res.json({ error: 'Not allowed' });
    appt.status = 'Suggested';
    appt.date = req.body.date;
    appt.slot = req.body.slot;
    await appt.save();
    return res.json({ ok: true });
  } catch(e){ console.error(e); res.json({ error: 'Failed' }); }
});

// farmer accepts suggested -> then payment required like accept flow
router.post("/:id/accept-suggestion", authMiddleware, async (req,res)=>{
  try {
    const appt = await Appointment.findById(req.params.id);
    if(!appt) return res.json({ error: 'Not found' });
    if(req.user.id !== String(appt.farmerId)) return res.json({ error: 'Not allowed' });
    appt.status = 'Accepted';
    await appt.save();
    res.json({ ok: true });
  } catch(e){ console.error(e); res.json({ error: 'Failed' }); }
});

// Simulate payment endpoint -> mark appointment paid, generate meet link, reveal full farmer details to doctor
router.post("/:id/pay", authMiddleware, async (req,res)=>{
  try {
    const appt = await Appointment.findById(req.params.id);
    if(!appt) return res.json({ error: 'Not found' });
    // Only farmer can pay
    if(req.user.id !== String(appt.farmerId)) return res.json({ error: 'Not allowed' });
    appt.paymentStatus = 'Paid';
    appt.status = 'Confirmed';
    // generate a mock Google Meet link (in real -> create via Google API or calendar)
    appt.meetLink = `https://meet.google.com/${Math.random().toString(36).slice(2,8)}`;
    await appt.save();
    res.json({ ok: true, meetLink: appt.meetLink });
  } catch(e){ console.error(e); res.json({ error: 'Failed' }); }
});

// admin-only: list all appointments
router.get("/all", authMiddleware, async (req,res)=>{
  // allow admin only
  if(req.user.role !== 'Admin') return res.json({ error: 'Not allowed' });
  const list = await Appointment.find({}).populate('farmerId','firstName lastName mobile email village').populate('doctorId','firstName lastName specialization');
  res.json(list);
});

export default router;
