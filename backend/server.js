require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
const path = require("path");

const app = express();

/* DNS */
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

/* CORS — allow all Vercel deployments + localhost */
const allowedOrigins = [
  "https://portfolio-9dtp.vercel.app",   // admin panel
  "https://portfolio-w9xn.vercel.app",   // user portfolio (add your real URL)
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Also allow any vercel.app subdomain
      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight requests
app.options("*", cors());

/* Middleware */
app.use(express.json());

/* Static Uploads */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* Routes */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/compliments", require("./routes/compliments"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/skills", require("./routes/skills"));

/* Health Check */
app.get("/", (req, res) => {
  res.json({ message: "Jaydip Parmar Portfolio API Running" });
});

/* MongoDB Connection */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed");
    console.error(err);
    process.exit(1);
  });
