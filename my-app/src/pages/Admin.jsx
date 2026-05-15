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

  useEffect(() => {
    dispatch(fetchProducts())
  }, [dispatch])

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
            <h3>T-Shirts</h3>
            <p className="stat-number">{tshirtCount}</p>
          </div>
          <div className="stat-card">
            <h3>Jeans</h3>
            <p className="stat-number">{jeansCount}</p>
          </div>
          <div className="stat-card">
            <h3>Total Stock</h3>
            <p className="stat-number">{totalStock}</p>
          </div>
        </div>

        {error && <div className="error-message" style={{ margin: '1rem 0' }}>{error}</div>}

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
