// Assuming you have a User model
const USERDB = require("../Models/UsersModel");

// Middleware function to check if the user is an admin
const isBan = async (req, res, next) => {
  try {
    // Fetch the user from the database
    const user = await USERDB.findOne({ "email.email": req.body.email });

    if (!user) {
      // If user not found, handle accordingly (e.g., send an error response)
      return res.status(401).json({ error: "User not found" });
    }

    // Check if the user has the 'admin' role
    if (user.ban) {
      // If not an admin, handle accordingly (e.g., send an error response)
      return res.status(403).json({ error: "Access denied. You are banned." });
    }

    // If the user is an admin, continue to the next middleware or route handler
    next();
  } catch (error) {
    // Handle errors, e.g., database errors
    console.error(error);
    res.status(500).json({ error: "Internal Server Error blah blah blah" });
  }
};

module.exports = isBan;
