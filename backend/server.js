require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
const path = require("path");

const app = express();

dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

/* CORS */
const cors = require("cors");

app.use(cors({
  origin: true,
  credentials: true,
}));

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

/* MongoDB */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");

    app.listen(process.env.PORT || 5000, () => {
      console.log(
        `🚀 Server running on port ${process.env.PORT || 5000}`
      );
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed");
    console.error(err);
    process.exit(1);
  });