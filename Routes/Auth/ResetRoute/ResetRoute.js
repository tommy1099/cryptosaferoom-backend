const express = require("express");
const USERDB = require("../../../Models/UsersModel");
const router = express.Router();
const Dencryptor = require("../../../Utils/Decryptor/Decryptor");
const jwt = require("jsonwebtoken");
const verifyToken = require("../../../Middlewares/JWT/JWTMiddleware");
router.post("/", async (req, res) => {
  try {
    
    res.status(200).json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});


module.exports = router;
