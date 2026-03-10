const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");

const postModel = require("../../models/post.model");
const userModel = require("../../models/user.model");
const authentication = require("../../middlewares/authentication");

/* ===========================
   MULTER CONFIG
=========================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

/* ===========================
   USER REGISTER
=========================== */
router.post(
  "/user-register",
  upload.single("avatar"),
  async (req, res) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Avatar is required" });
      }

      const existingUser = await userModel.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const user = new userModel({
        username,
        email,
        password,
        avatar: `/images/${req.file.filename}`
      });

      await user.save();

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        user
      });

    } catch (error) {
      console.error("Register Error:", error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);



/* ===========================
   CREATE POST
=========================== */
router.post(
  "/create",
  authentication,
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, description } = req.body;
      const userId = req.user.userId;

      if (!title || !description) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const userExists = await userModel.findById(userId);
      if (!userExists) {
        return res.status(404).json({ message: "User not found" });
      }

      const newPost = new postModel({
        userId,
        title,
        description,
        image: req.file ? `/images/${req.file.filename}` : null
      });

      const savedPost = await newPost.save();

      res.status(201).json({
        success: true,
        message: "Post created successfully",
        post: savedPost
      });

    } catch (error) {
      console.error("Create Post Error:", error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);


/* ===========================
   GET ALL POSTS
=========================== */
router.get("/all", authentication, async (req, res) => {
  try {
    const posts = await postModel.find({ isDeleted: false });

    res.status(200).json({
      success: true,
      total: posts.length,
      posts
    });
  } catch (error) {
    console.error("Get All Posts Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ===========================
   POSTS BY USER
=========================== */
router.get("/post-view/:userId", authentication, async (req, res) => {
  try {
    const posts = await postModel.find({
      userId: req.params.userId,
      isDeleted: false
    });

    res.status(200).json({
      success: true,
      total: posts.length,
      posts
    });

  } catch (error) {
    console.error("User Posts Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ===========================
   POST COUNTS
=========================== */
router.post("/post-counts", async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "userIds must be non-empty array"
      });
    }

    const objectIds = userIds.map(id => new mongoose.Types.ObjectId(id));

    const rows = await postModel.aggregate([
      { $match: { userId: { $in: objectIds }, isDeleted: false } },
      { $group: { _id: "$userId", totalPosts: { $sum: 1 } } }
    ]);

    const counts = {};
    userIds.forEach(id => {
      const row = rows.find(r => String(r._id) === String(id));
      counts[id] = row ? row.totalPosts : 0;
    });

    res.status(200).json({ success: true, counts });

  } catch (error) {
    console.error("Post Count Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

/* ===========================
   ADMIN DELETE POST
=========================== */
router.patch("/admin-delete-post/:id", authentication, async (req, res) => {
  try {
    const admin = await userModel.findById(req.user.userId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const post = await postModel.findById(req.params.id);
    if (!post || post.isDeleted) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();

    res.status(200).json({
      success: true,
      message: "Post deleted successfully"
    });

  } catch (error) {
    console.error("Delete Post Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/* ===========================
   ADMIN EDIT POST
=========================== */
router.patch(
  "/admin-edit-post/:id",
  authentication,
  upload.single("image"),
  async (req, res) => {
    try {
      const admin = await userModel.findById(req.user.userId);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ message: "Admin only" });
      }

      const post = await postModel.findById(req.params.id);
      if (!post || post.isDeleted) {
        return res.status(404).json({ message: "Post not found" });
      }

      const { title, description } = req.body;

      if (title) post.title = title;
      if (description) post.description = description;
      if (req.file) post.image = `/images/${req.file.filename}`;

      post.updatedAt = new Date();
      await post.save();

      res.status(200).json({
        success: true,
        message: "Post updated successfully",
        post
      });

    } catch (error) {
      console.error("Edit Post Error:", error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

/* ===========================
   ADMIN DELETE ALL USER POSTS
=========================== */
router.patch(
  "/admin-delete-user-posts-all/:userId",
  authentication,
  async (req, res) => {
    try {
      const admin = await userModel.findById(req.user.userId);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ message: "Admin only" });
      }

      const result = await postModel.updateMany(
        { userId: req.params.userId, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date() } }
      );

      res.status(200).json({
        success: true,
        message: `${result.modifiedCount} posts deleted`
      });

    } catch (error) {
      console.error("Delete All Posts Error:", error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

module.exports = router;
