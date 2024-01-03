const express = require("express");
const router = express.Router();
const USERDB = require("../../Models/UsersModel");
const ORDERSDB = require("../../Models/OrdersModel");
const { verifyToken } = require("../Token/TokenIssuer");
const isAdmin = require("../../Middlewares/AdminCheckerMiddleware");
const mongoose = require("mongoose");
const multer = require("multer");
const upload = multer(); // initialize multer
const cron = require("node-cron");
const expirationTimeInSeconds = 60 * 60; // 1 hour in seconds

cron.schedule("* * * * *", async () => {
  try {
    // Update timers for each order where paymentMethod.paid is false
    await ORDERSDB.updateMany(
      {
        "paymentMethod.timer": { $gt: 0 }, // Only update orders with a positive timer
        "paymentMethod.paid": false, // Only update unpaid orders
      },
      {
        $inc: { "paymentMethod.timer": -60 }, // Decrement timer by 60 seconds (1 minute)
      }
    );

    // Update timers in user's orders where paymentMethod.paid is false
    await USERDB.updateMany(
      {
        "orders.paymentMethod.timer": { $gt: 0 }, // Only update orders with a positive timer
        "orders.paymentMethod.paid": false, // Only update unpaid orders
      },
      {
        $inc: { "orders.$[order].paymentMethod.timer": -60 },
      },
      { arrayFilters: [{ "order.paymentMethod.timer": { $gt: 0 } }] }
    );

    // Remove expired and paid orders from user's orders
    // await USERDB.updateMany(
    //   {},
    //   {
    //     $pull: {
    //       orders: {
    //         "paymentMethod.timer": { $lte: 0 },
    //         "paymentMethod.paid": true,
    //       },
    //     },
    //   }
    // );

    // Delete orders with expired timers and paid orders
    const expiredOrders = await ORDERSDB.find({
      "paymentMethod.timer": { $lte: 0 },
      "paymentMethod.paid": true,
    });

    for (const order of expiredOrders) {
      await order.remove();
    }
  } catch (error) {
    console.error("Error updating timers:", error);
  }
});

router.get("/allOrders", verifyToken, isAdmin, async (req, res) => {
  try {
    const orders = await ORDERSDB.find();
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id", verifyToken, async (req, res) => {
  const orderId = req.params.id;
  try {
    const order = await ORDERSDB.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/new", verifyToken, upload.none(), async (req, res) => {
  const session = await mongoose.startSession();
  const newOrderDate = Date.now();

  try {
    await session.withTransaction(async () => {
      const user = await USERDB.findById(req.user._id).session(session);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const {
        firstname,
        lastname,
        country,
        city,
        town,
        zipCode,
        address,
        phone,
        username,
        method,
        products,
        totalPrice,
        userNote,
      } = req.body;

      const addressSchema = {
        firstname,
        lastname,
        country,
        city,
        town,
        zipCode,
        address,
        phone,
      };

      const userSchema = {
        username,
        userID: user._id,
        shippingAddress: addressSchema,
      };
      const newOrder = new ORDERSDB({
        userInfo: userSchema,
        orderDate: newOrderDate,
        "paymentMethod.paid": false,
        "paymentMethod.method": method,
        "paymentMethod.timer": expirationTimeInSeconds, // Store the expiration time directly
        productName: JSON.parse(products),
        totalPrice: Number(totalPrice),
        userNote,
        done: false,
      });

      // Save the new order to the database with the session
      await newOrder.save({ session });

      // Update the user with the new order
      await USERDB.findByIdAndUpdate(
        req.user._id,
        {
          $push: { orders: newOrder },
        },
        { new: true, session }
      );

      // You can do additional processing or send a response here
      res
        .status(201)
        .json({ message: "Order created successfully", order: newOrder });
    });
  } catch (error) {
    console.error("Error creating new order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    // End the session, whether the transaction succeeded or failed
    session.endSession();
  }
});
router.post("/completed/:id", verifyToken, async (req, res) => {
  const orderId = req.params.id; // Retrieve the order ID from the request parameters
  const paymentConfirmation = req.body;
  console.log("paymentConf:", paymentConfirmation);

  try {
    // Update the specific order
    const order = await ORDERSDB.findByIdAndUpdate(
      orderId,
      { "paymentMethod.paid": true },
      { new: true }
    );

    // Update the user's orders
    const user = await USERDB.findOneAndUpdate(
      { _id: req.user._id, "orders._id": orderId },
      { $set: { "orders.$.paymentMethod.paid": true } },
      { new: true }
    );

    // Save changes
    await user.save();
    await order.save();

    // Respond with success message or updated data if needed
    res.status(200).json({ message: "Payment status updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router.post("/done/:itemId", verifyToken, isAdmin, async (req, res) => {
  const itemId = req.params.itemId;
  console.log("itemId:", itemId);
  try {
    // Find the item first to get the image path
    const order = await ORDERSDB.findById(itemId);
    if (!order) {
      return res.status(404).json({ message: "order not found" });
    }
    console.log("order:", order);
    // Delete the item from the database
    order.done = true;

    await order.save();
    res.status(200).json({ message: "order done successfully" });
  } catch (error) {
    console.error("Error order Done:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error, couldnt delete the User" });
  }
});
module.exports = router;
