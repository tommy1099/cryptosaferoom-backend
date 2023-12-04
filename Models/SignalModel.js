const mongoose = require("mongoose");
const Schema = mongoose.Schema({
  img: {
    type: String,
    required: true,
  },
  crypto: {
    type: String,
    required: true,
  },
  desc: {
    desc1: {
      type: String,
      required: true,
    },
    desc2: {
      type: String,
      required: true,
    },
    desc3: {
      type: String,
      required: true,
    },
  },
  tags: {
    tag1: {
      type: String,
      required: true,
    },
    tag2: {
      type: String,
      required: true,
    },
  },
  vip: {
    type: Boolean,
    required: true,
  },
  blur: {
    type: Boolean,
    required: true,
  },
  state: {
    type: Boolean,
    required: true,
  },
  tp: {
    tp1: Boolean,
    tp2: Boolean,
    tp3: Boolean,
  },
  entryPoint: String,
  alertDesc: String,
  tpPrices: {
    tp1Price: String,
    tp2Price: String,
    tp3Price: String,
  },
});

module.exports = mongoose.model("signals", Schema);
