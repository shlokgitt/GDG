const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { authenticate } = require("./middleware/auth");
const { myRegistrations } = require("./controllers/registrationController");

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/auth", require("./routes/authRoutes"));
app.use("/events", require("./routes/eventRoutes"));
app.use("/admin", require("./routes/adminRoutes"));

app.get("/me/registrations", authenticate, myRegistrations);

app.use(notFound);  
app.use(errorHandler);  // must be last

module.exports = app;