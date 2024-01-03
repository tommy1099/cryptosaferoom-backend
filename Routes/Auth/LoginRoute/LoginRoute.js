const express = require("express");
const USERDB = require("../../../Models/UsersModel");
const router = express.Router();
const Dencryptor = require("../../../Utils/Decryptor/Decryptor");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const upload = multer(); // initialize multer

// const verifyToken = require("../../../Middlewares/JWT/JWTMiddleware");
const {
  issueAccessToken,
  issueRefreshToken,
} = require("../../Token/TokenIssuer");
const isBan = require("../../../Middlewares/isBan");
require("dotenv").config();
router.post("/", isBan, upload.none(), async (req, res) => {
  console.log("here!");

  try {
    const { password, email } = req.body;
    const user = await USERDB.findOne({ "email.email": email });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check if the entered password matches the stored hashed password
    const isPasswordValid = await Dencryptor(password, user.password);

    if (isPasswordValid) {
      // If the password is valid, create a JWT and send it back to the client
      const accessToken = issueAccessToken({
        _id: user._id,
        username: user.username,
      });

      // Generate a refresh token
      const refreshToken = issueRefreshToken({
        _id: user._id,
        username: user.username,
      });

      await USERDB.findByIdAndUpdate(
        user._id,
        { refreshToken: refreshToken },
        { new: true }
      );
      res
        .status(200)
        .json({ accessToken: accessToken, refreshToken: refreshToken });
    } else {
      // Passwords don't match
      return res.status(401).json({ message: "Invalid password" });
    }
  } catch (err) {
    console.error("Error:", err); // Log the error for debugging
    res.status(500).send("Server Error");
  }
});
// // Protected resource endpoint using a GET request
// router.get("/protected-resource", verifyToken, async (req, res) => {
//   try {
//     // This is the authorization process.
//     // If the authentication token (JWT) is valid and the user is authorized, they can access this resource.

//     // Your code to handle the protected resource goes here...

//     res.status(200).json({ message: "Access granted to protected resource" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Server Error");
//   }
// });

module.exports = router;
