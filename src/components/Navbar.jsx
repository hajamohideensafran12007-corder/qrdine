import { Link } from 'react-router-dom'
import { ShoppingCart, ChefHat, Sun, Moon } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useTheme } from '../contexts/ThemeContext'

export default function Navbar() {
  const { totalItems } = useCart()
  const { isDark, toggleTheme } = useTheme()
  const tableNum = new URLSearchParams(window.location.search).get('table')

  return (
    <header className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-lg border-b border-white/5
                       transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to={tableNum ? `/?table=${tableNum}` : '/'} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-700 flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg transition-colors duration-300">
            QrDine
          </span>
          {tableNum && (
            <span className="ml-1 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 
                             px-2 py-0.5 rounded-full">
              Table {tableNum}
            </span>
          )}
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10
                       flex items-center justify-center text-gray-400 hover:text-white
                       transition-all duration-200"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Cart button */}
          <Link
            to={tableNum ? `/cart?table=${tableNum}` : '/cart'}
            className="relative flex items-center gap-2 btn-primary"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Cart</span>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 text-gray-900 
                               text-xs font-bold rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}