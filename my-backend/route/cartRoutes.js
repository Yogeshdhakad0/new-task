const express = require("express");
const User    = require("../schema/UserSchema");
const Product = require("../schema/ProductSchema");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/cart
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("cart.product");
    res.json({ success: true, cart: user.cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/cart  — add item
router.post("/", protect, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const user = await User.findById(req.user._id);
    const existing = user.cart.find((i) => i.product.toString() === productId);

    if (existing) {
      existing.quantity += quantity;
    } else {
      user.cart.push({ product: productId, quantity });
    }
    await user.save();

    const updated = await User.findById(req.user._id).populate("cart.product");
    res.json({ success: true, cart: updated.cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/cart/:itemId  — update quantity
router.put("/:itemId", protect, async (req, res) => {
  try {
    const { quantity } = req.body;
    const user  = await User.findById(req.user._id);
    const item  = user.cart.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: "Cart item not found" });

    if (quantity <= 0) {
      item.deleteOne();
    } else {
      item.quantity = quantity;
    }
    await user.save();

    const updated = await User.findById(req.user._id).populate("cart.product");
    res.json({ success: true, cart: updated.cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/cart/:itemId  — remove one item
router.delete("/:itemId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const item = user.cart.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: "Cart item not found" });

    item.deleteOne();
    await user.save();

    const updated = await User.findById(req.user._id).populate("cart.product");
    res.json({ success: true, cart: updated.cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/cart  — clear cart
router.delete("/", protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { cart: [] });
    res.json({ success: true, cart: [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
