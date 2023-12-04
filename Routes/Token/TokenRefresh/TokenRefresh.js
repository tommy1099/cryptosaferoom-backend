const express = require("express");
const router = express.Router();
const USERDB = require("../../../Models/UsersModel");
const { verifyToken, issueAccessToken } = require("../TokenIssuer");
router.post("/refresh-token", verifyToken, async (req, res) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const refreshToken = authorization.substring(7);

  try {
    // Verify the refresh token
    const payload = req.user;
    // Refresh token is valid; issue a new access token
    const newAccessToken = issueAccessToken({
      _id: payload._id,
      username: payload.username,
      // Add any other necessary data from the payload
    });

    return res.json({ accessToken: newAccessToken });
  } catch (error) {
    // Token verification failed
    console.error("Token verification failed:", error);
    return res
      .status(401)
      .json({ message: "Invalid or expired refresh token" });
  }
});

module.exports = router;
