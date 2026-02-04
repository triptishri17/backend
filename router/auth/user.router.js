const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authentication = require("../../middlewares/authentication")
const userModel = require("../../models/user.model")
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads/avatars");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isStrongPassword = (password) => {
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Admin Register
router.post("/admin-register", upload.single("avatar"), async (req, res) => {
  const { username, email, status, password, gender, avatar,
    country, currency, firstName, lastName, address, phoneNumber, organization, language, zipCode, timeZone, state } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      message: "Password must be at least 8 characters, include one uppercase letter, one number, and one special character",
    });
  }
  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    bcrypt.hash(password, 5, async (err, hash) => {
      if (err) {
        return res.send({ success: false, msg: "Error hashing password" });
      }
      // const baseUrl = `${req.protocol}://${req.get("host")}`;

      // const avatarPath = req.file
      //   ? `${baseUrl}/uploads/avatars/${req.file.filename}`
      //   : "";
      const avatarPath = req.file
        ? `/uploads/avatars/${req.file.filename}`
        : "";

      const user = new userModel({
        username, email, status, password: hash, gender, avatar: avatarPath, role: "admin",
        country, currency, firstName, lastName, address, phoneNumber, organization, language, zipCode, timeZone, state
      });
      await user.save();
      res.send({ success: true, user });
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// User Add By Admin Register
router.post("/register", upload.single("avatar"), async (req, res) => {
  const {
    username, email, status, role, password, gender,
    firstName, lastName, phoneNumber, organization,
    address, state, zipCode, country,
    language, timeZone, currency, isDeleted, deletedAt
  } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }
  if (!isStrongPassword(password)) {
    return res.status(400).json({
      message: "Password must be at least 8 chars, include one uppercase, one number & one special char"
    });
  }

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 5);
    // const baseUrl = `${req.protocol}://${req.get("host")}`;

    // const avatarPath = req.file
    //   ? `${baseUrl}/uploads/avatars/${req.file.filename}`
    //   : "";
    const avatarPath = req.file
      ? `/uploads/avatars/${req.file.filename}`
      : "";

    const user = new userModel({
      username, role, status, firstName, lastName, phoneNumber, organization,
      address, state, zipCode, country, language, timeZone, currency,
      isDeleted, deletedAt,
      email, gender,
      password: hash,
      avatar: avatarPath,
    });

    await user.save();
    res.send({ success: true, user });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Admin Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: "Please enter a valid email address" });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ message: "Please enter a valid password" });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    const { ...others } = user._doc;
    res.status(200).json({ success: true, token, others });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All User's
// router.get("/all", async (req, res) => {
//   try {
//     const baseUrl = `${req.protocol}://${req.get("host")}`;
//     let users = await userModel.find({ isDeleted: false }).lean();

//     users = users.map(u => {
//       let avatar = u.avatar || "";
//       if (!avatar) return { ...u, avatar: "" };

//       // normalize
//       if (avatar.startsWith("http")) {
//         avatar = avatar.replace(/\/{2,}/g, "/")
//           .replace("http:/", "http://")
//           .replace("https:/", "https://");
//       } else {
//         const filename = avatar.split("/").pop();
//         avatar = `${baseUrl}/uploads/avatars/${filename}`;
//       }
//       return { ...u, avatar };
//     });

//     res.status(200).json({ success: true, users });
//   } catch (error) {
//     console.error("Error fetching users:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });
router.get("/all", async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    let users = await userModel.find({ isDeleted: false }).lean();

    users = users.map(u => {
      let avatar = u.avatar || "";

      if (avatar && !avatar.startsWith("http")) {
        // prepend host to relative path
        avatar = `${baseUrl}${avatar}`;
      }

      return { ...u, avatar };
    });

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// Admin Profile *
router.get('/admin-profile', authentication, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await userModel.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('Error fetching admin profile:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Admin Update Account
router.put('/admin-update/:id', authentication, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const adminId = req.user.userId;

    const admin = await userModel.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Only admins can perform this action.' });
    }

    const userToUpdate = await userModel.findById(targetUserId);
    if (!userToUpdate) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { firstName, lastName, gender, email, organization, phoneNumber, state, zipCode, address,
      country, language, currency, timeZone, role, status, avatar } = req.body;

    if (avatar !== undefined) userToUpdate.avatar = avatar;
    if (firstName !== undefined) userToUpdate.firstName = firstName;
    if (lastName !== undefined) userToUpdate.lastName = lastName;
    if (gender != undefined) userToUpdate.gender = gender;
    if (email !== undefined) userToUpdate.email = email;
    if (organization !== undefined) userToUpdate.organization = organization;
    if (phoneNumber !== undefined) userToUpdate.phoneNumber = phoneNumber;
    if (state !== undefined) userToUpdate.state = state;
    if (zipCode !== undefined) userToUpdate.zipCode = zipCode;
    if (address !== undefined) userToUpdate.address = address;
    if (country !== undefined) userToUpdate.country = country;
    if (language !== undefined) userToUpdate.language = language;
    if (currency !== undefined) userToUpdate.currency = currency;
    if (timeZone !== undefined) userToUpdate.timeZone = timeZone;
    if (role !== undefined) userToUpdate.role = role;
    if (status !== undefined) userToUpdate.status = status;

    userToUpdate.updatedAt = new Date();

    await userToUpdate.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully by admin',
      user: {
        ...userToUpdate._doc,
        password: undefined
      }
    });
  } catch (error) {
    console.error('🔥 Admin Update User Error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating user' });
  }
});

// Admin Delete Account
router.patch('/admin-delete/:id', authentication, async (req, res) => {
  try {
    const requester = await userModel.findById(req.user.userId);

    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admin can perform this action' });
    }

    const { id } = req.params;
    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isDeleted) {
      return res.status(400).json({ success: false, message: 'User is already deleted' });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: `User (${user.email}) soft-deleted successfully`,
    });
  } catch (error) {
    console.error('Soft Delete User Error:', error);
    res.status(500).json({ success: false, message: 'Server error while soft deleting user' });
  }
});

// Specific User Update by User id
router.put('/specific-user-update/:id', authentication, async (req, res) => {
  try {
    const targetUserId = req.params.id
    const adminId = req.user.userId

    const admin = await userModel.findById(adminId)
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can perform this action.'
      })
    }

    const userToUpdate = await userModel.findById(targetUserId)
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    const { username, firstName, lastName, email, gender, organization, phoneNumber, state, zipCode,
      address, country, language, currency, timeZone, role, status, avatar, password } = req.body

    if (avatar !== undefined) userToUpdate.avatar = avatar
    if (username !== undefined) userToUpdate.username = username
    if (firstName !== undefined) userToUpdate.firstName = firstName
    if (lastName !== undefined) userToUpdate.lastName = lastName
    if (gender != undefined) userToUpdate.gender = gender
    if (email !== undefined) userToUpdate.email = email
    if (organization !== undefined) userToUpdate.organization = organization
    if (phoneNumber !== undefined) userToUpdate.phoneNumber = phoneNumber
    if (state !== undefined) userToUpdate.state = state
    if (zipCode !== undefined) userToUpdate.zipCode = zipCode
    if (address !== undefined) userToUpdate.address = address
    if (country !== undefined) userToUpdate.country = country
    if (language !== undefined) userToUpdate.language = language
    if (currency !== undefined) userToUpdate.currency = currency
    if (timeZone !== undefined) userToUpdate.timeZone = timeZone
    if (role !== undefined) userToUpdate.role = role
    if (status !== undefined) userToUpdate.status = status

    if (password !== undefined && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10)
      userToUpdate.password = await bcrypt.hash(password, salt)
    }

    userToUpdate.updatedAt = new Date()

    await userToUpdate.save()

    res.status(200).json({
      success: true,
      message: 'User updated successfully by admin',
      user: {
        ...userToUpdate._doc,

      }
    })
  } catch (error) {
    console.error('Admin User Update Error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    })
  }
})

// Specific User Get by User id
router.get("/specific-user/:id", authentication, async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
