const mongoose = require("mongoose");
const Schema = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    confirm: { type: Boolean },
    email: { type: String, required: true },
  },
  plan: {
    remaining: Number,
    maxDays: Number,
    type: {
      type: String,
      required: true,
    },
  },
  refcode: {
    userCode: { type: String },
    enteredCodes: [{ type: String }],
  },
  orders: [
    {
      userInfo: {
        username: { type: String, required: true },
        userID: { type: String, required: true },
        shippingAddress: {
          firstname: String,
          lastname: String,
          country: String,
          city: String,
          zipCode: String,
          address: String,
        },
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
    },
  ],
  firstname: String,
  lastname: String,
  phone: String,
  pic: String,
  refreshToken: String,
  role: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("users", Schema);
