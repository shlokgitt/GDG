const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { authenticate } = require("./middleware/auth");
const { myRegistrations } = require("./controllers/registrationController");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/", (req, res) =>
  res.json({
    name: "Event Management API",
    status: "running",
    health: "/health",
    events: "/events",
  })
);
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/auth", require("./routes/authRoutes"));
app.use("/events", require("./routes/eventRoutes"));
app.get("/me/registrations", authenticate, myRegistrations);

app.use(notFound); // must come after all routes
app.use(errorHandler); // must be last

module.exports = app;