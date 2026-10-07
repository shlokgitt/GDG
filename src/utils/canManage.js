module.exports = (user, event) =>
  user.role === "admin" || event.createdBy.equals(user._id);