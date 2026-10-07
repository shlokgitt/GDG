const { z } = require("zod");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const canManage = require("../utils/canManage");

const futureDate = z.coerce.date({ invalid_type_error: "Invalid date format" }).refine((d) => d > new Date(), "Date must be in the future");

exports.createSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters"),
  description: z.string().trim().optional(),
  date: futureDate,
  location: z.string().trim().min(2, "Location is required"),
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
});

exports.updateSchema = exports.createSchema
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, "Provide at least one field to update");

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.createEvent = asyncHandler(async (req, res) => {
  const event = await Event.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ event });
});

exports.listEvents = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

  const filter = {};
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), "i");
    filter.$or = [{ title: rx }, { description: rx }];
  }
  
  if (req.query.location) {
    filter.location = new RegExp(escapeRegex(req.query.location), "i");
  }

  const dateQuerySchema = z.object({
    from: z.coerce.date({ invalid_type_error: "Invalid 'from' date format" }).optional(),
    to: z.coerce.date({ invalid_type_error: "Invalid 'to' date format" }).optional()
  });

  const parsedDates = dateQuerySchema.parse({
    from: req.query.from,
    to: req.query.to
  });

  if (parsedDates.from || parsedDates.to) {
    filter.date = {};
    if (parsedDates.from) filter.date.$gte = parsedDates.from;
    if (parsedDates.to) filter.date.$lte = parsedDates.to;
  } else if (req.query.upcoming === "true") {
    filter.date = { $gte: new Date() };
  }

  const [events, total] = await Promise.all([
    Event.find(filter).sort({ date: 1 }).skip((page - 1) * limit).limit(limit),
    Event.countDocuments(filter),
  ]);

  res.json({ events, page, limit, total, totalPages: Math.ceil(total / limit) });
});

exports.getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new AppError(404, "Event not found");
  res.json({ event });
});

exports.updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new AppError(404, "Event not found");
  if (!canManage(req.user, event)) throw new AppError(403, "You can only edit your own events");

  if (req.body.capacity !== undefined && req.body.capacity < event.registeredCount) {
    throw new AppError(
      409,
      `Capacity cannot be lower than current registrations (${event.registeredCount})`
    );
  }

  Object.assign(event, req.body);
  await event.save();
  res.json({ event });
});

exports.deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new AppError(404, "Event not found");
  if (!canManage(req.user, event)) throw new AppError(403, "You can only delete your own events");

  await event.deleteOne();
  await Registration.deleteMany({ eventId: event._id }); // no orphaned registrations
  res.status(204).send();
});