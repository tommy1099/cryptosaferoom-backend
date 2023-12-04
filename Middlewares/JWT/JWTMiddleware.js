const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const token = req.header("x-auth-token"); // Assuming you send the token in the 'x-auth-token' header

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided" });
  }

  try {
    const decoded = jwt.verify(token, "cryptosaferoom");

    // Check if the token is expired
    if (Date.now() >= decoded.exp * 1000) {
      // The token is expired

      // You can check if the user is still active here, for example, by checking their last activity timestamp
      // If the user is still active, generate a new token with an extended expiration time
      // Otherwise, return an error and ask the user to log in again

      // Example: if user's last activity was within the last 15 minutes, generate a new token
      const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
      if (decoded.lastActivity > fifteenMinutesAgo) {
        const newToken = jwt.sign(
          {
            id: decoded.id,
            username: decoded.username,
            lastActivity: Date.now(),
          },
          "cryptosaferoom",
          { expiresIn: "1h" } // You can extend the expiration time
        );

        // Attach the new token to the response header
        res.setHeader("x-new-token", newToken);
      } else {
        // User is not active, so require them to log in again
        return res
          .status(401)
          .json({ message: "Token has expired. Please log in again." });
      }
    }

    req.user = decoded;
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
  next();
}

module.exports = verifyToken;
