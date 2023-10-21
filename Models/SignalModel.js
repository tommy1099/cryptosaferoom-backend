const mongoose = require("mongoose");
const Schema = mongoose.Schema({
  img: {
    type: String,
    require: true,
  },
  crypto: {
    type: String,
    require: true,
  },
  desc: {
    desc1: {
      type: String,
      require: true,
    },
    desc2: {
      type: String,
      require: true,
    },
    desc3: {
      type: String,
      require: true,
    },
  },
  tags: {
    tag1: {
      type: String,
      require: true,
    },
    tag2: {
      type: String,
      require: true,
    },
  },
  expire: {
    type: Number,
    require: true,
  },
  blur: {
    type: Boolean,
    require: true,
  },
  state: {
    type: Boolean,
    require: true,
  },
});

module.exports = mongoose.model("signals", Schema);
