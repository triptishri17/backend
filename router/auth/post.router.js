const express = require("express");
const router = express.Router();
const postModel = require("../../models/post.model")
const userModel = require('../../models/user.model')
const authentication = require('../../middlewares/authentication')
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "images"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + file.originalname;
    cb(null, uniqueSuffix);
  },
});
const upload = multer({ storage });

//  Post Create
router.post("/create", authentication, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.body.userId || req.user.userId;

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
      post: savedPost,
    });
  } catch (error) {
    console.error("Create Post Error:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// All Post
router.get("/all", authentication, async (req, res) => {
  try {
    const posts = await postModel.find({isDeleted: false});

    res.status(200).json({
      success: true,
      total: posts.length,
      posts,
    });
  } catch (error) {
    console.error("Get All Posts Error:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// View Post By User Id
router.get("/post-view/:userId", authentication, async (req, res) => {
  try {
    const userId = req.params.userId;

    const posts = await postModel.find({ userId: userId, isDeleted: false });

    res.status(200).json({
      success: true,
      total: posts.length,
      posts
    });
  } catch (error) {
    console.error("Get User Posts Error:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// Total Post Count
// router.get("/post-count/:userId", async (req, res) => {
//   try {
//     const totalPosts = await postModel.countDocuments({ userId: req.params.userId });
//     res.status(200).json({  success: true, totalPosts });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
router.post('/post-counts', async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'userIds must be a non-empty array' });
    }
    const objectIds = userIds.map(id => new mongoose.Types.ObjectId(id));

    const rows = await postModel.aggregate([
      { $match: { userId: { $in: objectIds } } },
      { $group: { _id: '$userId', totalPosts: { $sum: 1 } } }
    ]);

    const counts = {};
    userIds.forEach(id => {
      const row = rows.find(r => String(r._id) === String(id));
      counts[id] = row ? row.totalPosts : 0;
    });

    res.status(200).json({ success: true, counts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// Delete Post
router.patch('/admin-delete-post/:id', authentication, async (req, res) => {
  try {
    const requester = await userModel.findById(req.user.userId)

    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admin can perform this action' })
    }

    const { id } = req.params
    const post = await postModel.findById(id)

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' })
    }

    if (post.isDeleted) {
      return res.status(400).json({ success: false, message: 'Post is already deleted' })
    }

    post.isDeleted = true
    post.deletedAt = new Date()
    await post.save()

    res.status(200).json({
      success: true,
      message: `Post (${post.title}) soft-deleted successfully`,
    })
  } catch (error) {
    console.error('Soft Delete Post Error:', error)
    res.status(500).json({ success: false, message: 'Server error while soft deleting post' })
  }
})

// Edit Post
router.patch('/admin-edit-post/:id', authentication, async (req, res) => {
  try {
    const requester = await userModel.findById(req.user.userId)

    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admin can perform this action' })
    }

    const { id } = req.params
    const { title, description, image } = req.body 

   
    const post = await postModel.findById(id)
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' })
    }

    if (post.isDeleted) {
      return res.status(400).json({ success: false, message: 'Cannot edit a deleted post' })
    }

    
    if (title) post.title = title
    if (description) post.description = description
    if (req.file) {  post.image = `/uploads/${req.file.filename}`  } 

    post.updatedAt = new Date()

    await post.save()

    res.status(200).json({
      success: true,
      message: `Post (${post.title}) updated successfully`,
      post,
    })
  } catch (error) {
    console.error('Edit Post Error:', error)
    res.status(500).json({ success: false, message: 'Server error while editing post' })
  }
})

// delete all post for any user
router.patch("/admin-delete-user-posts-all/:userId", authentication, async (req, res) => {
  try {
    const requester = await userModel.findById(req.user.userId);
    if (!requester || requester.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admin can perform this action" });
    }
    const { userId } = req.params;
    const targetUser = await userModel.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "Target user not found" });
    }
    const result = await postModel.updateMany(
      { userId, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ success: false, message: "No active posts found for this user" });
    }

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} post(s) of user '${targetUser.username}' soft-deleted successfully`
    });

  } catch (error) {
    console.error("Soft Delete All Posts Error:", error);
    res.status(500).json({ success: false, message: "Server error while soft deleting posts" });
  }
});

module.exports = router;