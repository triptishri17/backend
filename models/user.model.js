const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },

  email: { type: String, required: true, unique: true, lowercase: true },

  password: { type: String, required: true },

  role: { type: String, default: '' },

  status: { type: String, },

  avatar: { type: String, default: '' },

  firstName: { type: String, },

  lastName: { type: String, },

  phoneNumber: { type: String, },

  organization: { type: String, },

  address: { type: String, },

  state: { type: String, },

  zipCode: { type: String, },

  country: { type: String, },

  language: { type: [String], },

  timeZone: { type: String, },

  currency: { type: String, },

  createdAt: { type: Date, default: Date.now },

  updatedAt: { type: Date, default: '' },

  isDeleted: { type: Boolean, default: false },
  
  deletedAt: { type: Date },

  gender: {type: String,},
  
});

const User = mongoose.model("User's", userSchema)
module.exports = User