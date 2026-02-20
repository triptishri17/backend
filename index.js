const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Routes
const usersRoutes = require("./router/auth/user.router");
const postRoutes = require("./router/auth/post.router");
const overviewRoutes = require("./router/auth/overview.router");

const app = express();

/* ===================== MIDDLEWARE ===================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===================== CORS CONFIG ===================== */
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://admin-frontend-reactjs-f8azsy5cp-mohits-projects-7270e91a.vercel.app",
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
// app.options("*", cors(corsOptions)); // ✅ preflight support
// app.options("/*", cors(corsOptions));


/* ===================== ROOT ===================== */
app.get("/", (req, res) => {
  res.status(200).send("🚀 Admin Backend API is running");
});

/* ===================== STATIC FILES ===================== */
const avatarDir = path.join(__dirname, "uploads/avatars");
const imagesDir = path.join(__dirname, "images");

if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

app.use("/uploads/avatars", express.static(avatarDir));
app.use("/images", express.static(imagesDir));

/* ===================== ROUTES ===================== */
app.use("/auth/user", usersRoutes);
app.use("/auth/post", postRoutes);
app.use("/auth/overview", overviewRoutes);

/* ===================== DATABASE ===================== */
mongoose.set("strictQuery", false);

mongoose
  .connect(process.env.MONGO_URL, {
    dbName: "BlogAdmin",
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

/* ===================== SERVER ===================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Server running at http://localhost:${PORT}`);
});
