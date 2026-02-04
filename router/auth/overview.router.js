const express = require("express");
const router = express.Router();
const postModel = require("../../models/post.model")
const userModel = require('../../models/user.model')
const authentication = require('../../middlewares/authentication')

router.get("/overview", authentication, async (req, res) => {
  try {
    const totalUsers = await userModel.countDocuments();
    const totalPosts = await postModel.countDocuments();

     const totalMale = await userModel.countDocuments({ gender: "male" });
    const totalFemale = await userModel.countDocuments({ gender: "female" });

    const roles = await userModel.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    const statuses = await userModel.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalPosts,
        roles,
        statuses,
         totalMale,
        totalFemale
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;