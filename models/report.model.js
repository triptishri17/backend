const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  type: {
    type: String,
    enum: ["Users", "Posts", "Orders", "Revenue"],
    required: true,
  },

  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  metaData: {
    type: Object, // extra data (counts, totals, etc.)
    default: {},
  },

  isDeleted: {
    type: Boolean,
    default: false,
  },

  deletedAt: {
    type: Date,
  },
},
{
  timestamps: true
});

module.exports = mongoose.model("Report", reportSchema);