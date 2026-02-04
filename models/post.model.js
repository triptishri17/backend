const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User's", required: true },

  title: { type: String, required: true, },

  description: { type: String, required: true },

  image: { type: String, default: '' },

  likes: { type: Number, default: 0 },

  dislikes: { type: Number, default: 0 },

  views: { type: Number, default: 0 },

  comments: [{ text: String, userId: { type: mongoose.Schema.Types.ObjectId, ref: "User's" } }],

  createdAt: { type: Date, default: Date.now },

  isDeleted: { type: Boolean, default: false },

  deletedAt: { type: Date }
});

module.exports = mongoose.model("Post's", postSchema);
