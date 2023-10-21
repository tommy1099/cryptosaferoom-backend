const express = require("express");
const router = express.Router();
const multer = require("multer");
const SIGNALDB = require("../../Models/SignalModel");
const fs = require("fs");
const path = require("path");

// Initialize the multer storage and upload objects as before
const uploadsDirectory = "./Public/images";
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
    const signals = await SIGNALDB.find();
    res.json(signals);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/create", upload.single("img"), async (req, res) => {
  try {
    const { crypto, desc1, desc2, desc3, tag1, tag2 } = req.body;
    const newItem = new SIGNALDB({
      crypto: crypto,
      desc: {
        desc1: `Target Price 1: ${desc1}%`,
        desc2: `Target Price 2: ${desc2}%`,
        desc3: `Target Price 3: ${desc3}%`,
      },
      tags: { tag1: tag1, tag2: tag2 },
      img: `http://localhost:4444/images/${req.file.filename}`,
      expire: 5000,
      blur: false,
      state: false,
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

    const updatedItem = await SIGNALDB.findByIdAndUpdate(
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

router.put("/stateUpdate/:itemId", async (req, res) => {
  const itemId = req.params.itemId;
  const stateValue = req.body.state;

  try {
    const tempBool = stateValue === "successfull";
    console.log("tempBool:", tempBool);
    const updatedItem = await SIGNALDB.findByIdAndUpdate(
      itemId,
      {
        state: tempBool,
        blur: true,
      },
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
  const { desc1, desc2, desc3, tag1, tag2, crypto } = req.body;
  try {
    const updateFields = {};

    if (desc1 !== undefined) {
      updateFields["desc.desc1"] = desc1;
    }

    if (desc2 !== undefined) {
      updateFields["desc.desc2"] = desc2;
    }

    if (desc3 !== undefined) {
      updateFields["desc.desc3"] = desc3;
    }

    if (tag1 !== undefined) {
      updateFields["tags.tag1"] = tag1;
    }

    if (tag2 !== undefined) {
      updateFields["tags.tag2"] = tag2;
    }

    if (crypto !== undefined) {
      updateFields.crypto = crypto;
    }
    const updatedItem = await SIGNALDB.findByIdAndUpdate(
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
    const itemToDelete = await SIGNALDB.findById(itemId);
    if (!itemToDelete) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Delete the image file from the storage
    const imagePath = path.join(
      "Public/images",
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
    await SIGNALDB.deleteOne({ _id: itemId });
    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
