import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'
import { useCart } from '../contexts/CartContext'
import {
  Plus, Minus, ShoppingCart, Star, Search,
  UtensilsCrossed, Wifi, WifiOff, ChefHat,
  Flame, Loader2, X
} from 'lucide-react'

// ── Item quantity control (inline on card) ────────────────────────────────────
function QtyControl({ count, onAdd, onRemove }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onRemove}
        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20
                   border border-white/10 flex items-center justify-center
                   text-white transition-colors"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="text-white font-bold text-sm w-4 text-center">{count}</span>
      <button
        onClick={onAdd}
        className="w-7 h-7 rounded-lg bg-purple-700 hover:bg-purple-600
                   flex items-center justify-center text-white transition-colors"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  )
}

// ── Single menu item card ─────────────────────────────────────────────────────
function MenuCard({ item, count, onAdd, onRemove }) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className={`
      relative flex flex-col rounded-2xl overflow-hidden
      bg-white/5 backdrop-blur-md border transition-all duration-300
      hover:shadow-xl hover:-translate-y-0.5
      ${count > 0
        ? 'border-purple-500/50 shadow-lg shadow-purple-900/20'
        : 'border-white/8 hover:border-white/15'}
    `}>
      {/* ── Image ── */}
      <div className="relative h-44 bg-gray-800 overflow-hidden">
        {item.image_url && !imgError ? (
          <img
            src={item.image_url}
            alt={item.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform
                       duration-500 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UtensilsCrossed className="w-10 h-10 text-gray-600" />
          </div>
        )}

        {/* Gradient overlay — always present so text reads well */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Featured badge */}
        {item.is_featured && (
          <div className="absolute top-2 left-2 flex items-center gap-1
                          bg-amber-500 text-gray-900 text-xs font-bold
                          px-2 py-0.5 rounded-full">
            <Star className="w-3 h-3" />
            Featured
          </div>
        )}

        {/* Cart count bubble */}
        {count > 0 && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-purple-600
                          rounded-full flex items-center justify-center
                          text-white text-xs font-bold shadow-lg
                          animate-fade-in">
            {count}
          </div>
        )}

        {/* Price pinned to bottom-left of image */}
        <div className="absolute bottom-2 left-3">
          <span className="text-white font-bold text-lg drop-shadow-md">
            Rs.{Number(item.price).toFixed(2)}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <div>
          <h3 className="text-white font-semibold text-sm leading-snug">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-gray-400 text-xs mt-1 leading-relaxed line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        {/* ── Add / Qty control ── */}
        <div className="mt-auto pt-2">
          {count === 0 ? (
            <button
              onClick={onAdd}
              className="w-full flex items-center justify-center gap-2
                         bg-purple-700 hover:bg-purple-600 active:scale-95
                         text-white text-sm font-semibold py-2.5 rounded-xl
                         transition-all duration-150 shadow-md
                         hover:shadow-purple-700/40"
            >
              <Plus className="w-4 h-4" />
              Add to Cart
            </button>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-purple-400 text-xs font-medium">In cart</span>
              <QtyControl count={count} onAdd={onAdd} onRemove={onRemove} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Category pill tabs ────────────────────────────────────────────────────────
function CategoryTabs({ categories, active, onChange }) {
  const ref = useRef(null)

  // Scroll active tab into view
  useEffect(() => {
    const el = ref.current?.querySelector('[data-active="true"]')
    el?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' })
  }, [active])

  return (
    <div
      ref={ref}
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
    >
      {/* All tab */}
      <button
        data-active={active === 'all'}
        onClick={() => onChange('all')}
        className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl
                    text-sm font-medium transition-all duration-200 border
                    ${active === 'all'
                      ? 'bg-purple-700 text-white border-purple-600 shadow-lg shadow-purple-900/30'
                      : 'bg-white/5 text-gray-400 border-white/8 hover:bg-white/10 hover:text-white'
                    }`}
      >
        <ChefHat className="w-4 h-4" />
        All
      </button>

      {categories.map(cat => (
        <button
          key={cat.id}
          data-active={active === cat.id}
          onClick={() => onChange(cat.id)}
          className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl
                      text-sm font-medium transition-all duration-200 border
                      ${active === cat.id
                        ? 'bg-purple-700 text-white border-purple-600 shadow-lg shadow-purple-900/30'
                        : 'bg-white/5 text-gray-400 border-white/8 hover:bg-white/10 hover:text-white'
                      }`}
        >
          <span>{cat.icon}</span>
          {cat.name}
        </button>
      ))}
    </div>
  )
}

// ── Cart drawer (slide-up on mobile, sticky sidebar on desktop) ───────────────
function CartDrawer({ items, onClose, tableNum }) {
  const { updateQty, clearCart, totalPrice } = useCart()
  const { useNavigate } = require('react-router-dom')
  const navigate = useNavigate()

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center
                    justify-center p-4 bg-black/60 backdrop-blur-sm
                    animate-fade-in">
      <div className="glass-card w-full max-w-md max-h-[80vh] flex flex-col
                      animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-purple-400" />
            <h2 className="text-white font-semibold">Your Cart</h2>
            <span className="text-xs bg-purple-700/40 text-purple-300
                             border border-purple-500/30 px-2 py-0.5 rounded-full">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center
                       justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
          {items.map(item => (
            <div key={item.id}
              className="flex items-center gap-3 p-3 bg-white/3
                         border border-white/5 rounded-xl">
              {item.image_url && (
                <img src={item.image_url} alt={item.name}
                  className="w-12 h-12 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{item.name}</p>
                <p className="text-amber-400 text-xs font-semibold">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
              <QtyControl
                count={item.quantity}
                onAdd={() => updateQty(item.id, item.quantity + 1)}
                onRemove={() => updateQty(item.id, item.quantity - 1)}
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Total</span>
            <span className="text-white text-xl font-bold">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
          <button
            onClick={() => {
              onClose()
              navigate(tableNum ? `/cart?table=${tableNum}` : '/cart')
            }}
            className="btn-amber justify-center py-3 w-full"
          >
            <ShoppingCart className="w-4 h-4" />
            Proceed to Checkout
          </button>
          <button onClick={clearCart}
            className="text-gray-500 hover:text-red-400 text-xs text-center
                       transition-colors">
            Clear cart
          </button>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function Menu() {
  const [searchParams]               = useSearchParams()
  const tableNum                     = searchParams.get('table')

  const [categories,   setCategories]  = useState([])
  const [items,        setItems]       = useState([])
  const [loading,      setLoading]     = useState(true)
  const [online,       setOnline]      = useState(navigator.onLine)
  const [activeTab,    setActiveTab]   = useState('all')
  const [search,       setSearch]      = useState('')
  const [showCart,     setShowCart]    = useState(false)
  const [addedId,      setAddedId]     = useState(null)   // for brief flash feedback

  const { items: cartItems, addItem, updateQty, totalItems } = useCart()

  // ── Online / offline listener ───────────────────────────────────────────────
  useEffect(() => {
    const up   = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online',  up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online',  up)
      window.removeEventListener('offline', down)
    }
  }, [])

  // ── Fetch menu ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    setLoading(true)
    const [{ data: cats }, { data: menuItems }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase
        .from('menu_items')
        .select('*, categories(name, icon)')
        .eq('is_available', true)
        .order('is_featured', { ascending: false })
        .order('sort_order'),
    ])
    setCategories(cats  || [])
    setItems(menuItems  || [])
    setLoading(false)
  }

  // ── Derived: filtered items ─────────────────────────────────────────────────
  const displayed = items.filter(item => {
    const matchTab    = activeTab === 'all' || item.category_id === activeTab
    const matchSearch = !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const featured = displayed.filter(i => i.is_featured)
  const regular  = displayed.filter(i => !i.is_featured)

  // ── Cart helpers ────────────────────────────────────────────────────────────
  const cartCount = (itemId) =>
    cartItems.find(i => i.id === itemId)?.quantity ?? 0

  const handleAdd = (item) => {
    addItem(item)
    setAddedId(item.id)
    setTimeout(() => setAddedId(null), 800)
  }

  const handleRemove = (item) => {
    const current = cartCount(item.id)
    updateQty(item.id, current - 1)
  }

  // ── Table banner ────────────────────────────────────────────────────────────
  const TableBanner = () => tableNum ? (
    <div className="bg-purple-700/20 border border-purple-500/30 rounded-xl
                    px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-purple-700 flex items-center
                      justify-center shrink-0">
        <ChefHat className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-purple-200 text-sm font-semibold">
          Table {tableNum}
        </p>
        <p className="text-purple-400 text-xs">
          Your order will be brought to this table
        </p>
      </div>
    </div>
  ) : null

  // ── Loading skeleton ────────────────────────────────────────────────────────
  const Skeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white/5 border border-white/8 overflow-hidden">
          <div className="h-44 bg-white/5 animate-pulse" />
          <div className="p-4 flex flex-col gap-2">
            <div className="h-3 bg-white/5 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-white/5 rounded animate-pulse w-1/2" />
            <div className="h-8 bg-white/5 rounded-xl animate-pulse mt-2" />
          </div>
        </div>
      ))}
    </div>
  )

  // ── Item grid section ───────────────────────────────────────────────────────
  const ItemGrid = ({ items: gridItems }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {gridItems.map(item => (
        <MenuCard
          key={item.id}
          item={item}
          count={cartCount(item.id)}
          onAdd={() => handleAdd(item)}
          onRemove={() => handleRemove(item)}
        />
      ))}
    </div>
  )

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 bg-grid transition-colors duration-300">
      <Navbar />

      {/* Offline banner */}
      {!online && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2
                        flex items-center justify-center gap-2 text-red-400 text-sm">
          <WifiOff className="w-4 h-4" />
          You are offline. Menu may not be up to date.
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* ── Hero / table banner ── */}
        <div className="flex flex-col gap-4">
          <TableBanner />
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              What would you<br />
              <span className="text-gradient">like to eat?</span>
            </h1>
            <p className="text-gray-400 text-sm mt-2">
              Fresh ingredients, made to order
            </p>
          </div>
        </div>

        {/* ── Search ── */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2
                             w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search dishes…"
            className="input-field pl-10 pr-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2
                         text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Category tabs ── */}
        <CategoryTabs
          categories={categories}
          active={activeTab}
          onChange={tab => { setActiveTab(tab); setSearch('') }}
        />

        {/* ── Content ── */}
        {loading ? (
          <Skeleton />
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10
                            flex items-center justify-center">
              <UtensilsCrossed className="w-8 h-8 text-gray-600" />
            </div>
            <div>
              <p className="text-white font-medium">No items found</p>
              <p className="text-gray-500 text-sm mt-1">
                Try a different category or search term.
              </p>
            </div>
            <button
              onClick={() => { setSearch(''); setActiveTab('all') }}
              className="btn-ghost"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Featured section */}
            {featured.length > 0 && activeTab === 'all' && !search && (
              <section className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <h2 className="text-white font-bold text-lg">Chef's Picks</h2>
                  <span className="text-xs bg-amber-500/10 text-amber-400
                                   border border-amber-500/20 px-2 py-0.5 rounded-full">
                    {featured.length} items
                  </span>
                </div>
                <ItemGrid items={featured} />
              </section>
            )}

            {/* Regular / filtered items */}
            {(regular.length > 0 || search || activeTab !== 'all') && (
              <section className="flex flex-col gap-4">
                {activeTab === 'all' && !search && featured.length > 0 && (
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-purple-400" />
                    <h2 className="text-white font-bold text-lg">All Items</h2>
                  </div>
                )}
                <ItemGrid items={search || activeTab !== 'all' ? displayed : regular} />
              </section>
            )}
          </div>
        )}
      </div>

      {/* ── Floating cart button (mobile) ── */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40
                        animate-slide-up sm:hidden">
          <button
            onClick={() => setShowCart(true)}
            className="flex items-center gap-3 bg-purple-700 hover:bg-purple-600
                       text-white font-semibold px-6 py-3.5 rounded-2xl shadow-2xl
                       shadow-purple-900/50 transition-all duration-200
                       hover:scale-105 active:scale-95"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>View Cart</span>
            <span className="bg-amber-500 text-gray-900 text-xs font-bold
                             w-6 h-6 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          </button>
        </div>
      )}

      {/* ── Cart drawer ── */}
      {showCart && (
        <CartDrawer
          items={cartItems}
          onClose={() => setShowCart(false)}
          tableNum={tableNum}
        />
      )}
    </div>
  )
}