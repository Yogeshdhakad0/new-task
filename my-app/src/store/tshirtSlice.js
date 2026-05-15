import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import API from '../api'

// ─── PRODUCT THUNKS ──────────────────────────────────────────────────────────

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await API.get('/products', { params })
      return data.products
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch products')
    }
  }
)

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const { data } = await API.post('/products', productData)
      return data.product
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create product')
    }
  }
)

export const editProduct = createAsyncThunk(
  'products/editProduct',
  async ({ id, ...productData }, { rejectWithValue }) => {
    try {
      const { data } = await API.put(`/products/${id}`, productData)
      return data.product
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update product')
    }
  }
)

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/products/${id}`)
      return id
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete product')
    }
  }
)

// ─── CART THUNKS ─────────────────────────────────────────────────────────────

export const fetchCart = createAsyncThunk(
  'products/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get('/cart')
      return data.cart
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch cart')
    }
  }
)

export const addToCartAPI = createAsyncThunk(
  'products/addToCartAPI',
  async ({ productId, quantity = 1, size }, { rejectWithValue }) => {
    try {
      const { data } = await API.post('/cart', { productId, quantity, size })
      return data.cart
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add to cart')
    }
  }
)

export const updateCartItemAPI = createAsyncThunk(
  'products/updateCartItemAPI',
  async ({ itemId, quantity }, { rejectWithValue }) => {
    try {
      const { data } = await API.put(`/cart/${itemId}`, { quantity })
      return data.cart
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update cart')
    }
  }
)

export const removeFromCartAPI = createAsyncThunk(
  'products/removeFromCartAPI',
  async (itemId, { rejectWithValue }) => {
    try {
      const { data } = await API.delete(`/cart/${itemId}`)
      return data.cart
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to remove from cart')
    }
  }
)

export const clearCartAPI = createAsyncThunk(
  'products/clearCartAPI',
  async (_, { rejectWithValue }) => {
    try {
      await API.delete('/cart')
      return []
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to clear cart')
    }
  }
)

// ─── SLICE ────────────────────────────────────────────────────────────────────

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    cart: [],
    loading: false,
    cartLoading: false,
    error: null,
  },
  reducers: {
    clearProductError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // ── Fetch Products ──
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // ── Create Product ──
    builder
      .addCase(createProduct.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.error = action.payload
      })

    // ── Edit Product ──
    builder
      .addCase(editProduct.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (p) => p._id === action.payload._id
        )
        if (index !== -1) state.items[index] = action.payload
      })
      .addCase(editProduct.rejected, (state, action) => {
        state.error = action.payload
      })

    // ── Delete Product ──
    builder
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p._id !== action.payload)
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.error = action.payload
      })

    // ── Fetch Cart ──
    builder
      .addCase(fetchCart.pending, (state) => {
        state.cartLoading = true
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.cartLoading = false
        state.cart = action.payload
      })
      .addCase(fetchCart.rejected, (state) => {
        state.cartLoading = false
      })

    // ── Add / Update / Remove / Clear Cart ──
    const setCart = (state, action) => {
      state.cart = action.payload
    }
    builder
      .addCase(addToCartAPI.fulfilled, setCart)
      .addCase(updateCartItemAPI.fulfilled, setCart)
      .addCase(removeFromCartAPI.fulfilled, setCart)
      .addCase(clearCartAPI.fulfilled, (state) => {
        state.cart = []
      })
  },
})

export const { clearProductError } = productsSlice.actions
export default productsSlice.reducer
