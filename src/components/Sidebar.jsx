import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, UtensilsCrossed, ShoppingBag,
  BarChart3, QrCode, LogOut, ChefHat, Sun, Moon
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/qr', label: 'QR Codes', icon: QrCode },
]

export default function Sidebar() {
  const { signOut } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin')
  }

  return (
    <aside className="w-64 min-h-screen bg-gray-900 border-r border-white/5 flex flex-col p-4 gap-2
                      transition-colors duration-300">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 mb-2">
        <div className="w-9 h-9 rounded-xl bg-purple-700 flex items-center justify-center">
          <ChefHat className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-white font-bold text-lg transition-colors duration-300">
            QrDine
          </span>
          <p className="text-gray-500 text-xs transition-colors duration-300">
            Admin Panel
          </p>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => isActive ? 'sidebar-item-active' : 'sidebar-item'}
          >
            <Icon className="w-5 h-5" />
            <span className="text-sm font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col gap-1 pt-2 border-t border-white/5 transition-colors duration-300">
        {/* Theme toggle */}
        <button onClick={toggleTheme} className="sidebar-item">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="text-sm font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        
        {/* Sign out */}
        <button onClick={handleSignOut} className="sidebar-item text-red-400 hover:text-red-300 
                                                   hover:bg-red-500/10 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}