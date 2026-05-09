import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'
import {
  ChefHat, Clock, CheckCircle2, Utensils, ArrowLeft,
  Package, Loader2, AlertCircle, PartyPopper, UtensilsCrossed
} from 'lucide-react'

// ── Status step configuration ─────────────────────────────────────────────────
const STEPS = [
  {
    key:   'pending',
    label: 'Order Received',
    desc:  'Your order has been confirmed',
    icon:  Package,
    color: 'text-gray-400',
    bg:    'bg-gray-500/10',
    border:'border-gray-500/30',
  },
  {
    key:   'preparing',
    label: 'Preparing',
    desc:  'Our chef is cooking your meal',
    icon:  ChefHat,
    color: 'text-amber-400',
    bg:    'bg-amber-500/10',
    border:'border-amber-500/30',
  },
  {
    key:   'ready',
    label: 'Ready',
    desc:  'Your order is ready to be served',
    icon:  Utensils,
    color: 'text-purple-400',
    bg:    'bg-purple-500/10',
    border:'border-purple-500/30',
  },
  {
    key:   'served',
    label: 'Served',
    desc:  'Enjoy your meal!',
    icon:  PartyPopper,
    color: 'text-green-400',
    bg:    'bg-green-500/10',
    border:'border-green-500/30',
  },
]

// ── Vertical step indicator ──────────────────────────────────────────────────
function StatusStep({ step, isActive, isCompleted }) {
  const Icon = step.icon

  return (
    <div className="flex items-start gap-4 relative">
      {/* Icon */}
      <div className={`
        relative z-10 w-12 h-12 rounded-xl shrink-0 flex items-center justify-center
        transition-all duration-500 border-2
        ${isActive
          ? `${step.bg} ${step.border} shadow-lg animate-pulse-slow`
          : isCompleted
            ? 'bg-purple-700/30 border-purple-500/40'
            : 'bg-white/5 border-white/10'}
      `}>
        <Icon className={`w-6 h-6 transition-colors duration-500
          ${isActive ? step.color : isCompleted ? 'text-purple-300' : 'text-gray-600'}`}
        />
        {isCompleted && !isActive && (
          <div className="absolute inset-0 rounded-xl bg-purple-500/20 animate-fade-in" />
        )}
      </div>

      {/* Label + description */}
      <div className="flex-1 pb-8">
        <p className={`font-semibold text-sm transition-colors duration-300
          ${isActive ? 'text-white' : isCompleted ? 'text-gray-300' : 'text-gray-600'}`}>
          {step.label}
        </p>
        <p className={`text-xs mt-1 transition-colors duration-300
          ${isActive ? 'text-gray-400' : 'text-gray-600'}`}>
          {step.desc}
        </p>
        {isActive && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-purple-400
                          animate-fade-in">
            <Loader2 className="w-3 h-3 animate-spin" />
            In progress…
          </div>
        )}
      </div>

      {/* Connector line */}
      {step.key !== 'served' && (
        <div className={`
          absolute left-6 top-14 w-0.5 h-full -ml-px transition-colors duration-500
          ${isCompleted ? 'bg-purple-500/40' : 'bg-white/10'}
        `} />
      )}
    </div>
  )
}

// ── Order items list ──────────────────────────────────────────────────────────
function OrderItemsList({ items }) {
  return (
    <div className="glass-card p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <UtensilsCrossed className="w-4 h-4 text-purple-400" />
        <h3 className="text-white font-semibold text-sm">Order Details</h3>
        <span className="ml-auto text-xs bg-purple-700/30 text-purple-300
                         border border-purple-500/30 px-2 py-0.5 rounded-full">
          {items.reduce((s, i) => s + i.quantity, 0)} item(s)
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {items.map(item => (
          <div key={item.id}
            className="flex items-center justify-between py-2 border-b
                       border-white/5 last:border-0">
            <div className="flex-1">
              <p className="text-white text-sm">{item.name}</p>
              <p className="text-gray-500 text-xs">
                ${Number(item.price).toFixed(2)} × {item.quantity}
              </p>
            </div>
            <span className="text-amber-400 font-semibold text-sm">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Order summary card ────────────────────────────────────────────────────────
function OrderSummaryCard({ order, tableNum }) {
  const createdAt = new Date(order.created_at)
  const timeStr   = createdAt.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true
  })

  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider">Order ID</p>
          <p className="text-white font-mono text-sm mt-0.5">
            {order.id.slice(0, 8)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-xs uppercase tracking-wider">Table</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-6 h-6 rounded-lg bg-purple-700 flex items-center
                            justify-center text-white text-xs font-bold">
              {tableNum}
            </div>
            <span className="text-white text-sm font-semibold">Table {tableNum}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <Clock className="w-3.5 h-3.5" />
          Placed at {timeStr}
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-xs">Total</p>
          <p className="text-amber-400 font-bold text-lg">
            ${Number(order.total_amount).toFixed(2)}
          </p>
        </div>
      </div>
      {order.note && (
        <div className="pt-3 border-t border-white/5">
          <p className="text-gray-400 text-xs mb-1">Special Instructions:</p>
          <p className="text-white text-sm bg-white/3 rounded-lg px-3 py-2
                        border border-white/5">
            {order.note}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Loading state ─────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
      <p className="text-gray-400 text-sm">Loading your order…</p>
    </div>
  )
}

// ── Error state ───────────────────────────────────────────────────────────────
function ErrorState({ message, onBack }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-5 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20
                      flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <div>
        <p className="text-white font-semibold text-lg">Unable to Load Order</p>
        <p className="text-gray-400 text-sm mt-1">{message}</p>
      </div>
      <button onClick={onBack} className="btn-primary">
        <ArrowLeft className="w-4 h-4" />
        Back to Menu
      </button>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function OrderStatus() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()

  // Get order ID from URL param or localStorage
  const orderIdParam = searchParams.get('order')
  const tableParam   = searchParams.get('table')
  const storedOrderId = localStorage.getItem('qrdine-order-id')
  const storedTable   = localStorage.getItem('qrdine-table')

  const orderId  = orderIdParam || storedOrderId
  const tableNum = tableParam   || storedTable

  const [order,   setOrder]   = useState(null)
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  // ── Fetch order + items ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId) {
      setError('No order ID found. Please place an order first.')
      setLoading(false)
      return
    }

    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    setLoading(true)
    setError('')

    try {
      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError
      if (!orderData) throw new Error('Order not found')

      setOrder(orderData)

      // Fetch order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at')

      if (itemsError) throw itemsError

      setItems(itemsData || [])
    } catch (err) {
      setError(err.message || 'Failed to load order details.')
    } finally {
      setLoading(false)
    }
  }

  // ── Subscribe to order status changes ───────────────────────────────────────
  useEffect(() => {
    if (!orderId) return

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log('✨ Order updated via Realtime:', payload.new)
          setOrder(payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const currentIndex = STEPS.findIndex(s => s.key === order?.status)

  const handleBack = () =>
    navigate(tableNum ? `/?table=${tableNum}` : '/')

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 bg-grid transition-colors duration-300">
      <Navbar />

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
            <h1 className="text-white text-xl font-bold">Order Status</h1>
            <p className="text-gray-400 text-xs mt-0.5">
              {order ? `Table ${order.table_number}` : 'Tracking your order'}
            </p>
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onBack={handleBack} />
        ) : !order ? (
          <ErrorState message="Order not found." onBack={handleBack} />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* ── Left column: Status timeline ── */}
            <div className="flex-1 w-full">
              <div className="glass-card p-6">
                <div className="mb-6">
                  <h2 className="text-white font-bold text-lg">
                    Order Progress
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Updates in real-time — no refresh needed
                  </p>
                </div>

                <div className="flex flex-col">
                  {STEPS.map((step, idx) => (
                    <StatusStep
                      key={step.key}
                      step={step}
                      isActive={idx === currentIndex}
                      isCompleted={idx < currentIndex}
                    />
                  ))}
                </div>
              </div>

              {/* Live indicator */}
              <div className="flex items-center gap-2 justify-center mt-4
                              text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live updates active
              </div>
            </div>

            {/* ── Right column: Order summary + items ── */}
            <div className="w-full lg:w-80 flex flex-col gap-4">
              <OrderSummaryCard order={order} tableNum={tableNum} />
              <OrderItemsList items={items} />

              {/* CTA based on status */}
              {order.status === 'served' ? (
                <div className="glass-card p-5 text-center flex flex-col items-center gap-3">
                  <PartyPopper className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-white font-semibold text-sm">
                      Enjoy your meal!
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Need anything else? Just ask a staff member.
                    </p>
                  </div>
                  <button onClick={handleBack} className="btn-ghost w-full justify-center mt-1">
                    Back to Menu
                  </button>
                </div>
              ) : order.status === 'ready' ? (
                <div className="glass-card p-5 text-center flex flex-col items-center gap-3
                                bg-purple-500/5 border-purple-500/20 animate-pulse-slow">
                  <Utensils className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="text-white font-semibold text-sm">
                      Your order is ready!
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      A staff member will bring it to your table shortly.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="glass-card p-5 text-center flex flex-col items-center gap-3">
                  <Clock className="w-6 h-6 text-gray-500" />
                  <div>
                    <p className="text-gray-400 text-xs">
                      Estimated wait time
                    </p>
                    <p className="text-white font-bold text-lg mt-1">
                      {order.status === 'pending' ? '5–10 min' : '3–5 min'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}