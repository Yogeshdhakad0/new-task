const express   = require("express");
const mongoose  = require("mongoose");
const Order     = require("../schema/OrderSchema");
const Product   = require("../schema/ProductSchema");
const User      = require("../schema/UserSchema");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/orders — create order with MongoDB Transaction (prevent overselling)
router.post("/", protect, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { orderItems, shippingAddress, paymentMethod } = req.body;

    if (!orderItems || orderItems.length === 0)
      return res.status(400).json({ success: false, message: "No order items" });

    let order;
    let updatedStocks = [];

    await session.withTransaction(async () => {
      let subtotal = 0;

      // ✅ Atomic stock check + decrease (prevent overselling)
      for (const item of orderItems) {
        const product = await Product.findOneAndUpdate(
          {
            _id: item.product,
            stock: { $gte: item.quantity } // Only update if enough stock
          },
          { $inc: { stock: -item.quantity } },
          { session, new: true }
        );

        if (!product) {
          throw new Error(`Not enough stock for product`);
        }

        subtotal += product.price * item.quantity;

        // Track updated stocks for socket emit
        updatedStocks.push({
          productId: product._id,
          stock: product.stock,
          name: product.name
        });
      }

      const shippingPrice = subtotal > 1000 ? 0 : 100;
      const taxPrice      = +(subtotal * 0.18).toFixed(2);
      const totalPrice    = +(subtotal + shippingPrice + taxPrice).toFixed(2);

      // Create order inside transaction
      const orders = await Order.create([{
        user: req.user._id,
        orderItems,
        shippingAddress,
        paymentMethod: paymentMethod || "COD",
        subtotal,
        shippingPrice,
        taxPrice,
        totalPrice,
      }], { session });

      order = orders[0];

      // Clear cart inside transaction
      await User.findByIdAndUpdate(
        req.user._id,
        { cart: [] },
        { session }
      );
    });

    // ✅ Socket.IO - Broadcast stock updates to all users
    const io = req.app.get('io');
    if (io) {
      updatedStocks.forEach(({ productId, stock, name }) => {
        io.emit('stock_updated', { productId, stock, name });
      });
    }

    res.status(201).json({ success: true, order });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || "Order failed - not enough stock"
    });
  } finally {
    session.endSession();
  }
});

// GET /api/orders — user's orders
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

// GET /api/orders/admin/all — all orders (admin)
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

// PUT /api/orders/:id/deliver (admin)
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
