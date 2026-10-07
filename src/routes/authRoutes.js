const router = require("express").Router();
const validate = require("../middleware/validate");
const { authenticate } = require("../middleware/auth");
const c = require("../controllers/authController");

router.post("/register", validate(c.registerSchema), c.register);
router.post("/login", validate(c.loginSchema), c.login);
router.get("/me", authenticate, (req, res) => {
  const u = req.user;
  res.json({ user: { id: u._id, name: u.name, email: u.email, role: u.role } });
});

module.exports = router;