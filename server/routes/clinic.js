/* Faris's module: Time Slot + Appointment REST API. Auth is supplied by Elister.
   Usage: app.use('/api', createClinicRouter({ db, requireAuth, requireRole }));
   requireAuth must set req.user = { id: integer, role: 'patient'|'doctor'|'admin' }.
*/
const express = require('express');

function createClinicRouter({ db, requireAuth, requireRole }) {
  if (!db || !requireAuth || !requireRole) throw new Error('db and Elister auth middleware are required');
  const router = express.Router();
  const makeError = (status, message) => Object.assign(new Error(message), { status });
  const bad = (message) => { throw makeError(400, message); };
  const parseId = (value, name='id') => {
    if (!/^\d+$/.test(String(value)) || Number(value) < 1 || !Number.isSafeInteger(Number(value))) bad(`${name} must be a positive integer`);
    return Number(value);
  };
  const dateValue = (value, name) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) bad(`${name} must be UTC ISO format, e.g. 2026-11-25T09:00:00.000Z`);
    return value;
  };
  const noteValue = (value) => {
    if (value === undefined) return '';
    if (typeof value !== 'string' || value.length > 500) bad('notes must be a string of 500 characters or fewer');
    return value;
  };
  const wrap = fn => (req, res, next) => { try { fn(req,res); } catch(e) { next(e); } };
  const slotQuery = `SELECT s.id,s.doctor_id,u.full_name AS doctor_name,s.start_at,s.end_at,
    CASE WHEN EXISTS(SELECT 1 FROM appointments a WHERE a.slot_id=s.id AND a.status IN ('booked','done')) THEN 0 ELSE 1 END AS available
    FROM time_slots s JOIN doctor_profiles d ON d.id=s.doctor_id JOIN users u ON u.id=d.user_id`;
  const appointmentQuery = `SELECT a.id,a.slot_id,a.patient_id,p.full_name AS patient_name,a.status,a.notes,a.created_at,a.cancelled_at,
    s.doctor_id,s.start_at,s.end_at,u.full_name AS doctor_name
    FROM appointments a JOIN users p ON p.id=a.patient_id
    JOIN time_slots s ON s.id=a.slot_id JOIN doctor_profiles d ON d.id=s.doctor_id
    JOIN users u ON u.id=d.user_id`;
  const getSlot = id => db.prepare('SELECT * FROM time_slots WHERE id=?').get(id);
  const getAppointment = id => db.prepare(appointmentQuery + ' WHERE a.id=?').get(id);
  const ownsDoctor = (userId, doctorId) => !!db.prepare('SELECT 1 FROM doctor_profiles WHERE id=? AND user_id=?').get(doctorId,userId);
  const canEditSlot = (req, doctorId) => req.user.role === 'admin' || (req.user.role === 'doctor' && ownsDoctor(req.user.id,doctorId));
  const active = slotId => !!db.prepare("SELECT 1 FROM appointments WHERE slot_id=? AND status IN ('booked','done')").get(slotId);
  const ensureSlotTime = (start, end, doctorId, exceptId) => {
    if(Date.parse(end) <= Date.parse(start)) bad('end_at must be later than start_at');
    if(Date.parse(start) <= Date.now()) bad('The time slot must be in the future');
    const conflict = db.prepare('SELECT 1 FROM time_slots WHERE doctor_id=? AND start_at<? AND end_at>? AND id<>?').get(doctorId,end,start,exceptId || 0);
    if(conflict) throw makeError(409,'This doctor already has an overlapping time slot');
  };
  const cancellationAllowed = appointment => Date.parse(appointment.start_at)-Date.now() >= 24*60*60*1000;

  router.get('/specialties',wrap((req,res)=>res.json(db.prepare('SELECT * FROM specialties ORDER BY name').all())));
  router.get('/doctors',wrap((req,res)=>res.json(db.prepare(`SELECT d.id,d.user_id,u.full_name AS name,u.email, d.specialty_id,sp.name AS specialty,d.bio,d.room FROM doctor_profiles d JOIN users u ON u.id=d.user_id JOIN specialties sp ON sp.id=d.specialty_id ORDER BY u.full_name`).all())));

  // TIME SLOT: CREATE, READ, UPDATE, DELETE
  router.get('/slots',wrap((req,res)=>{
    const doctorId=req.query.doctor_id===undefined?null:parseId(req.query.doctor_id,'doctor_id');
    const sql=slotQuery+(doctorId?' WHERE s.doctor_id=?':'')+' ORDER BY s.start_at,s.id';
    res.json(doctorId?db.prepare(sql).all(doctorId):db.prepare(sql).all());
  }));
  router.get('/slots/:id',wrap((req,res)=>{
    const slot=db.prepare(slotQuery+' WHERE s.id=?').get(parseId(req.params.id));
    if(!slot)throw makeError(404,'Slot not found');res.json(slot);
  }));
  router.post('/slots',requireAuth,requireRole('doctor','admin'),wrap((req,res)=>{
    const doctorId=parseId(req.body.doctor_id,'doctor_id');
    if(!db.prepare('SELECT id FROM doctor_profiles WHERE id=?').get(doctorId))throw makeError(404,'Doctor profile not found');
    if(!canEditSlot(req,doctorId))throw makeError(403,'You cannot manage another doctor’s slots');
    const start=dateValue(req.body.start_at,'start_at'),end=dateValue(req.body.end_at,'end_at');
    const id=db.transaction(()=>{
      ensureSlotTime(start,end,doctorId);
      return Number(db.prepare('INSERT INTO time_slots(doctor_id,start_at,end_at) VALUES(?,?,?)').run(doctorId,start,end).lastInsertRowid);
    })();
    res.status(201).json(db.prepare(slotQuery+' WHERE s.id=?').get(id));
  }));
  router.put('/slots/:id',requireAuth,requireRole('doctor','admin'),wrap((req,res)=>{
    const id=parseId(req.params.id),slot=getSlot(id);
    if(!slot)throw makeError(404,'Slot not found');
    if(!canEditSlot(req,slot.doctor_id))throw makeError(403,'Not your slot');
    const start=dateValue(req.body.start_at,'start_at'),end=dateValue(req.body.end_at,'end_at');
    db.transaction(()=>{
      if(active(id))throw makeError(409,'Cannot edit a booked slot');
      ensureSlotTime(start,end,slot.doctor_id,id);
      db.prepare('UPDATE time_slots SET start_at=?,end_at=? WHERE id=?').run(start,end,id);
    })();
    res.json(db.prepare(slotQuery+' WHERE s.id=?').get(id));
  }));
  router.delete('/slots/:id',requireAuth,requireRole('doctor','admin'),wrap((req,res)=>{
    const id=parseId(req.params.id),slot=getSlot(id);
    if(!slot)throw makeError(404,'Slot not found');
    if(!canEditSlot(req,slot.doctor_id))throw makeError(403,'Not your slot');
    db.transaction(()=>{
      // Preserve booking history even when it has been cancelled.
      if(db.prepare('SELECT 1 FROM appointments WHERE slot_id=?').get(id))throw makeError(409,'Cannot delete a slot with appointment history');
      db.prepare('DELETE FROM time_slots WHERE id=?').run(id);
    })();
    res.status(204).end();
  }));

  // APPOINTMENT: CREATE, READ, UPDATE (reschedule / notes), DELETE (cancel)
  router.get('/appointments',requireAuth,wrap((req,res)=>{
    let sql=appointmentQuery,params=[];
    if(req.user.role==='patient'){sql+=' WHERE a.patient_id=?';params=[req.user.id];}
    if(req.user.role==='doctor'){sql+=' WHERE d.user_id=?';params=[req.user.id];}
    res.json(db.prepare(sql+' ORDER BY s.start_at,a.id').all(...params));
  }));
  router.get('/appointments/:id',requireAuth,wrap((req,res)=>{
    const a=getAppointment(parseId(req.params.id));
    if(!a)throw makeError(404,'Appointment not found');
    if(req.user.role!=='admin' && a.patient_id!==req.user.id && !(req.user.role==='doctor' && ownsDoctor(req.user.id,a.doctor_id)))throw makeError(403,'Forbidden');
    res.json(a);
  }));
  router.post('/appointments',requireAuth,requireRole('patient'),wrap((req,res)=>{
    const slotId=parseId(req.body.slot_id,'slot_id'),notes=noteValue(req.body.notes);
    const id=db.transaction(()=>{
      const slot=getSlot(slotId);
      if(!slot)throw makeError(404,'Slot not found');
      if(Date.parse(slot.start_at)<=Date.now())bad('Cannot book a past slot');
      if(active(slotId))throw makeError(409,'Slot is already booked');
      return Number(db.prepare('INSERT INTO appointments(slot_id,patient_id,notes) VALUES(?,?,?)').run(slotId,req.user.id,notes).lastInsertRowid);
    })();
    res.status(201).json(getAppointment(id));
  }));
  router.put('/appointments/:id',requireAuth,requireRole('patient','admin'),wrap((req,res)=>{
    const id=parseId(req.params.id),slotId=parseId(req.body.slot_id,'slot_id'),notes=noteValue(req.body.notes);
    const result=db.transaction(()=>{
      const a=getAppointment(id);if(!a)throw makeError(404,'Appointment not found');
      if(req.user.role==='patient'&&a.patient_id!==req.user.id)throw makeError(403,'Not your appointment');
      if(a.status!=='booked')throw makeError(409,'Only booked appointments can be edited');
      if(!cancellationAllowed(a))throw makeError(409,'Changes close 24 hours before appointment');
      const slot=getSlot(slotId);if(!slot)throw makeError(404,'Slot not found');
      if(Date.parse(slot.start_at)<=Date.now()+24*60*60*1000)throw makeError(409,'New slot must be at least 24 hours away');
      if(slotId!==a.slot_id&&active(slotId))throw makeError(409,'New slot is already booked');
      db.prepare('UPDATE appointments SET slot_id=?,notes=? WHERE id=?').run(slotId,notes,id);
      return getAppointment(id);
    })();res.json(result);
  }));
  const cancel=(req,res)=>{
    const id=parseId(req.params.id);
    const result=db.transaction(()=>{
      const a=getAppointment(id);if(!a)throw makeError(404,'Appointment not found');
      if(req.user.role==='patient'&&a.patient_id!==req.user.id)throw makeError(403,'Not your appointment');
      if(a.status!=='booked')throw makeError(409,'Only booked appointments can be cancelled');
      if(!cancellationAllowed(a))throw makeError(409,'Cancellation closes 24 hours before appointment');
      db.prepare("UPDATE appointments SET status='cancelled',cancelled_at=? WHERE id=?").run(new Date().toISOString(),id);
      return getAppointment(id);
    })();res.json(result);
  };
  router.delete('/appointments/:id',requireAuth,requireRole('patient','admin'),wrap(cancel));
  router.patch('/appointments/:id/cancel',requireAuth,requireRole('patient','admin'),wrap(cancel));
  router.patch('/appointments/:id/done',requireAuth,requireRole('doctor','admin'),wrap((req,res)=>{
    const id=parseId(req.params.id),a=getAppointment(id);
    if(!a)throw makeError(404,'Appointment not found');
    if(req.user.role==='doctor'&&!ownsDoctor(req.user.id,a.doctor_id))throw makeError(403,'Not your patient');
    if(a.status!=='booked')throw makeError(409,'Only booked appointments can be marked done');
    db.prepare("UPDATE appointments SET status='done' WHERE id=?").run(id);res.json(getAppointment(id));
  }));
  router.get('/doctors/:id/schedule',requireAuth,requireRole('doctor','admin'),wrap((req,res)=>{
    const doctorId=parseId(req.params.id);
    if(!canEditSlot(req,doctorId))throw makeError(403,'Not your schedule');
    if(!db.prepare('SELECT id FROM doctor_profiles WHERE id=?').get(doctorId))throw makeError(404,'Doctor profile not found');
    const date=req.query.date;
    if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))bad('date query must be YYYY-MM-DD (UTC)');
    res.json(db.prepare(appointmentQuery+' WHERE s.doctor_id=? AND substr(s.start_at,1,10)=? ORDER BY s.start_at').all(doctorId,date));
  }));
  return router;
}
module.exports={createClinicRouter};
