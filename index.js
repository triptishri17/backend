const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const usersRoutes = require("./router/auth/user.router");
const postRoutes = require("./router/auth/post.router");
const overviewRoutes = require("./router/auth/overview.router");

const app = express(); // ✅ FIRST

// ---------- MIDDLEWARE ----------
app.use(express.json());

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      "https://admin-frontend-reactjs-f8azsy5cp-mohits-projects-7270e91a.vercel.app"
    ];

    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

// ---------- ROOT TEST ROUTE ----------
app.get("/", (req, res) => {
  res.send("Admin Backend API is running 🚀");
});

// ---------- STATIC FILES ----------
const uploadDir = path.join(__dirname, "uploads/avatars");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/uploads/avatars", express.static(uploadDir));
app.use("/images", express.static(path.join(__dirname, "images")));

// ---------- MULTER ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "images"),
  filename: (req, file, cb) => cb(null, req.body.name),
});
const upload = multer({ storage });

app.post("/upload", upload.single("file"), (req, res) => {
  res.status(200).json("File uploaded");
});

// ---------- ROUTES ----------
app.use("/auth/user", usersRoutes);
app.use("/auth/post", postRoutes);
app.use("/auth/overview", overviewRoutes);

// ---------- DATABASE ----------
mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_URL, { dbName: "BlogAdmin" })
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch(err => console.log(err));

// ---------- SERVER START ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
