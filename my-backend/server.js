require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/ConnectDB");

const authRoutes    = require("./route/authRoutes");
const productRoutes = require("./route/productRoutes");
const cartRoutes    = require("./route/cartRoutes");
const orderRoutes   = require("./route/orderRoutes");

// Connect MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth",     authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart",     cartRoutes);
app.use("/api/orders",   orderRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ success: true, message: "API is running on port " + process.env.PORT });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
