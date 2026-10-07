const router = require("express").Router();
const User = require("../models/User");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const { authenticate, authorize } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

router.get(
  "/stats",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const [users, events, registrations] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Registration.countDocuments(),
    ]);
    res.json({ users, events, registrations });
  })
);

module.exports = router;
