const Event = require("../models/Event");
const Registration = require("../models/Registration");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const canManage = require("../utils/canManage");

exports.registerForEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await Event.findById(id);
  if (!existing) throw new AppError(404, "Event not found");
  if (existing.date <= new Date()) throw new AppError(409, "This event has already happened");

  // Atomic: check capacity AND take the seat in a single database operation
  const event = await Event.findOneAndUpdate(
    { _id: id, $expr: { $lt: ["$registeredCount", "$capacity"] } },
    { $inc: { registeredCount: 1 } },
    { new: true }
  );
  if (!event) throw new AppError(409, "Event is full");

  try {
    const registration = await Registration.create({ userId: req.user._id, eventId: id });
    res.status(201).json({ registration, seatsLeft: event.capacity - event.registeredCount });
  } catch (err) {
    // Creating the registration failed, so give the seat back
    await Event.updateOne({ _id: id }, { $inc: { registeredCount: -1 } });
    if (err.code === 11000) throw new AppError(409, "You are already registered for this event");
    throw err;
  }
});

exports.cancelRegistration = asyncHandler(async (req, res) => {
  const registration = await Registration.findOneAndDelete({
    userId: req.user._id,
    eventId: req.params.id,
  });
  if (!registration) throw new AppError(404, "You are not registered for this event");

  await Event.updateOne({ _id: req.params.id }, { $inc: { registeredCount: -1 } });
  res.status(204).send();
});

exports.myRegistrations = asyncHandler(async (req, res) => {
  const registrations = await Registration.find({ userId: req.user._id })
    .populate("eventId")
    .sort({ createdAt: -1 });
  res.json({ registrations });
});

// Organizer / admin only
exports.eventAttendees = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new AppError(404, "Event not found");
  if (!canManage(req.user, event)) {
    throw new AppError(403, "Only the organizer or an admin can view attendees");
  }

  const registrations = await Registration.find({ eventId: event._id })
    .populate("userId", "name email")
    .sort({ createdAt: 1 });

  res.json({
    event: { id: event._id, title: event.title, capacity: event.capacity, registered: event.registeredCount },
    attendees: registrations.map((r) => ({ ...r.userId.toObject(), registeredAt: r.createdAt })),
  });
});