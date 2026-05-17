import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../store/authSlice'
import {
  fetchProducts,
  fetchCart,
  addToCartAPI,
  updateCartItemAPI,
  removeFromCartAPI,
} from '../store/tshirtSlice'
import { useState, useEffect } from 'react'
import './User.css'

function User() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const { items, cart, loading } = useSelector((state) => state.products)

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showCart, setShowCart] = useState(false)
  const [selectedSize, setSelectedSize] = useState({})
  const [addingId, setAddingId] = useState(null)
  const [cartError, setCartError] = useState('')

  useEffect(() => {
    dispatch(fetchProducts())
    dispatch(fetchCart())
  }, [dispatch])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const handleAddToCart = async (product) => {
    const size = selectedSize[product._id] || product.sizes?.[0] || ''
    setAddingId(product._id)
    setCartError('')
    const result = await dispatch(addToCartAPI({ productId: product._id, quantity: 1, size }))
    if (addToCartAPI.rejected.match(result)) {
      setCartError(result.payload || 'Failed to add to cart')
    }
    setAddingId(null)
  }

  const handleUpdateQuantity = async (item, newQty) => {
    setCartError('')
    if (newQty < 1) {
      await dispatch(removeFromCartAPI(item._id))
    } else {
      const result = await dispatch(updateCartItemAPI({ itemId: item._id, quantity: newQty }))
      if (updateCartItemAPI.rejected.match(result)) {
        setCartError(result.payload || 'Failed to update quantity')
      }
    }
  }

  const handleRemoveFromCart = async (itemId) => {
    await dispatch(removeFromCartAPI(itemId))
  }

  const filteredItems =
    selectedCategory === 'all'
      ? items
      : items.filter((item) => item.category === selectedCategory)

  const cartTotal = cart.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  )
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="user-container">
      <header className="user-header">
        <div className="header-left">
          <h1>Fashion Store</h1>
        </div>
        <div className="header-center">
          <div className="category-filter">
            {['all', 'tshirt', 'jeans'].map((cat) => (
              <button
                key={cat}
                className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'all' ? 'All' : cat === 'tshirt' ? 'T-Shirts' : 'Jeans'}
              </button>
            ))}
          </div>
        </div>
        <div className="header-right">
          <span className="welcome-text">Welcome, {user?.name}</span>
          {user?.role !== 'admin' && (
            <button className="cart-btn" onClick={() => setShowCart(!showCart)}>
              🛒 Cart
              {cartItemCount > 0 && (
                <span className="cart-badge">{cartItemCount}</span>
              )}
            </button>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="user-content">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '3rem' }}>Loading products...</p>
        ) : (
          <div className="tshirt-grid user">
            {filteredItems.map((product) => (
              <div key={product._id} className="tshirt-card user">
                <div className="tshirt-image">
                  <img
                    src={product.images?.[0] || 'https://via.placeholder.com/400x500?text=No+Image'}
                    alt={product.name}
                  />
                  <div className="tshirt-overlay">
                    <p>{product.description}</p>
                    {product.brand && <p className="product-brand">Brand: {product.brand}</p>}
                  </div>
                </div>
                <div className="tshirt-info">
                  <h3>{product.name}</h3>
                  {product.brand && <p className="product-brand-small">{product.brand}</p>}
                  <p className="tshirt-price">${Number(product.price).toFixed(2)}</p>
                  {product.sizes?.length > 0 && (
                    <div className="size-selector">
                      <label>Size:</label>
                      <select
                        value={selectedSize[product._id] || product.sizes[0]}
                        onChange={(e) =>
                          setSelectedSize({ ...selectedSize, [product._id]: e.target.value })
                        }
                      >
                        {product.sizes.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {user?.role !== 'admin' ? (
                    <button
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(product)}
                      disabled={addingId === product._id || product.stock === 0}
                    >
                      {product.stock === 0
                        ? 'Out of Stock'
                        : addingId === product._id
                        ? 'Adding...'
                        : 'Add to Cart'}
                    </button>
                  ) : (
                    <div style={{ 
                      padding: '10px', 
                      textAlign: 'center', 
                      color: '#666',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      Stock: {product.stock} units
                    </div>
                  )}
                </div>
              </div>
            ))}

          </div>
        )}
      </div>

      {showCart && (
        <div className="cart-sidebar">
          <div className="cart-header">
            <h2>Shopping Cart</h2>
            <button className="close-cart" onClick={() => setShowCart(false)}>
              ✕
            </button>
          </div>

          {cartError && (
            <div style={{ 
              padding: '10px', 
              margin: '10px', 
              background: '#fee', 
              color: '#c00', 
              borderRadius: '5px',
              fontSize: '14px'
            }}>
              {cartError}
            </div>
          )}

          <div className="cart-items">
            {cart.length === 0 ? (
              <p className="empty-cart">Your cart is empty</p>
            ) : (
              cart.map((item) => (
                <div key={item._id} className="cart-item">
                  <img
                    src={item.product?.images?.[0] || 'https://via.placeholder.com/80x80?text=?'}
                    alt={item.product?.name}
                    className="cart-item-image"
                  />
                  <div className="cart-item-details">
                    <h4>{item.product?.name}</h4>
                    <p className="cart-item-price">
                      ${Number(item.product?.price || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="cart-item-quantity">
                    <button
                      className="qty-btn"
                      onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      className="qty-btn"
                      onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                      disabled={item.quantity >= item.product?.stock}
                      style={{ 
                        opacity: item.quantity >= item.product?.stock ? 0.5 : 1,
                        cursor: item.quantity >= item.product?.stock ? 'not-allowed' : 'pointer'
                      }}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="remove-item"
                    onClick={() => handleRemoveFromCart(item._id)}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="cart-footer">
            <div className="cart-total">
              <span>Total:</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <button className="checkout-btn" disabled={cart.length === 0}>
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default User
