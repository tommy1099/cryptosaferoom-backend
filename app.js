// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const multer = require("multer");
// const SIGNALDB = require("./Models/SignalModel");
// const redis = require("redis");
// const app = express();
// const db = mongoose.connection;
// const fs = require("fs");
// const path = require("path");
// const redisClient = redis.createClient({
//   host: "localhost",
//   port: 6379,
// });

// redisClient.connect();
// redisClient.on("connect", () => {
//   console.log("Connected to Redis");
// });
// redisClient.on("error", (err) => {
//   console.log("Error: " + err);
// });

// mongoose.connect(
//   "mongodb+srv://tommy:1099@hacker-man.mqkqw8a.mongodb.net/CryptoSafeRoom"
// );
// const corsOptions = {
//   origin: "*", // Replace with your allowed origin (or "*" for any origin)
//   methods: ["GET", "POST", "DELETE", "OPTION", "PUT"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// };
// app.use(cors(corsOptions));
// app.use(express.json());

// const uploadsDirectory = "./Public/images";
// if (!fs.existsSync(uploadsDirectory)) {
//   fs.mkdirSync(uploadsDirectory);
// }

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadsDirectory); // Directory to store uploaded files
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + "-" + file.originalname);
//   },
// });
// const upload = multer({ storage: storage });

// db.on("error", (error) => console.log(error));
// db.once("open", () => console.log("Connected to DB"));
// app.listen(4444, () => console.log("Listening on 4444"));

// app.get("/", cors(corsOptions), async (req, res) => {
//   await check().then((data) => {
//     res.json({ srcs: data });
//   });
// });
// app.delete("/admin/dashboard/:itemId", cors(corsOptions), async (req, res) => {
//   const itemId = req.params.itemId;
//   console.log("itemId:", itemId);

//   try {
//     // Implement item deletion logic here
//     // Use Mongoose to remove the item from the MongoDB collection
//     // Example:
//     await SIGNALDB.deleteOne({ _id: itemId });
//     res.status(200).json({ message: "Item deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting item:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// app.put(
//   "/admin/dashboard/imgUpdate/:itemId",
//   upload.single("img"),
//   cors(corsOptions),
//   async (req, res) => {
//     const itemId = req.params.itemId;

//     try {
//       // Get the updated image file path
//       const updatedImgPath = `http://localhost:4444/images/${req.file.filename}`;

//       // Find the item by ID and update its 'img' field with the new image path
//       const updatedItem = await SIGNALDB.findByIdAndUpdate(
//         itemId,
//         { img: updatedImgPath },
//         { new: true }
//       );

//       if (!updatedItem) {
//         return res.status(404).json({ message: "Item not found" });
//       }

//       res
//         .status(200)
//         .json({ message: "Item updated successfully", item: updatedItem });
//     } catch (error) {
//       console.error("Error updating item:", error);
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   }
// );

// app.put(
//   "/admin/dashboard/stateUpdate/:itemId",

//   cors(corsOptions),
//   async (req, res) => {
//     const itemId = req.params.itemId;
//     const stateValue = req.body.state;
//     console.log(stateValue === "successfull");

//     try {
//       // console.log(typeof stateAndBlur);
//       // Find the item by ID and update its 'img' field with the new image path
//       const tempBool = stateValue === "successfull";
//       console.log("tempBool:", tempBool);
//       const updatedItem = await SIGNALDB.findByIdAndUpdate(
//         itemId,
//         {
//           state: tempBool,
//           blur: true,
//         },
//         { new: true }
//       );

//       if (!updatedItem) {
//         return res.status(404).json({ message: "Item not found" });
//       }

//       res
//         .status(200)
//         .json({ message: "Item updated successfully", item: updatedItem });
//     } catch (error) {
//       console.error("Error updating item:", error);
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   }
// );

// // Updated route to handle file uploads
// app.post("/admin/dashboard", upload.single("img"), async (req, res) => {
//   try {
//     // req.file contains the uploaded image
//     const { crypto, desc1, desc2, desc3, tag1, tag2 } = req.body;
//     // const uploadedFile = req.file;
//     // console.log("crypto:", crypto);
//     // console.log("desc1:", desc1);
//     // console.log("desc2:", desc2);
//     // console.log("desc3:", desc3);
//     // console.log("tag1:", tag1);
//     // console.log("tag2:", tag2);
//     // console.log("uploadedFile:", uploadedFile);
//     // Create a new document using the request body and the uploaded file path
//     const newItem = new SIGNALDB({
//       crypto: crypto,
//       desc: { desc1: desc1, desc2: desc2, desc3: desc3 },
//       tags: { tag1: tag1, tag2: tag2 },
//       img: `http://localhost:4444/images/${req.file.filename}`, // This assumes the image field in your model is named "img"
//       expire: 5000,
//       blur: false,
//       state: false,
//     });

//     // Save the new document to the database
//     const savedItem = await newItem.save();
//     // console.log("New item saved:", savedItem);
//     res.status(201).json(savedItem); // Respond with the created item
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Server Error");
//   }
// });
// app.use(express.static(path.join(__dirname, "Public")));
// app.get("/images/:filename", cors(corsOptions), (req, res) => {
//   const filename = req.params.filename;
//   const imagePath = path.join(__dirname, "Public/images", filename);
//   res.sendFile(imagePath);
// });

// app.get("/admin/dashboard", cors(corsOptions), async (req, res) => {
//   try {
//     const signals = await SIGNALDB.find();
//     res.json(signals);
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// const check = async function () {
//   await redisClient.get("srcs").then(async (data) => {
//     try {
//       if (data !== null) {
//         return JSON.parse(data);
//       } else {
//         let arr = [];
//         const allSignals = await SIGNALDB.find();
//         allSignals.forEach((item) => arr.push(item.src));
//         await redisClient.setEx("srcs", 3600, JSON.stringify(arr));
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   });
//   const recentlyAdded = await redisClient.get("srcs");
//   return JSON.parse(recentlyAdded);
// };
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

const db = mongoose.connection;
const path = require("path");

const corsOptions = {
  origin: "*", // Replace with your allowed origin (or "*" for any origin)
  methods: ["GET", "POST", "DELETE", "OPTION", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

mongoose.connect(
  "mongodb+srv://tommy:1099@hacker-man.mqkqw8a.mongodb.net/CryptoSafeRoom"
);

db.on("error", (error) => console.log(error));
db.once("open", () => console.log("Connected to DB"));

// Static file serving
app.use(express.static(path.join(__dirname, "Public")));

// Import routes
const signalRoutes = require("./Routes/SignalsRoutes/SignalsRoutes");
const newsRoutes = require("./Routes/NewsRoute/NewsRoute");
const imagesRoutes = require("./Routes/ImageRoute/ImageRoute");

// Use routes
app.use("/admin/dashboard/signals", signalRoutes);
app.use("/admin/dashboard/news", newsRoutes);
app.use("/images", imagesRoutes);

const PORT = process.env.PORT || 4444;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
