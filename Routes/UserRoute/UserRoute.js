const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const mongoose = require("mongoose");
const sendConfirmationEmail = require("../../Utils/Email/EmailService");
// Import your middleware for verifying tokens
const { verifyToken } = require("../../Routes/Token/TokenIssuer"); // Replace with your actual middleware

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
      refcode: user.refcode.userCode,
      enteredCodes: user.refcode.enteredCodes,
      orders: user.orders,
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
  sendConfirmationEmail(user.email.email);
});
async function abortAndEndSession(session, res, status, message) {
  if (session.transaction.state !== 0) {
    await session.abortTransaction();
  }
  session.endSession();
  res.status(status).json({ message });
}
router.get("/confirmed/:email", async (req, res) => {
  const email = req.params.email;
  try {
    const user = await USERDB.findOne({ "email.email": email });
    if (!user) {
      // If the user is not found, return an error
      return res.status(404).json({ message: "User not found" });
    }
    user.email.confirm = true;
    await user.save();

    res.redirect(`${frontendAddress()}/profile`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
async function abortAndEndSession(session, res, status, message) {
  if (session.transaction.state !== 0) {
    await session.abortTransaction();
  }
  session.endSession();
  res.status(status).json({ message });
}
module.exports = router;
