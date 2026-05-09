import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  ChefHat, Clock, Package, Flame, CheckCircle2, UtensilsCrossed,
  Bell, Timer, TrendingUp, ArrowRight, RefreshCw, Loader2
} from 'lucide-react'

// ── Status configuration ──────────────────────────────────────────────────────
const STATUSES = [
  { key: 'pending', label: 'Pending', icon: Package, color: 'gray' },
  { key: 'preparing', label: 'Preparing', icon: Flame, color: 'amber' },
  { key: 'ready', label: 'Ready', icon: UtensilsCrossed, color: 'purple' },
  { key: 'served', label: 'Served', icon: CheckCircle2, color: 'green' },
]

const COLOR_MAP = {
  gray: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30', button: 'bg-gray-600 hover:bg-gray-500' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', button: 'bg-amber-600 hover:bg-amber-500' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', button: 'bg-purple-600 hover:bg-purple-500' },
  green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', button: 'bg-green-600 hover:bg-green-500' },
}

// ── Time elapsed formatter ────────────────────────────────────────────────────
function useElapsedTime(createdAt) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const updateElapsed = () => {
      const ms = Date.now() - new Date(createdAt).getTime()
      setElapsed(Math.floor(ms / 1000))
    }
    updateElapsed()
    const timer = setInterval(updateElapsed, 1000)
    return () => clearInterval(timer)
  }, [createdAt])

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// ── Order card ────────────────────────────────────────────────────────────────
function OrderCard({ order, items, onUpdateStatus }) {
  const elapsed = useElapsedTime(order.created_at)
  const statusIndex = STATUSES.findIndex(s => s.key === order.status)
  const statusObj = STATUSES[statusIndex]
  const colors = COLOR_MAP[statusObj.color]
  const Icon = statusObj.icon

  const nextStatus = STATUSES[statusIndex + 1]?.key
  const canAdvance = statusIndex < STATUSES.length - 1

  // Elapsed time in minutes
  const elapsedMins = Math.floor(
    (Date.now() - new Date(order.created_at).getTime()) / 60000
  )

  // Alert color based on time
  const timeColor = elapsedMins > 15
    ? 'text-red-400 animate-pulse'
    : elapsedMins > 10
      ? 'text-amber-400'
      : 'text-gray-400'

  return (
    <div className={`
      glass-card p-5 flex flex-col gap-4 transition-all duration-300
      hover:border-white/15 hover:shadow-xl
      ${statusIndex === STATUSES.length - 1 ? 'opacity-60' : ''}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Table number */}
          <div className="w-12 h-12 rounded-xl bg-purple-700 flex items-center
                          justify-center shrink-0 shadow-lg shadow-purple-900/40">
            <span className="text-white font-bold text-lg">
              {order.table_number}
            </span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              Table {order.table_number}
            </p>
            <p className="text-gray-500 text-xs">
              {items.reduce((s, i) => s + i.quantity, 0)} item(s)
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                         border ${colors.bg} ${colors.border}`}>
          <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
          <span className={`text-xs font-semibold ${colors.text}`}>
            {statusObj.label}
          </span>
        </div>
      </div>

      {/* Timer */}
      <div className="flex items-center gap-2">
        <Clock className={`w-4 h-4 ${timeColor}`} />
        <span className={`text-sm font-mono font-semibold ${timeColor}`}>
          {elapsed}
        </span>
        <span className="text-gray-600 text-xs">elapsed</span>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-2 bg-white/3 rounded-xl p-3 border border-white/5">
        {items.map(item => (
          <div key={item.id}
            className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">{item.quantity}×</span>
              <span className="text-white">{item.name}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Special note */}
      {order.note && (
        <div className="flex items-start gap-2 text-xs bg-amber-500/10
                        border border-amber-500/20 rounded-lg px-3 py-2">
          <Bell className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-amber-200 leading-relaxed">{order.note}</p>
        </div>
      )}

      {/* Action button */}
      {canAdvance && (
        <button
          onClick={() => onUpdateStatus(order.id, nextStatus)}
          className={`
            flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
            text-white text-sm font-semibold transition-all duration-200
            shadow-md hover:shadow-lg active:scale-95
            ${colors.button}
          `}
        >
          {nextStatus === 'preparing' && 'Start Preparing'}
          {nextStatus === 'ready' && 'Mark as Ready'}
          {nextStatus === 'served' && 'Mark as Served'}
          <ArrowRight className="w-4 h-4" />
        </button>
      )}

      {/* Order ID (tiny, bottom) */}
      <p className="text-gray-700 text-[10px] font-mono text-center">
        #{order.id.slice(0, 8)}
      </p>
    </div>
  )
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatsBar({ stats }) {
  const items = [
    { label: 'Active', value: stats.active, icon: TrendingUp, color: 'purple' },
    { label: 'Pending', value: stats.pending, icon: Package, color: 'gray' },
    { label: 'Preparing', value: stats.preparing, icon: Flame, color: 'amber' },
    { label: 'Ready', value: stats.ready, icon: UtensilsCrossed, color: 'purple' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map(({ label, value, icon: Icon, color }) => {
        const c = COLOR_MAP[color]
        return (
          <div key={label}
            className={`glass-card p-4 flex items-center gap-3 border ${c.border}`}>
            <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center
                             justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${c.text}`} />
            </div>
            <div>
              <p className="text-gray-400 text-xs">{label}</p>
              <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-5 text-center">
      <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10
                      flex items-center justify-center">
        <ChefHat className="w-10 h-10 text-gray-600" />
      </div>
      <div>
        <p className="text-white text-lg font-semibold">No Active Orders</p>
        <p className="text-gray-500 text-sm mt-1">
          New orders will appear here in real-time.
        </p>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════
export default function ChefDashboard() {
  const [orders, setOrders] = useState([])
  const [orderItems, setOrderItems] = useState({}) // { orderId: [items] }
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)

  const audioRef = useRef(null)
  const orderIdsRef = useRef(new Set())

  // ── Initial fetch ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)

    // Fetch all orders that aren't served yet
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .neq('status', 'served')
      .order('created_at', { ascending: true })

    if (ordersError) {
      console.error('Failed to fetch orders:', ordersError)
      setLoading(false)
      return
    }

    setOrders(ordersData || [])

    // Track current order IDs
    orderIdsRef.current = new Set((ordersData || []).map(o => o.id))

    // Fetch all order items for these orders
    if (ordersData && ordersData.length > 0) {
      const orderIds = ordersData.map(o => o.id)
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds)

      // Group by order_id
      const grouped = {}
        ; (itemsData || []).forEach(item => {
          if (!grouped[item.order_id]) grouped[item.order_id] = []
          grouped[item.order_id].push(item)
        })
      setOrderItems(grouped)
    }

    setLoading(false)
  }

  // ── Realtime subscription ───────────────────────────────────────────────────
  useEffect(() => {
    // Subscribe to new orders
    const ordersChannel = supabase
      .channel('chef-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          const newOrder = payload.new
          console.log('🔔 New order received:', newOrder)

          // Add to orders list
          setOrders(prev => [newOrder, ...prev])
          orderIdsRef.current.add(newOrder.id)

          // Fetch its items
          const { data: itemsData } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', newOrder.id)

          setOrderItems(prev => ({
            ...prev,
            [newOrder.id]: itemsData || [],
          }))

          // Play sound
          if (soundEnabled && audioRef.current) {
            audioRef.current.play().catch(err => console.log('Sound blocked:', err))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const updated = payload.new
          console.log('♻️ Order updated:', updated)

          // If order is now served, remove it from the board
          if (updated.status === 'served') {
            setOrders(prev => prev.filter(o => o.id !== updated.id))
            orderIdsRef.current.delete(updated.id)
          } else {
            // Update in place
            setOrders(prev =>
              prev.map(o => (o.id === updated.id ? updated : o))
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ordersChannel)
    }
  }, [soundEnabled])

  // ── Update order status ─────────────────────────────────────────────────────
  const updateStatus = async (orderId, newStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (error) {
      console.error('Failed to update status:', error)
    }
  }

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = {
    active: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
  }

  // ── Group orders by status for column view ──────────────────────────────────
  const pending = orders.filter(o => o.status === 'pending')
  const preparing = orders.filter(o => o.status === 'preparing')
  const ready = orders.filter(o => o.status === 'ready')

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 bg-grid">
      {/* Hidden audio element for notification sound */}


      {/* OPTION 1: Use a hosted sound file (recommended — clearest audio) */}
      <audio ref={audioRef} preload="auto">
        <source
          src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
          type="audio/mpeg"
        />
        {/* Fallback — browser notification beep */}
        <source
          src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OmhRA8OUqXh8LRgGgU7k9jwzX4yBSh+zPDckUMKEl+16+mnUxIGRJng8L5qHwcsd8rx3I9ACRRftuvqp1QSBkWY4PC+ah8HLHfK8dyPQAkUX7br6qdUEgZFmODwvmofByx3yvHcj0AJE1+26+qnVBIGRZjg8L5qHwcsd8rx3I9ACRNftuvqp1QSBkWY4PC+ah8HLHfK8dyPQAkUX7br6qdUEgZFmODwvmofByx3yvHcj0AJFF+26+qnVBIGRZjg8L5qHwcsd8rx3I9ACRRftuvqp1QSBkWY4PC+ah8HLHfK8dyPQAkUX7br6qdUEgZFmODwvmofByx3yvHcj0AJFF+26+qnVBIGRZjg8L5qHwcsd8rx3I9ACRRftuvqp1QSBkWY4PC+ah8HLHfK8dyPQAkUX7br6qdUEgZFmODwvmofByx3yvHcj0AJFF+26+qnVBIGRZjg8L5qHwcsd8rx3I9ACRRftuvqp1QSBkWY4PC+ah8HLHfK8dyPQAkUX7br6qdUEgZFmODwvmofByx3yvHcj0AJFF+26+qnVBIGRZjg8L5qHwcsd8rx3I9ACRRftuvqp1QSBkWY4PC+ah8HLHfK8dyPQAkTX7br6qdUEgZFmODwvmofByx3yvHcj0AJFF+26+qnVBIGRZjg8L5qHwcsd8rx3I9ACRRftuvqp1QSBkWY4PC+ah8HLHfK8dyPQAkUX7br6qdUEgZFmODwvmofByx3yvHcj0AJFF+26+qnVBIGRZjg8L5qHwcsd8rx3I9ACRNftuvqp1QSBkWY4PC+ah8HLHfK8dyPQAkUX7br6qdUEgZFmODwvmofByx3yvHcj0AJFF+26+qnVBIGRZjg8L5qHwcsd8rx3I9ACRRftuvqp1QSBkWY4PC+ah8HLHfK8dyPQAkTX7br6qdUEgZFmODwvmofByx3yvHcj0AJFF+26+qnVBIGRZjg8L5qHwcsd8rx3I9ACRRftuvqp1QSBkWY4PC+ah8HLHfK8dyPQAkUX7br6qdUEgZFmODwvmofByx3yvHcj0AJFF+26+qnVBIGRZjg8L5qHwcsd8rx3I9ACRNftuvqp1QSBkWY4PC+ah8HLHfK8dyPQAkUX7br6qdUEgZFmODwvmofByx3yvHcj0AJFF+26+qnVBIGRZjg8L5qHwcsd8rx3I9ACRRftuvqp1QSBkWY4PC+ah8HLHfK8dyPQAkUX7br6qdUEgZFmODwvmofByx3yvHcj0AJFF+26+qnVBIGRZjg8L5qHwcsd8rx3I9ACRNftuvqp1QSBkWY4PC+ah8HLHfK8dyPQAkUX7br6qdUEgZFmODwvmofByx3yvHcj0AJFF+26+qnVBIGRZjg8L5qHwcsd8rx3I9ACRRftuvqp1QSBkWY4PC+ah8HLHfK8dyPQAkUX7br6qdUEgZFmODwvmofByx3yvHcj0AJFF+26+qnVBIGRZjg8L5qHw=="
          type="audio/wav"
        />
      </audio>

      {/* ══════════════════════════════════════════════════════════════════
          OPTION 2: Use your own sound file from /public folder
          ═══════════════════════════════════════════════════════════════════
          
          1. Download a free notification sound from:
            - https://mixkit.co/free-sound-effects/notification/
            - https://notificationsounds.com/
            - https://freesound.org/
          
          2. Place the .mp3 or .wav file in: /public/sounds/notification.mp3
          
          3. Use this code:
          
          <audio ref={audioRef} preload="auto">
            <source src="/sounds/notification.mp3" type="audio/mpeg" />
          </audio>
          
        */}


      {/* Top header */}
      <div className="sticky top-0 z-20 bg-gray-950/90 backdrop-blur-lg
                      border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-700 flex items-center
                            justify-center shadow-lg shadow-purple-900/40">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">Chef Dashboard</h1>
              <p className="text-gray-400 text-xs">
                {stats.active} active order{stats.active !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(v => !v)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-xl text-sm
                font-medium transition-all duration-200 border
                ${soundEnabled
                  ? 'bg-purple-700/20 text-purple-400 border-purple-500/30'
                  : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10'}
              `}
            >
              <Bell className={`w-4 h-4 ${soundEnabled ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">
                {soundEnabled ? 'Sound On' : 'Sound Off'}
              </span>
            </button>

            {/* Refresh */}
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="btn-ghost"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-6">

        {/* Stats */}
        <StatsBar stats={stats} />

        {/* Orders grid */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState />
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Timer className="w-4 h-4 text-purple-400" />
              <h2 className="text-white font-semibold text-sm">
                Active Orders
              </h2>
              <span className="ml-auto text-xs bg-white/5 text-gray-500
                               border border-white/5 px-2 py-0.5 rounded-full">
                Sorted by oldest first
              </span>
            </div>

            {/* Three-column layout: Pending | Preparing | Ready */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Column 1: Pending */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    Pending ({pending.length})
                  </span>
                </div>
                {pending.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    items={orderItems[order.id] || []}
                    onUpdateStatus={updateStatus}
                  />
                ))}
              </div>

              {/* Column 2: Preparing */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">
                    Preparing ({preparing.length})
                  </span>
                </div>
                {preparing.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    items={orderItems[order.id] || []}
                    onUpdateStatus={updateStatus}
                  />
                ))}
              </div>

              {/* Column 3: Ready */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-2">
                  <UtensilsCrossed className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-400 text-xs font-semibold uppercase tracking-wider">
                    Ready ({ready.length})
                  </span>
                </div>
                {ready.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    items={orderItems[order.id] || []}
                    onUpdateStatus={updateStatus}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Live indicator */}
        <div className="flex items-center gap-2 justify-center text-xs text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Real-time updates active
        </div>
      </div>
    </div>
  )
}