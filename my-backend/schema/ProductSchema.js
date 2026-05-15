const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    description: { type: String, default: "" },
    price:       { type: Number, required: true },
    category:    { type: String, required: true },
    sizes:       [{ type: String }],
    images:      [{ type: String }],
    stock:       { type: Number, default: 0 },
    brand:       { type: String, default: "" },
    isFeatured:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
