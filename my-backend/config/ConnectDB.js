const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.warn("⚠️  MONGO_URI not found - running without database");
    return;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log("✅ MongoDB Connected:", conn.connection.host);
  } catch (error) {
    console.warn("⚠️  MongoDB connection failed:", error.message);
    console.warn("⚠️  Server will run without database");
  }
};

module.exports = connectDB;
