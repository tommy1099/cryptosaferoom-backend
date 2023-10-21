const express = require("express");
const router = express.Router();
const multer = require("multer");
const NEWSDB = require("../../Models/NewsModel");
const fs = require("fs");
const path = require("path");

// Initialize the multer storage and upload objects as before
const uploadsDirectory = "./Public/news";
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

router.get("/", async (req, res) => {
  try {
    const news = await NEWSDB.find();
    res.json(news);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/create", upload.single("img"), async (req, res) => {
  try {
    const { title, desc1 } = req.body;
    const newItem = new NEWSDB({
      title: title,
      desc: { desc1: desc1 },
      img: `http://localhost:4444/news/${req.file.filename}`,
    });

    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.put("/imgUpdate/:itemId", upload.single("img"), async (req, res) => {
  const itemId = req.params.itemId;

  try {
    const updatedImgPath = `http://localhost:4444/images/${req.file.filename}`; //fgsdfsf

    const updatedItem = await NEWSDB.findByIdAndUpdate(
      itemId,
      { img: updatedImgPath },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    res
      .status(200)
      .json({ message: "Item updated successfully", item: updatedItem });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/bodyUpdate/:itemId", async (req, res) => {
  const itemId = req.params.itemId;
  const { desc1, title } = req.body;
  try {
    const updateFields = {};

    if (desc1 !== undefined) {
      updateFields["desc.desc1"] = desc1;
    }
    if (crypto !== undefined) {
      updateFields.title = title;
    }
    const updatedItem = await NEWSDB.findByIdAndUpdate(
      itemId,
      updateFields, // Use the updateFields object
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    res
      .status(200)
      .json({ message: "Item updated successfully", item: updatedItem });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/delete/:itemId", async (req, res) => {
  const itemId = req.params.itemId;
  console.log("itemId:", itemId);

  try {
    // Find the item first to get the image path
    const itemToDelete = await NEWSDB.findById(itemId);
    if (!itemToDelete) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Delete the image file from the storage
    const imagePath = path.join(
      "Public/news",
      itemToDelete.img.split("/").pop()
    );
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error("Error deleting image file:", err);
      } else {
        console.log("Image file deleted successfully");
      }
    });

    // Delete the item from the database
    await NEWSDB.deleteOne({ _id: itemId });
    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
