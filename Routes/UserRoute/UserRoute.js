const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const mongoose = require("mongoose");
const path = require("path");
const sendConfirmationEmail = require("../../Utils/Email/EmailService");
// Import your middleware for verifying tokens
const {
  verifyToken,
  verifyAndMarkAsUsedToken,
} = require("../../Routes/Token/TokenIssuer"); // Replace with your actual middleware
const isAdmin = require("../../Middlewares/AdminCheckerMiddleware");

// Import your User model
const USERDB = require("../../Models/UsersModel"); // Replace with your actual User model import
const vipChecker = require("../../Middlewares/VipChecker");
const {
  frontendAddress,
  backendAddress,
} = require("../../Utils/Addresses/Addresses");
const uploadsDirectory = "./Public/userPic";
if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDirectory);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });
router.get("/all", verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await USERDB.findById(req.user._id);
    const allUsers = await USERDB.find();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log("all users:", allUsers);
    res.status(200).json(allUsers);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
// This route is responsible for fetching user data based on the access token
// router.get("/profile", verifyToken, vipChecker, async (req, res) => {
//   // The verifyToken middleware has already ensured that the token is valid
//   // You can access the user ID from req.user.id

//   try {
//     const user = await USERDB.findById(req.user._id);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     // Check if pic, firstname, lastname, or phone fields exist and are valid
//     const userData = {
//       username: user.username,
//       email: user.email.email,
//       confirm: user.email.confirm,
//       plan: user.plan,
//       refcode: user.refcode.userCode,
//       enteredCodes: user.refcode.enteredCodes,
//       isConfirmed: user.email.confirm,
//       // Add more user data fields as needed
//     };
//     if (user.plan === "VIP" || user.plan === "vip") {
//       userData.sub = user.sub;
//     }
//     if (user.pic) {
//       // Check if pic exists and is valid, then add it to the response
//       userData.pic = user.pic;
//     }

//     if (user.firstname) {
//       // Check if firstname exists and is valid, then add it to the response
//       userData.firstname = user.firstname;
//     }

//     if (user.lastname) {
//       // Check if lastname exists and is valid, then add it to the response
//       userData.lastname = user.lastname;
//     }

//     if (user.phone) {
//       // Check if phone exists and is valid, then add it to the response
//       userData.phone = user.phone;
//     }

//     res.status(200).json(userData);
//   } catch (error) {
//     console.error("Error fetching user data:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// });
router.get("/profile", verifyToken, vipChecker, async (req, res) => {
  try {
    const user = await USERDB.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = {
      username: user.username,
      email: {
        email: user.email.email,
        confirm: user.email.confirm,
      },

      plan: {
        type: user.plan.type,
        remaining: user.plan.remaining,
        maxDays: user.plan.maxDays,
      },
      refcode: {
        userCode: user.refcode.userCode,
        enteredCodes: user.refcode.enteredCodes,
      },
      orders: user.orders,
      ban: user.ban,
    };

    if (user.pic) {
      userData.pic = user.pic;
    }

    if (user.firstname) {
      userData.firstname = user.firstname;
    }

    if (user.lastname) {
      userData.lastname = user.lastname;
    }

    if (user.phone) {
      userData.phone = user.phone;
    }

    res.status(200).json(userData);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
router.put("/update", verifyToken, upload.single("img"), async (req, res) => {
  try {
    const user = await USERDB.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { email, firstname, lastname, phone, newPass, confirmPass } =
      req.body;
    if (req.file && req.file.filename) {
      user.pic = `${backendAddress()}/userPic/${req.file.filename}`;
    }
    if (email) {
      user.email.confirm = false;
      await user.save();
      console.log("user email:", user.email);
      console.log("body email:", email);
      user.email.email = email;
    }
    if (firstname) {
      console.log("user firstname:", user.firstname);
      console.log("body firstname:", firstname);
      user.firstname = firstname;
    }
    if (lastname) {
      console.log("user lastname:", user.lastname);
      console.log("body lastname:", lastname);
      user.lastname = lastname;
    }
    if (phone) {
      console.log("user phone:", user.phone);
      console.log("body phone:", phone);
      user.phone = phone;
    }
    if (newPass && confirmPass && newPass === confirmPass) {
      user.newPass = await Encryptor(newPass);
    }
    const updatedUser = await USERDB.findByIdAndUpdate(req.user._id, user, {
      new: true,
    });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res
      .status(200)
      .json({ message: "User updated successfully", item: updatedUser });
  } catch (error) {
    console.error("Error updating user data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put("/refcode", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { refcode } = req.body;
    const user = await USERDB.findById(req.user._id).session(session);
    console.log("user:", user);
    const friend = await USERDB.findOne({
      "refcode.userCode": refcode,
    }).session(session);
    console.log("friend:", friend);

    if (!user) {
      // User not found
      await abortAndEndSession(session, res, 404, "User not found");
      return;
    }
    console.log("req.body:", req.body.refcode);
    console.log("entered refcode:", refcode);
    console.log("user's own refcode:", user.refcode);
    if (refcode === user.refcode.userCode || !refcode) {
      // Invalid code
      await abortAndEndSession(session, res, 400, "Invalid Code");
      return;
    }
    if (!friend.email.confirm) {
      await abortAndEndSession(
        session,
        res,
        401,
        "Friend's email no confirmed"
      );
      return;
    }
    if (user.refcode.enteredCodes.includes(refcode)) {
      // Invalid code
      await abortAndEndSession(
        session,
        res,
        400,
        "Cant enter a code more than once"
      );
      return;
    }
    // Update the user's refcode
    await USERDB.findByIdAndUpdate(
      { _id: user._id },
      { sub: user.sub + 7, plan: "VIP" },

      { new: true }
    ).session(session);
    // Update the refcode for the target user
    await USERDB.findByIdAndUpdate(
      { _id: friend._id },
      { sub: friend.sub + 3, plan: "VIP" },
      { new: true }
    ).session(session);
    // Commit the transaction and end the session

    await USERDB.findByIdAndUpdate(
      { _id: user._id },
      {
        $push: { "refcode.enteredCodes": friend.refcode.userCode },
      },
      { new: true, session: session } // Use the same session here
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Code applied successfully" });
  } catch (error) {
    // Handle errors
    await abortAndEndSession(session, res, 500, "Internal Server Error");
    console.error("Error with user code:", error);
  }
});
router.post("/confirmEmail", verifyToken, async (req, res) => {
  const user = await USERDB.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  // return res.send({"message": user.email.email});
  sendConfirmationEmail(user.email.email, user);
});
async function abortAndEndSession(session, res, status, message) {
  if (session.transaction.state !== 0) {
    await session.abortTransaction();
  }
  session.endSession();
  res.status(status).json({ message });
}
router.get(
  "/confirmed/:email/:token",
  verifyAndMarkAsUsedToken,
  async (req, res) => {
    const email = req.params.email;

    try {
      // Use req.user as needed
      const user = await USERDB.findOne({ "email.email": email });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.email.confirm = true;
      await user.save();

      res.redirect(`${frontendAddress()}/profile`);
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  }
);
//only admin can do this
router.delete("/delete/:itemId", verifyToken, isAdmin, async (req, res) => {
  const itemId = req.params.itemId;
  console.log("itemId:", itemId);
  try {
    // Find the item first to get the image path
    const userToDelete = await USERDB.findOne({ username: itemId });
    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }
    // Delete the image file from the storage
    const imagePath = path.join(
      "Public/userPic",
      userToDelete.pic.split("/").pop()
    );
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error("Error deleting image file:", err);
      } else {
        console.log("Image file deleted successfully");
      }
    });
    // Delete the item from the database
    await USERDB.deleteOne({ username: itemId });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting User:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error, couldnt delete the User" });
  }
});
router.post("/ban/:itemId", verifyToken, isAdmin, async (req, res) => {
  const itemId = req.params.itemId;
  console.log("itemId:", itemId);
  try {
    // Find the item first to get the image path
    const userToBan = await USERDB.findOne({ username: itemId });
    if (!userToBan) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete the item from the database
    if (userToBan.ban) userToBan.ban = false;
    else {
      userToBan.ban = true;
    }
    userToBan.save();
    res.status(200).json({ message: "User banned successfully" });
  } catch (error) {
    console.error("Error banning User:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error, couldnt delete the User" });
  }
});
router.post(
  "/planUpdate/:itemId",
  verifyToken,
  vipChecker,
  isAdmin,
  upload.none(),
  async (req, res) => {
    const itemId = req.params.itemId;
    const { maxDays, remaining } = req.body;
    console.log("itemId:", itemId);
    try {
      // Find the item first to get the image path
      const user = await USERDB.findOne({ username: itemId });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Delete the item from the database
      if (maxDays.length !== 0 && remaining.length === 0) {
        user.plan.maxDays = Number(maxDays) + user.plan.remaining;
        user.plan.remaining = Number(maxDays) + user.plan.remaining;
      } else if (maxDays.length === 0 && remaining.length !== 0) {
        user.plan.maxDays = user.plan.maxDays + Number(remaining);
        user.plan.remaining = user.plan.remaining + Number(remaining);
      } else if (maxDays.length !== 0 && remaining.length !== 0) {
        user.plan.maxDays = Number(maxDays);
        user.plan.remaining = Number(remaining);
      } else {
        return res.status(301).send("Error updating user's plan");
      }
      if (user.plan.remaining <= 0) {
        user.plan.type = "free";
      } else {
        user.plan.type = "VIP";
      }

      user.save();
      res.status(200).json({ message: "User plan updated successfully" });
    } catch (error) {
      console.error("Error updating user's plan User:", error);
      res
        .status(500)
        .json({ error: "Internal Server Error, couldnt delete the User" });
    }
  }
);
async function abortAndEndSession(session, res, status, message) {
  if (session.transaction.state !== 0) {
    await session.abortTransaction();
  }
  session.endSession();
  res.status(status).json({ message });
}
module.exports = router;
