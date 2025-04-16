const mongoose = require("mongoose");

const userschema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  verify: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: [ "user", "company","admin"],
    required: true,
  },
  phone: {
    type: String, 
    required: true,
  },
  address: {
    type: String,
  },
  description: {
    type: String,
  }
});

const Userss = new mongoose.model("Userss", userschema);
module.exports = Userss;
