import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../store/authSlice'
import {
  fetchProducts,
  createProduct,
  editProduct,
  deleteProduct,
} from '../store/tshirtSlice'
import { useState, useEffect } from 'react'
import API from '../api'
import './Admin.css'

const emptyForm = {
  name: '',
  price: '',
  images: '',
  description: '',
  sizes: '',
  category: 'tshirt',
  stock: '',
  brand: '',
}

function Admin() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const { items, loading, error } = useSelector((state) => state.products)

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [orders, setOrders] = useState([])
  const [userStats, setUserStats] = useState({ totalUsers: 0, total: 0 })
  const [showOrders, setShowOrders] = useState(false)

  useEffect(() => {
    dispatch(fetchProducts())
    fetchOrders()
    fetchUserStats()
  }, [dispatch])

  const fetchOrders = async () => {
    try {
      const { data } = await API.get('/orders/admin/all')
      setOrders(data.orders || [])
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    }
  }

  const fetchUserStats = async () => {
    try {
      const { data } = await API.get('/auth/users/count')
      setUserStats(data)
    } catch (err) {
      console.error('Failed to fetch user stats:', err)
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const handleRemoveProduct = async (id) => {
    if (window.confirm('Are you sure you want to remove this product?')) {
      await dispatch(deleteProduct(id))
    }
  }

  const handleEditProduct = (product) => {
    setEditingId(product._id)
    setFormData({
      name: product.name,
      price: product.price,
      images: product.images?.join(', ') || '',
      description: product.description,
      sizes: product.sizes?.join(', ') || '',
      category: product.category,
      stock: product.stock,
      brand: product.brand || '',
    })
    setShowAddForm(true)
  }

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.price) return

    const payload = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      sizes: formData.sizes ? formData.sizes.split(',').map((s) => s.trim()) : [],
      images: formData.images ? formData.images.split(',').map((s) => s.trim()) : [],
      stock: parseInt(formData.stock) || 0,
      brand: formData.brand,
    }

    setSaving(true)
    if (editingId) {
      await dispatch(editProduct({ id: editingId, ...payload }))
    } else {
      await dispatch(createProduct(payload))
    }
    setSaving(false)
    cancelForm()
  }

  const cancelForm = () => {
    setShowAddForm(false)
    setEditingId(null)
    setFormData(emptyForm)
  }

  const tshirtCount = items.filter((item) => item.category === 'tshirt').length
  const jeansCount = items.filter((item) => item.category === 'jeans').length
  const totalStock = items.reduce((sum, item) => sum + (item.stock || 0), 0)

  const filteredItems =
    selectedCategory === 'all'
      ? items
      : items.filter((item) => item.category === selectedCategory)

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="header-left">
          <h1>Admin Panel</h1>
          <span className="welcome-text">Welcome, {user?.name}</span>
        </div>
        <div className="header-right">
          <button className="nav-btn" onClick={() => navigate('/user')}>
            View Store
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="admin-dashboard">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Products</h3>
            <p className="stat-number">{items.length}</p>
          </div>
          <div className="stat-card">
            <h3>Total Users</h3>
            <p className="stat-number">{userStats.totalUsers}</p>
          </div>
          <div className="stat-card">
            <h3>Total Orders</h3>
            <p className="stat-number">{orders.length}</p>
          </div>
          <div className="stat-card">
            <h3>Total Stock</h3>
            <p className="stat-number">{totalStock}</p>
          </div>
        </div>

        {error && <div className="error-message" style={{ margin: '1rem 0' }}>{error}</div>}

        {/* Orders Section */}
        <div className="admin-content" style={{ marginBottom: '2rem' }}>
          <div className="section-header">
            <h2>Orders Management</h2>
            <button
              className="add-btn"
              onClick={() => setShowOrders(!showOrders)}
            >
              {showOrders ? 'Hide Orders' : 'View All Orders'}
            </button>
          </div>

          {showOrders && (
            <div style={{ marginTop: '1rem' }}>
              {orders.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No orders yet
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    background: 'white',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Order ID</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>User</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Items</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Total</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order._id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px' }}>
                            <span style={{ 
                              fontFamily: 'monospace', 
                              fontSize: '12px',
                              background: '#f0f0f0',
                              padding: '4px 8px',
                              borderRadius: '4px'
                            }}>
                              {order._id.slice(-8)}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div>
                              <strong>{order.user?.name || 'N/A'}</strong>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {order.user?.email || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontSize: '13px' }}>
                              {order.orderItems?.map((item, idx) => (
                                <div key={idx} style={{ marginBottom: '4px' }}>
                                  {item.product?.name || 'Product'} × {item.quantity}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <strong>${order.totalPrice?.toFixed(2)}</strong>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ 
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: order.orderStatus === 'Delivered' ? '#d4edda' : 
                                         order.orderStatus === 'Shipped' ? '#cce5ff' : '#fff3cd',
                              color: order.orderStatus === 'Delivered' ? '#155724' : 
                                     order.orderStatus === 'Shipped' ? '#004085' : '#856404'
                            }}>
                              {order.orderStatus}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Products Section */}
        <div className="admin-content">
          <div className="section-header">
            <h2>Manage Products</h2>
            <button
              className="add-btn"
              onClick={() => {
                if (showAddForm) cancelForm()
                else setShowAddForm(true)
              }}
            >
              {showAddForm ? 'Cancel' : '+ Add New Product'}
            </button>
          </div>

          {showAddForm && (
            <div className="add-form-container">
              <h3>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Product Name"
                  />
                </div>
                <div className="form-group">
                  <label>Price ($)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Brand Name"
                  />
                </div>
                <div className="form-group">
                  <label>Stock</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Image URLs (comma separated)</label>
                  <input
                    type="text"
                    value={formData.images}
                    onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="tshirt">T-Shirt</option>
                    <option value="jeans">Jeans</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Product description..."
                    rows="2"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Sizes (comma separated)</label>
                  <input
                    type="text"
                    value={formData.sizes}
                    onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                    placeholder="S, M, L, XL (or 28, 30, 32, 34 for jeans)"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button className="submit-btn" onClick={handleSaveProduct} disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
                </button>
                <button className="cancel-btn" onClick={cancelForm}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="filter-tabs">
            {['all', 'tshirt', 'jeans'].map((cat) => (
              <button
                key={cat}
                className={`filter-tab ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'all' ? 'All Products' : cat === 'tshirt' ? 'T-Shirts' : 'Jeans'}
              </button>
            ))}
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem' }}>Loading products...</p>
          ) : (
            <div className="tshirt-grid admin">
              {filteredItems.map((product) => (
                <div key={product._id} className="tshirt-card admin">
                  <div className="tshirt-image">
                    <img
                      src={product.images?.[0] || 'https://via.placeholder.com/400x500?text=No+Image'}
                      alt={product.name}
                    />
                    <span className={`category-badge ${product.category}`}>
                      {product.category === 'tshirt' ? 'T-Shirt' : 'Jeans'}
                    </span>
                  </div>
                  <div className="tshirt-info">
                    <h3>{product.name}</h3>
                    <p className="tshirt-brand">{product.brand}</p>
                    <p className="tshirt-price">${Number(product.price).toFixed(2)}</p>
                    <p className="tshirt-stock">Stock: {product.stock} units</p>
                    <div className="tshirt-sizes">
                      {product.sizes?.map((size) => (
                        <span key={size} className="size-tag">
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="tshirt-actions">
                    <button className="edit-btn" onClick={() => handleEditProduct(product)}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => handleRemoveProduct(product._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Admin
