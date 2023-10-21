const express = require("express");
const router = express.Router();
const path = require("path");

router.get("signals/:filename", (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, "Public/images", filename);
  res.sendFile(imagePath);
});

module.exports = router;
