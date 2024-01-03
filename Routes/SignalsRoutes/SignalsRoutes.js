const express = require("express");
const router = express.Router();
const multer = require("multer");
const SIGNALDB = require("../../Models/SignalModel");
const USERDB = require("../../Models/UsersModel");
const fs = require("fs");
const path = require("path");
const authenticate = require("../../Middlewares/Authenticate");
const vipChecker = require("../../Middlewares/VipChecker");
const http = require("http");
const { backendAddress } = require("../../Utils/Addresses/Addresses");
const isAdmin = require("../../Middlewares/AdminCheckerMiddleware");
const { verifyToken } = require("../../Routes/Token/TokenIssuer");
// Initialize the multer storage and upload objects as before
const uploadsDirectory = "./Public/signals";
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

router.get("/all", verifyToken, async (req, res) => {
  try {
    const signals = await SIGNALDB.find();
    const user = await USERDB.findById(req.user._id);
    if (user.role === "admin" || user.plan.type === "VIP") {
      signals.forEach((signal) => (signal.vip = false));
    }
    res.status(200).json(signals);
  } catch (error) {
    console.error("Error fetching signals:", error);
    res.status(500).json({ error: "Internal Server Error blah blah blah" });
  }
});
router.get("/", verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Get the requested page number
    const perPage = parseInt(req.query.perPage) || 14; // Set a default or get the requested items per page
    const startIndex = (page - 1) * perPage;
    const endIndex = page * perPage;

    const signals = await SIGNALDB.find({ blur: true })
      .skip(startIndex)
      .limit(perPage);
    const allSignals = await SIGNALDB.find();
    const user = await USERDB.findById(req.user._id);
    if (user.role === "admin") {
      signals.forEach((signal) => (signal.vip = false));
    }

    const result = {
      signals: signals,
      pageInfo: {
        currentPage: page,
        totalPages: Math.ceil(allSignals.length / perPage),
      },
    };

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching signals:", error);
    res.status(500).json({ error: "Internal Server Error blah blah blah" });
  }
});
router.get("/home", async (req, res) => {
  try {
    const signals = await SIGNALDB.find();
    signals.forEach((signal) => (signal.blur = true));
    res.status(200).json(signals);
  } catch (error) {
    console.error("Error fetching signals:", error);
    res.status(500).json({ error: "Internal Server Error blah blah blah" });
  }
});
//only admin can do this
router.post(
  "/create",
  upload.single("img"),
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const {
        crypto,
        desc1,
        desc2,
        desc3,
        tag1,
        tag2,
        vip,
        entryPoint,
        alertDesc,
        tp1Price,
        tp2Price,
        tp3Price,
      } = req.body;

      // Set default value for entryPoint if it's undefined
      const defaultEntryPoint = entryPoint || "now";

      // Set alertDesc to empty string if it's undefined
      const defaultAlertDesc = alertDesc || "";

      const newItem = new SIGNALDB({
        crypto: crypto,
        entryPoint: defaultEntryPoint,
        desc: {
          desc1: desc1,
          desc2: desc2,
          desc3: desc3,
        },
        alertDesc: defaultAlertDesc,
        tags: { tag1: tag1, tag2: tag2 },
        img: `${backendAddress()}/signals/${req.file.filename}`,
        vip: vip === "on",
        blur: false,
        state: false,
        tp: {
          tp1: false,
          tp2: false,
          tp3: false,
        },
        tpPrices: {
          tp1Price: tp1Price,
          tp2Price: tp2Price,
          tp3Price: tp3Price,
        },
      });
      const savedItem = await newItem.save();
      res.status(201).json(savedItem);
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  }
);

//only admin can do this
router.put(
  "/imgUpdate/:itemId",
  upload.single("img"),
  verifyToken,
  isAdmin,
  async (req, res) => {
    const itemId = req.params.itemId;
    try {
      const updatedImgPath = `${backendAddress()}/signals/${req.file.filename}`; //fgsdfsf

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
  }
);

//only admin can do this
router.put("/signalUpdate/:itemId", verifyToken, isAdmin, async (req, res) => {
  const itemId = req.params.itemId;

  const stateValue = req.body.state;
  //   return res.send(req.body);
  try {
    let updateFields = {};

    if (stateValue === "tp1") {
      updateFields = {
        "tp.tp1": true,
        "tp.tp2": false,
        "tp.tp3": false,
        state: true,
        blur: false,
      };
    } else if (stateValue === "tp2") {
      updateFields = {
        "tp.tp1": true,
        "tp.tp2": true,
        "tp.tp3": false,
        state: true,
        blur: false,
      };
    } else if (stateValue === "tp3") {
      updateFields = {
        "tp.tp1": true,
        "tp.tp2": true,
        "tp.tp3": true,
        state: true,
        blur: false,
      };
    }

    const updatedItem = await SIGNALDB.findByIdAndUpdate(itemId, updateFields, {
      new: true,
    });

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

//only admin can do this
router.put(
  "/failedSignalUpdate/:itemId",
  verifyToken,
  isAdmin,
  async (req, res) => {
    const itemId = req.params.itemId;
    const updateFields = {
      "tp.tp1": false,
      "tp.tp2": false,
      "tp.tp3": false,
      state: false,
      blur: true,
    };
    try {
      const updatedItem = await SIGNALDB.findByIdAndUpdate(
        itemId,
        updateFields,
        {
          new: true,
        }
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
  }
);

//only admin can do this
router.put("/submitSignal/:itemId", verifyToken, isAdmin, async (req, res) => {
  const itemId = req.params.itemId;
  const updateFields = {
    state: true,
    blur: true,
  };
  try {
    const updatedItem = await SIGNALDB.findByIdAndUpdate(itemId, updateFields, {
      new: true,
    });

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

//only admin can do this
router.put("/bodyUpdate/:itemId", verifyToken, isAdmin, async (req, res) => {
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

//only admin can do this
router.delete("/delete/:itemId", verifyToken, isAdmin, async (req, res) => {
  const itemId = req.params.itemId;
  try {
    // Find the item first to get the image path
    const itemToDelete = await SIGNALDB.findById(itemId);
    if (!itemToDelete) {
      return res.status(404).json({ message: "Item not found" });
    }
    // Delete the image file from the storage
    const imagePath = path.join(
      "Public/signals",
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
    res
      .status(500)
      .json({ error: "Internal Server Error, couldnt delete the signal" });
  }
});

module.exports = router;
