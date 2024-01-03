const express = require("express");
const USERDB = require("../../../Models/UsersModel");
const fs = require("fs");
const router = express.Router();
const multer = require("multer");
const Encryptor = require("../../../Utils/Encryptor/Encryptor");
const { v4: uuidv4 } = require("uuid");
const {
  issueAccessToken,
  issueRefreshToken,
} = require("../../Token/TokenIssuer");
// const uploadsDirectory = "./public/userPic";

// if (!fs.existsSync(uploadsDirectory)) {
//   fs.mkdirSync(uploadsDirectory);
// }

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadsDirectory);
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + "-" + file.originalname);
//   },
// });
// const upload = multer({ storage: storage });

router.post("/create", async (req, res) => {
  try {
    const { username, password, email } = req.body;
    console.log("password:", password);
    const userBasedOnEmail = await USERDB.findOne({ "email.email": email });
    const userBasedOnUsername = await USERDB.findOne({ username });
    if (userBasedOnEmail) {
      res.status(300).send("email already taken");
    }
    if (userBasedOnUsername) {
      res.status(300).send("username already taken");
    }

    const user = new USERDB({
      username: username,
      password: await Encryptor(password),
      email: {
        email: email,
        confirm: false,
        emailToken: {
          confirmationToken: "",
          isUsedToken: false,
        },
      },
      plan: {
        remaining: 0,
        maxDays: 0,
        type: "free",
      },
      refcode: { userCode: uuidv4(), enteredCodes: [] },
      pic: "",
      phone: "",
      firstname: "",
      lastname: "",
      orders: [],
      role: "basic",
      ban: false,
    });
    const savedItem = await user.save();

    const accessToken = issueAccessToken({
      _id: user._id,
      username: user.username,
    });
    const refreshToken = issueRefreshToken({
      _id: user._id,
      username: user.username,
    });
    await USERDB.findByIdAndUpdate(
      user._id,
      { refreshToken: refreshToken },
      { new: true }
    );
    res.status(201).json({
      accessToken: accessToken,
      refreshToken: refreshToken,
      message: "user added successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
