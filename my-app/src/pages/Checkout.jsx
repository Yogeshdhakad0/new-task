import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { clearCartAPI } from '../store/tshirtSlice'
import API from '../api'
import './Checkout.css'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh'
]

function Checkout() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { cart } = useSelector((state) => state.products)
  const { user } = useSelector((state) => state.auth)

  const [step, setStep] = useState(1) // 1: Address, 2: Payment, 3: Success
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [errors, setErrors] = useState({})

  // Address form
  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: '',
    street: '',
    landmark: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
  })

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardName: '',
  })
  const [upiId, setUpiId] = useState('')

  // Cart calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity, 0
  )
  const shippingPrice = subtotal > 1000 ? 0 : 100
  const taxPrice = +(subtotal * 0.18).toFixed(2)
  const totalPrice = +(subtotal + shippingPrice + taxPrice).toFixed(2)

  // Validate address
  const validateAddress = () => {
    const newErrors = {}
    if (!address.fullName.trim()) newErrors.fullName = 'Name required'
    if (!address.phone.trim() || !/^\d{10}$/.test(address.phone))
      newErrors.phone = 'Valid 10-digit phone required'
    if (!address.street.trim()) newErrors.street = 'Street address required'
    if (!address.city.trim()) newErrors.city = 'City required'
    if (!address.district.trim()) newErrors.district = 'District required'
    if (!address.state) newErrors.state = 'State required'
    if (!address.pincode.trim() || !/^\d{6}$/.test(address.pincode))
      newErrors.pincode = 'Valid 6-digit pincode required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Validate payment
  const validatePayment = () => {
    const newErrors = {}
    if (paymentMethod === 'Card') {
      if (!/^\d{16}$/.test(cardDetails.cardNumber.replace(/\s/g, '')))
        newErrors.cardNumber = 'Valid 16-digit card number required'
      if (!cardDetails.expiry) newErrors.expiry = 'Expiry required'
      if (!/^\d{3}$/.test(cardDetails.cvv)) newErrors.cvv = 'Valid 3-digit CVV required'
      if (!cardDetails.cardName.trim()) newErrors.cardName = 'Card holder name required'
    }
    if (paymentMethod === 'UPI') {
      if (!upiId.trim() || !upiId.includes('@'))
        newErrors.upiId = 'Valid UPI ID required (e.g. name@upi)'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddressNext = () => {
    if (validateAddress()) setStep(2)
  }

  const handlePlaceOrder = async () => {
    if (!validatePayment()) return

    setLoading(true)
    try {
      const orderItems = cart.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
      }))

      const { data } = await API.post('/orders', {
        orderItems,
        shippingAddress: {
          street: address.street,
          landmark: address.landmark,
          city: address.city,
          district: address.district,
          state: address.state,
          zipCode: address.pincode,
          phone: address.phone,
          fullName: address.fullName,
        },
        paymentMethod,
      })

      if (data.success) {
        setOrderId(data.order._id)
        dispatch(clearCartAPI())
        setStep(3)
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Order failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Format card number with spaces
  const formatCardNumber = (value) => {
    return value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19)
  }

  if (cart.length === 0 && step !== 3) {
    return (
      <div className="checkout-container">
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '60px' }}>🛒</div>
          <h2 style={{ color: '#2c3e50' }}>Your cart is empty</h2>
          <button className="btn-filled" onClick={() => navigate('/user')}>
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-container">
      {/* Header */}
      <div className="checkout-header">
        {step < 3 && (
          <button className="back-btn" onClick={() => step === 1 ? navigate('/user') : setStep(1)}>
            ← Back
          </button>
        )}
        <h1>🛍️ Checkout</h1>
      </div>

      {/* Steps */}
      {step < 3 && (
        <div className="checkout-steps">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-circle">{step > 1 ? '✓' : '1'}</div>
            <span className="step-label">Address</span>
          </div>
          <div className={`step-line ${step > 1 ? 'completed' : ''}`} />
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-circle">2</div>
            <span className="step-label">Payment</span>
          </div>
        </div>
      )}

      {/* Success Page */}
      {step === 3 && (
        <div style={{ padding: '20px' }}>
          <div className="success-container">
            <div className="success-icon">🎉</div>
            <h2>Order Placed Successfully!</h2>
            <p>Thank you, <strong>{user?.name}</strong>!</p>
            <p>Your order has been placed and will be delivered soon.</p>
            <div className="order-id-badge">
              Order ID: #{orderId.slice(-10).toUpperCase()}
            </div>
            <p style={{ fontSize: '14px', color: '#999' }}>
              📦 Estimated delivery: 3-5 business days
            </p>
            <div className="success-actions">
              <button className="btn-outline" onClick={() => navigate('/user')}>
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Address */}
      {step === 1 && (
        <div className="checkout-content">
          <div className="checkout-form-section">
            <h2>📍 Delivery Address</h2>

            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={address.fullName}
                  onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                  placeholder="Enter full name"
                  className={errors.fullName ? 'error' : ''}
                />
                {errors.fullName && <span className="error-text">{errors.fullName}</span>}
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  placeholder="10-digit mobile number"
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Street Address / Area *</label>
              <input
                type="text"
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                placeholder="House no, Building, Street, Area"
                className={errors.street ? 'error' : ''}
              />
              {errors.street && <span className="error-text">{errors.street}</span>}
            </div>

            <div className="form-group">
              <label>Landmark (Optional)</label>
              <input
                type="text"
                value={address.landmark}
                onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                placeholder="Near school, temple, etc."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  placeholder="City"
                  className={errors.city ? 'error' : ''}
                />
                {errors.city && <span className="error-text">{errors.city}</span>}
              </div>
              <div className="form-group">
                <label>District *</label>
                <input
                  type="text"
                  value={address.district}
                  onChange={(e) => setAddress({ ...address, district: e.target.value })}
                  placeholder="District"
                  className={errors.district ? 'error' : ''}
                />
                {errors.district && <span className="error-text">{errors.district}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>State *</label>
                <select
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className={errors.state ? 'error' : ''}
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.state && <span className="error-text">{errors.state}</span>}
              </div>
              <div className="form-group">
                <label>Pincode *</label>
                <input
                  type="text"
                  value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="6-digit pincode"
                  className={errors.pincode ? 'error' : ''}
                />
                {errors.pincode && <span className="error-text">{errors.pincode}</span>}
              </div>
            </div>

            <button className="checkout-btn-primary" onClick={handleAddressNext}>
              Continue to Payment →
            </button>
          </div>

          {/* Order Summary */}
          <OrderSummary cart={cart} subtotal={subtotal} shippingPrice={shippingPrice} taxPrice={taxPrice} totalPrice={totalPrice} />
        </div>
      )}

      {/* Step 2: Payment */}
      {step === 2 && (
        <div className="checkout-content">
          <div className="checkout-form-section">
            <h2>💳 Payment Method</h2>

            <div className="payment-methods">
              {/* COD */}
              <div
                className={`payment-option ${paymentMethod === 'COD' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('COD')}
              >
                <input type="radio" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
                <span className="payment-icon">💵</span>
                <div className="payment-info">
                  <h4>Cash on Delivery</h4>
                  <p>Pay when your order arrives</p>
                </div>
              </div>

              {/* Card */}
              <div
                className={`payment-option ${paymentMethod === 'Card' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('Card')}
              >
                <input type="radio" checked={paymentMethod === 'Card'} onChange={() => setPaymentMethod('Card')} />
                <span className="payment-icon">💳</span>
                <div className="payment-info">
                  <h4>Credit / Debit Card</h4>
                  <p>Visa, Mastercard, RuPay</p>
                </div>
              </div>

              {paymentMethod === 'Card' && (
                <div className="card-details">
                  <div className="form-group">
                    <label>Card Number *</label>
                    <input
                      type="text"
                      value={cardDetails.cardNumber}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: formatCardNumber(e.target.value) })}
                      placeholder="1234 5678 9012 3456"
                      className={errors.cardNumber ? 'error' : ''}
                    />
                    {errors.cardNumber && <span className="error-text">{errors.cardNumber}</span>}
                  </div>
                  <div className="form-group">
                    <label>Card Holder Name *</label>
                    <input
                      type="text"
                      value={cardDetails.cardName}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardName: e.target.value })}
                      placeholder="Name on card"
                      className={errors.cardName ? 'error' : ''}
                    />
                    {errors.cardName && <span className="error-text">{errors.cardName}</span>}
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Expiry Date *</label>
                      <input
                        type="month"
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                        className={errors.expiry ? 'error' : ''}
                      />
                      {errors.expiry && <span className="error-text">{errors.expiry}</span>}
                    </div>
                    <div className="form-group">
                      <label>CVV *</label>
                      <input
                        type="password"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                        placeholder="•••"
                        className={errors.cvv ? 'error' : ''}
                      />
                      {errors.cvv && <span className="error-text">{errors.cvv}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* UPI */}
              <div
                className={`payment-option ${paymentMethod === 'UPI' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('UPI')}
              >
                <input type="radio" checked={paymentMethod === 'UPI'} onChange={() => setPaymentMethod('UPI')} />
                <span className="payment-icon">📱</span>
                <div className="payment-info">
                  <h4>UPI Payment</h4>
                  <p>GPay, PhonePe, Paytm</p>
                </div>
              </div>

              {paymentMethod === 'UPI' && (
                <div className="card-details">
                  <div className="form-group">
                    <label>UPI ID *</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@upi"
                      className={errors.upiId ? 'error' : ''}
                    />
                    {errors.upiId && <span className="error-text">{errors.upiId}</span>}
                  </div>
                </div>
              )}
            </div>

            <button
              className="checkout-btn-primary green"
              onClick={handlePlaceOrder}
              disabled={loading}
            >
              {loading ? '⏳ Placing Order...' : '✅ Place Order'}
            </button>
          </div>

          {/* Order Summary */}
          <OrderSummary cart={cart} subtotal={subtotal} shippingPrice={shippingPrice} taxPrice={taxPrice} totalPrice={totalPrice} />
        </div>
      )}
    </div>
  )
}

// Order Summary Component
function OrderSummary({ cart, subtotal, shippingPrice, taxPrice, totalPrice }) {
  return (
    <div className="order-summary">
      <h3>🧾 Order Summary</h3>
      <div className="summary-items">
        {cart.map((item) => (
          <div key={item._id} className="summary-item">
            <img
              src={item.product?.images?.[0] || 'https://via.placeholder.com/56x56?text=?'}
              alt={item.product?.name}
            />
            <div className="summary-item-info">
              <h4>{item.product?.name}</h4>
              <p>Qty: {item.quantity}</p>
            </div>
            <div className="summary-item-price">
              ₹{((item.product?.price || 0) * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
      <hr className="summary-divider" />
      <div className="summary-row">
        <span>Subtotal</span>
        <span>₹{subtotal.toFixed(2)}</span>
      </div>
      <div className={`summary-row ${shippingPrice === 0 ? 'free' : ''}`}>
        <span>Shipping</span>
        <span>{shippingPrice === 0 ? 'FREE' : `₹${shippingPrice}`}</span>
      </div>
      <div className="summary-row">
        <span>Tax (18%)</span>
        <span>₹{taxPrice}</span>
      </div>
      <div className="summary-row total">
        <span>Total</span>
        <span>₹{totalPrice}</span>
      </div>
      {shippingPrice > 0 && (
        <p style={{ fontSize: '12px', color: '#27ae60', marginTop: '8px', textAlign: 'center' }}>
          🎁 Add ₹{(1000 - subtotal).toFixed(0)} more for FREE shipping!
        </p>
      )}
    </div>
  )
}

export default Checkout
