
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const userModel = require("../../models/user.model");
const authentication = require("../../middlewares/authentication");

/* ===========================
   UPDATE PROFILE
=========================== */
router.put("/profile", authentication, async (req, res) => {
  try {
    const { fullName, email } = req.body;

    const updatedUser = await userModel.findByIdAndUpdate(
      req.user.id,
      { fullName, email },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ===========================
   UPDATE PASSWORD
=========================== */
router.put("/password", authentication, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });

  } catch (error) {
    console.error("Password Update Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ===========================
   SAVE PREFERENCES
=========================== */
router.post("/preferences", authentication, async (req, res) => {
  try {
    const preferences = req.body;

    const user = await userModel.findByIdAndUpdate(
      req.user.id,
      { preferences },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Preferences saved successfully",
      preferences: user.preferences,
    });

  } catch (error) {
    console.error("Preferences Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ===========================
   DELETE ACCOUNT
=========================== */
router.delete("/delete-account", authentication, async (req, res) => {
  try {
    await userModel.findByIdAndDelete(req.user.id);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });

  } catch (error) {
    console.error("Delete Account Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;