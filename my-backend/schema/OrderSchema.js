const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderItems: [
      {
        product:  { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, required: true },
        price:    { type: Number, required: true },
      },
    ],
    shippingAddress: {
      fullName: String,
      street:   String,
      landmark: String,
      city:     String,
      district: String,
      state:    String,
      zipCode:  String,
      phone:    String,
    },
    paymentMethod:  { type: String, default: "COD" },
    paymentStatus:  { type: String, enum: ["Pending", "Paid"], default: "Pending" },
    orderStatus:    { type: String, enum: ["Processing", "Shipped", "Delivered", "Cancelled"], default: "Processing" },
    subtotal:       { type: Number, required: true },
    shippingPrice:  { type: Number, default: 0 },
    taxPrice:       { type: Number, default: 0 },
    totalPrice:     { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
