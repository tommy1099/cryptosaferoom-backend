const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    firstname: String,
    lastname: String,
    country: String,
    city: String,
    town: String,
    zipCode: String,
    address: String,
    phone: String,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    userID: { type: String, required: true },
    shippingAddress: addressSchema,
  },
  { _id: false }
);

const Schema = new mongoose.Schema({
  userInfo: {
    type: userSchema,
    required: true,
  },
  orderDate: { type: Date, required: true },
  paymentMethod: {
    paid: { type: Boolean, required: true },
    method: { type: String, required: true },
    timer: Number,
  },
  productName: [
    {
      id: { type: String, required: true },
      title: { type: String, required: true },
      price: { type: Number, required: true },
      physical: { type: Number, required: true },
      quantity: { type: Number, required: true },
      img: String,
    },
  ],
  totalPrice: { type: Number, required: true },
  userNote: { type: String },
  done: { type: Boolean, required: true },
});

module.exports = mongoose.model("order", Schema);
