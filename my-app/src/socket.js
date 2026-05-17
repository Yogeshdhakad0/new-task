import { io } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:8080'

const socket = io(BACKEND_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
})

socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id)
})

socket.on('disconnect', () => {
  console.log('❌ Socket disconnected')
})

socket.on('connect_error', (err) => {
  console.warn('⚠️ Socket connection error:', err.message)
})

// Heartbeat to keep connection alive on Render free tier
setInterval(() => {
  if (socket.connected) {
    socket.emit('ping')
  }
}, 25000)

export default socket
