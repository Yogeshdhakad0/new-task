import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser, registerUser, clearError } from '../store/authSlice'
import './Login.css'

function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' })
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.auth)

  const handleChange = (e) => {
    dispatch(clearError())
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (isRegister) {
      const result = await dispatch(
        registerUser({ name: form.name, email: form.email, password: form.password, role: form.role })
      )
      if (registerUser.fulfilled.match(result)) {
        navigate(result.payload.user.role === 'admin' ? '/admin' : '/user')
      }
    } else {
      const result = await dispatch(
        loginUser({ email: form.email, password: form.password })
      )
      if (loginUser.fulfilled.match(result)) {
        navigate(result.payload.user.role === 'admin' ? '/admin' : '/user')
      }
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Welcome to T-Shirt Store</h1>
        <p className="login-subtitle">{isRegister ? 'Create an account' : 'Please login to continue'}</p>

        <form onSubmit={handleSubmit} className="login-form">
          {isRegister && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select id="role" name="role" value={form.role} onChange={handleChange}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <div className="login-info">
          <p>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              className="toggle-btn"
              onClick={() => {
                setIsRegister(!isRegister)
                dispatch(clearError())
              }}
            >
              {isRegister ? 'Login' : 'Register'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
