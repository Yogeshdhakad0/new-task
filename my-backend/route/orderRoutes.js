const express = require("express");
const Order   = require("../schema/OrderSchema");
const Product = require("../schema/ProductSchema");
const User    = require("../schema/UserSchema");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/orders  — create order
router.post("/", protect, async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod } = req.body;
    if (!orderItems || orderItems.length === 0)
      return res.status(400).json({ success: false, message: "No order items" });

    let subtotal = 0;
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ success: false, message: "Product not found" });
      subtotal += product.price * item.quantity;
    }

    const shippingPrice = subtotal > 1000 ? 0 : 100;
    const taxPrice      = +(subtotal * 0.18).toFixed(2);
    const totalPrice    = +(subtotal + shippingPrice + taxPrice).toFixed(2);

    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod: paymentMethod || "COD",
      subtotal,
      shippingPrice,
      taxPrice,
      totalPrice,
    });

    // Clear cart
    await User.findByIdAndUpdate(req.user._id, { cart: [] });

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders  — user's orders
router.get("/", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("orderItems.product")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/admin/all  — all orders (admin)
router.get("/admin/all", protect, admin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("orderItems.product")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:id
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("orderItems.product");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/orders/:id/deliver  (admin)
router.put("/:id/deliver", protect, admin, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: "Delivered" },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
