import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'
import { useCart } from '../contexts/CartContext'
import {
  ShoppingCart, Trash2, Plus, Minus, ArrowLeft,
  ChefHat, ReceiptText, AlertCircle, Loader2,
  UtensilsCrossed, Tag, X, CheckCircle2,
  StickyNote, MapPin
} from 'lucide-react'

const TAX_RATE = 0.10   // 10 %

// ── Empty cart state ──────────────────────────────────────────────────────────
function EmptyCart({ onBack }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-5 text-center px-4">
      <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10
                      flex items-center justify-center">
        <ShoppingCart className="w-10 h-10 text-gray-600" />
      </div>
      <div>
        <p className="text-white text-lg font-semibold">Your cart is empty</p>
        <p className="text-gray-500 text-sm mt-1">
          Add some delicious items from the menu first.
        </p>
      </div>
      <button onClick={onBack} className="btn-primary">
        <ArrowLeft className="w-4 h-4" />
        Back to Menu
      </button>
    </div>
  )
}

// ── Single cart row ───────────────────────────────────────────────────────────
function CartRow({ item, onAdd, onRemove, onDelete }) {
  return (
    <div className="flex items-center gap-4 p-4 glass-card
                    hover:border-white/15 transition-all duration-200 group">
      {/* Image */}
      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-800">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UtensilsCrossed className="w-6 h-6 text-gray-600" />
          </div>
        )}
      </div>

      {/* Name + unit price */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{item.name}</p>
        <p className="text-gray-500 text-xs mt-0.5">
          ${Number(item.price).toFixed(2)} each
        </p>
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onRemove}
          className="w-7 h-7 rounded-lg bg-white/8 hover:bg-white/15
                     border border-white/10 flex items-center justify-center
                     text-gray-300 transition-colors"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="text-white font-bold text-sm w-5 text-center">
          {item.quantity}
        </span>
        <button
          onClick={onAdd}
          className="w-7 h-7 rounded-lg bg-purple-700 hover:bg-purple-600
                     flex items-center justify-center text-white transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Line total */}
      <div className="text-right shrink-0 w-16">
        <p className="text-amber-400 font-bold text-sm">
          ${(item.price * item.quantity).toFixed(2)}
        </p>
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition-opacity
                   w-7 h-7 rounded-lg hover:bg-red-500/20 flex items-center
                   justify-center text-gray-500 hover:text-red-400"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ── Order summary card ────────────────────────────────────────────────────────
function OrderSummary({ subtotal, tax, total }) {
  const rows = [
    { label: 'Subtotal',    value: subtotal, muted: true  },
    { label: 'Tax (5%)',    value: tax,      muted: true  },
    { label: 'Total',       value: total,    muted: false },
  ]
  return (
    <div className="glass-card p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <ReceiptText className="w-4 h-4 text-purple-400" />
        <h3 className="text-white font-semibold text-sm">Order Summary</h3>
      </div>
      {rows.map(({ label, value, muted }) => (
        <div key={label}
          className={`flex items-center justify-between
            ${!muted ? 'border-t border-white/8 pt-3 mt-1' : ''}`}
        >
          <span className={muted ? 'text-gray-400 text-sm' : 'text-white font-bold'}>
            {label}
          </span>
          <span className={muted
            ? 'text-gray-300 text-sm'
            : 'text-amber-400 font-bold text-xl'
          }>
            ${value.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Success overlay ───────────────────────────────────────────────────────────
function SuccessOverlay({ tableNum }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center
                    bg-gray-950/90 backdrop-blur-md animate-fade-in">
      <div className="flex flex-col items-center gap-4 text-center px-8">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border-2
                        border-green-500/40 flex items-center justify-center
                        animate-pulse-slow">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <div>
          <p className="text-white text-xl font-bold">Order Placed!</p>
          <p className="text-gray-400 text-sm mt-1">
            {tableNum
              ? `Heading to your table in just a moment…`
              : 'Your order is being prepared…'}
          </p>
        </div>
        <Loader2 className="w-5 h-5 text-purple-400 animate-spin mt-2" />
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function Cart() {
  const [searchParams]           = useSearchParams()
  const navigate                 = useNavigate()
  const { items, addItem, updateQty, removeItem, clearCart, totalPrice } = useCart()

  // Table number: URL param first, then localStorage fallback
  const tableNum = searchParams.get('table') ||
                   localStorage.getItem('qrdine-table') || ''

  // Persist table number to localStorage whenever it's present in the URL
  if (searchParams.get('table')) {
    localStorage.setItem('qrdine-table', searchParams.get('table'))
  }

  const [note,          setNote]          = useState('')
  const [tableInput,    setTableInput]    = useState(tableNum)
  const [placing,       setPlacing]       = useState(false)
  const [error,         setError]         = useState('')
  const [showSuccess,   setShowSuccess]   = useState(false)

  // ── Totals ──────────────────────────────────────────────────────────────────
  const subtotal = totalPrice
  const tax      = subtotal * TAX_RATE
  const total    = subtotal + tax

  // ── Place order ─────────────────────────────────────────────────────────────
  const placeOrder = async () => {
    const tNum = (tableInput || tableNum || '').toString().trim()
    if (!tNum) {
      setError('Please enter your table number before placing the order.')
      return
    }
    if (items.length === 0) return

    setPlacing(true)
    setError('')

    try {
      // 1. Insert the order row
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_number: Number(tNum),
          status:       'pending',
          note:         note.trim() || null,
          total_amount: Number(total.toFixed(2)),
        })
        .select()
        .single()

      if (orderError) throw orderError

      // 2. Insert all order_items rows
      const orderItems = items.map(item => ({
        order_id:     order.id,
        menu_item_id: item.id,
        name:         item.name,
        price:        Number(item.price),
        quantity:     item.quantity,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // 3. Save order id + table for status page
      localStorage.setItem('qrdine-order-id',    order.id)
      localStorage.setItem('qrdine-table',        tNum)

      // 4. Show success flash, clear cart, then navigate
      setShowSuccess(true)
      setTimeout(() => {
        clearCart()
        navigate(`/order-status?order=${order.id}&table=${tNum}`)
      }, 1800)

    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.')
      setPlacing(false)
    }
  }

  const handleBack = () =>
    navigate(tableNum ? `/?table=${tableNum}` : '/')

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 bg-grid transition-colors duration-300">
      <Navbar />

      {showSuccess && <SuccessOverlay tableNum={tableNum} />}

      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* ── Page header ── */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10
                       border border-white/8 flex items-center justify-center
                       text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-white text-xl font-bold">Your Cart</h1>
            <p className="text-gray-400 text-xs mt-0.5">
              {items.length === 0
                ? 'No items yet'
                : `${items.reduce((s,i) => s+i.quantity, 0)} item(s) · $${subtotal.toFixed(2)}`}
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <EmptyCart onBack={handleBack} />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* ── Left column: items ── */}
            <div className="flex-1 flex flex-col gap-4 w-full">

              {/* Item list */}
              <div className="flex flex-col gap-2">
                {items.map(item => (
                  <CartRow
                    key={item.id}
                    item={item}
                    onAdd={()    => addItem(item)}
                    onRemove={()  => updateQty(item.id, item.quantity - 1)}
                    onDelete={()  => removeItem(item.id)}
                  />
                ))}
              </div>

              {/* Clear all */}
              <button
                onClick={clearCart}
                className="self-end flex items-center gap-1.5 text-xs
                           text-gray-500 hover:text-red-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear all items
              </button>

              {/* ── Table number ── */}
              <div className="glass-card p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <h3 className="text-white font-semibold text-sm">Table Number</h3>
                  {tableNum && (
                    <span className="ml-auto text-xs bg-green-500/10 text-green-400
                                     border border-green-500/20 px-2 py-0.5 rounded-full
                                     flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Auto-detected
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="1"
                  value={tableInput}
                  onChange={e => setTableInput(e.target.value)}
                  placeholder="Enter your table number…"
                  className="input-field"
                />
                <p className="text-gray-600 text-xs">
                  {tableNum
                    ? `Detected from your QR scan. Change if needed.`
                    : `Ask a staff member for your table number.`}
                </p>
              </div>

              {/* ── Special note ── */}
              <div className="glass-card p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-purple-400" />
                  <h3 className="text-white font-semibold text-sm">
                    Special Instructions
                  </h3>
                  <span className="ml-auto text-xs text-gray-600">Optional</span>
                </div>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Allergies, dietary requirements, extra sauce…"
                  rows={3}
                  maxLength={300}
                  className="input-field resize-none text-sm"
                />
                <p className="text-gray-600 text-xs text-right">
                  {note.length}/300
                </p>
              </div>
            </div>

            {/* ── Right column: summary + checkout ── */}
            <div className="w-full lg:w-72 flex flex-col gap-4 lg:sticky lg:top-20">

              <OrderSummary subtotal={subtotal} tax={tax} total={total} />

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 text-red-400 text-xs
                                bg-red-500/10 border border-red-500/20
                                rounded-xl px-4 py-3 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {/* Place order button */}
              <button
                onClick={placeOrder}
                disabled={placing || items.length === 0}
                className="btn-amber justify-center py-4 text-base w-full
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {placing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Placing Order…
                  </>
                ) : (
                  <>
                    <ChefHat className="w-5 h-5" />
                    Place Order · ${total.toFixed(2)}
                  </>
                )}
              </button>

              {/* Trust badges */}
              <div className="flex flex-col gap-2">
                {[
                  { icon: Tag,         text: 'No hidden fees'              },
                  { icon: ChefHat,     text: 'Freshly prepared to order'   },
                  { icon: ReceiptText, text: 'Bill available after service' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text}
                    className="flex items-center gap-2 text-gray-500 text-xs">
                    <Icon className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}