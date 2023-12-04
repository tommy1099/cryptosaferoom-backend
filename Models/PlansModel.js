const mongoose = require("mongoose");
const Schema = new mongoose.Schema({
  planName: {
    type: String,
    enum: [
      "oneDay",
      "oneWeek",
      "oneMonth",
      "threeMonths",
      "sixMonth",
      "oneYear",
      "threeYear",
    ],
    required: true,
  },
  planType: {
    type: String,
    enum: ["BASIC", "VIP"],
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  off: {
    type: Number,
    default: 0,
  },
  benefits: {
    type: [String],
    required: true,
  },
});

module.exports = mongoose.model("plans", Schema);
