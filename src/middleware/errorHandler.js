const { ZodError } = require("zod");

exports.notFound = (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
};

exports.errorHandler = (err, req, res, next) => {
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ field: i.path.join("."), message: i.message }));
    return res.status(400).json({ error: "Validation failed", details });
  }
  if (err.name === "CastError") return res.status(400).json({ error: "Invalid id" });
  if (err.code === 11000) return res.status(409).json({ error: "Duplicate value" });
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  if (err.status) return res.status(err.status).json({ error: err.message, details: err.details });

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};