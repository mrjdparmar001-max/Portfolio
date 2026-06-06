require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const dns = require("dns");
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://portfolio-kohl-pi-nodf3yjqji.vercel.app"
    ],
    credentials: true,
  })
);

dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();
app.use(cors());
app.use(express.json());

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/compliments", require("./routes/compliments"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/skills", require("./routes/skills"));

app.get("/", (req, res) =>
  res.json({ message: "Jaydip Parmar Portfolio API Running" }),
);
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`),
    );
  })
.catch((err) => {
  console.error(err);
  process.exit(1);
});
