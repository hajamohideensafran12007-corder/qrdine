import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import ChefPINGate from './components/ChefPINGate'

import Menu from './pages/Menu'
import Cart from './pages/Cart'
import OrderStatus from './pages/OrderStatus'
import ChefDashboard from './pages/ChefDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminMenu from './pages/AdminMenu'
import AdminOrders from './pages/AdminOrders'
import Analytics from './pages/Analytics'
import QRGenerator from './pages/QRGenerator'
import Login from './pages/Login'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Menu />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/order-status" element={<OrderStatus />} />
              
               {/* Admin login — public */}
              <Route path="/admin/login" element={<Login />} />

              {/* Chef Route (PIN-protected) */}
              <Route
                path="/chef"
                element={
                  <ChefPINGate>
                    <ChefDashboard />
                  </ChefPINGate>
                }
              />

              {/* Admin Routes (Auth-protected) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/menu"
                element={
                  <ProtectedRoute>
                    <AdminMenu />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <ProtectedRoute>
                    <AdminOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/qr"
                element={
                  <ProtectedRoute>
                    <QRGenerator />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>

  )
}