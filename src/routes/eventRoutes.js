const router = require("express").Router();
const validate = require("../middleware/validate");
const { authenticate } = require("../middleware/auth");
const c = require("../controllers/eventController");
const r = require("../controllers/registrationController");

router.get("/", c.listEvents);
router.get("/:id", c.getEvent);
router.post("/", authenticate, validate(c.createSchema), c.createEvent);
router.put("/:id", authenticate, validate(c.updateSchema), c.updateEvent);
router.delete("/:id", authenticate, c.deleteEvent);

router.post("/:id/register", authenticate, r.registerForEvent);
router.delete("/:id/register", authenticate, r.cancelRegistration);
router.get("/:id/registrations", authenticate, r.eventAttendees);

module.exports = router;