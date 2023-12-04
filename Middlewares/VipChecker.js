const USERDB = require("../Models/UsersModel"); // Import your User model

const vipChecker = async (req, res, next) => {
  console.log("in the vipcheck:", req.user);
  try {
    // Find the user by their ID
    const user = await USERDB.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check the subscription count
    if (user.plan.remaining <= 0) {
      user.plan.type = "free";
    } else {
      user.plan.type = "VIP";
    }

    // Save the updated user
    await user.save();

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Error updating VIP status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = vipChecker;
