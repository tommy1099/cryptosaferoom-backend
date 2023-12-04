const express = require("express");
const { verifyToken } = require("../Middlewares/JWT/JWTMiddleware");

// Middleware to protect a route
function authenticate(req, res, next) {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authorization.substring(7); // Remove 'Bearer ' prefix
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  req.user = payload;
  next();
}
module.exports = authenticate;
