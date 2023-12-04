const express = require("express");
const router = express.Router();
const path = require("path");

router.get("signals/:filename", (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, "Public/signals", filename);
  console.log(__dirname);
  res.sendFile(imagePath);
});
router.get("news/:filename", (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, "Public/news", filename);
  console.log(__dirname);
  res.sendFile(imagePath);
});
router.get("userPic/:filename", (req, res) => {
  const filename = req.params.filename;
  console.log(filename);
  const imagePath = path.join(__dirname, "Public/userPic", filename);
  console.log(__dirname);
  res.sendFile(imagePath);
});

module.exports = router;
