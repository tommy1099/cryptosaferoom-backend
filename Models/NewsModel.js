const mongoose = require("mongoose");
const Schema = mongoose.Schema({
  img: {
    type: String,
    require: true,
  },
  title: {
    type: String,
    require: true,
  },
  desc: {
    desc1: {
      type: String,
      require: true,
    },
  },
});

module.exports = mongoose.model("news", Schema);
