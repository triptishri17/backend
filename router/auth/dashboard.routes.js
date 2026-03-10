const express = require("express");
const router = express.Router();
// const User = require("../models/user.model");
// const User = require('../../models/user.model')

const User = require('../../models/user.model')
/**
 * GET USERS PER MONTH (BAR CHART)
 */
router.get("/users/monthly-stats", async (req, res) => {
  try {
    console.log("Asdfasdfasdf")
    const users = await User.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalUsers: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const labels = users.map(item => monthNames[item._id - 1]);
    const data = users.map(item => item.totalUsers);

    return res.status(200).json({
      success: true,
      labels,
      data
    });

  } catch (error) {
    console.error("User Chart API Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;