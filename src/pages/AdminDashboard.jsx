import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Sidebar from '../components/Sidebar'
import {
  TrendingUp, DollarSign, ShoppingBag, Users,
  Clock, Package, Flame, UtensilsCrossed, CheckCircle2,
  ArrowRight, Calendar, Loader2, Activity, ChefHat
} from 'lucide-react'

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({ label, value, icon: Icon, color, sublabel, trend }) {
  const colorMap = {
    purple: { 
      bg: 'bg-purple-500/10', 
      text: 'text-purple-400', 
      border: 'border-purple-500/20',
      iconBg: 'bg-purple-700'
    },
    amber: { 
      bg: 'bg-amber-500/10', 
      text: 'text-amber-400', 
      border: 'border-amber-500/20',
      iconBg: 'bg-amber-600'
    },
    green: { 
      bg: 'bg-green-500/10', 
      text: 'text-green-400', 
      border: 'border-green-500/20',
      iconBg: 'bg-green-600'
    },
    blue: { 
      bg: 'bg-blue-500/10', 
      text: 'text-blue-400', 
      border: 'border-blue-500/20',
      iconBg: 'bg-blue-600'
    },
  }
  const c = colorMap[color]

  return (
    <div className={`glass-card p-6 flex items-start gap-4 border ${c.border}
                     hover:border-opacity-50 transition-all duration-300 group`}>
      <div className={`w-14 h-14 rounded-2xl ${c.iconBg} flex items-center justify-center 
                       shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-3xl font-bold ${c.text}`}>{value}</p>
        {sublabel && (
          <p className="text-gray-500 text-xs mt-1">{sublabel}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <p className="text-green-400 text-xs font-medium">{trend}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const config = {
    pending:   { label: 'Pending',   color: 'bg-gray-500/10 text-gray-400 border-gray-500/20',   icon: Package },
    preparing: { label: 'Preparing', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Flame },
    ready:     { label: 'Ready',     color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: UtensilsCrossed },
    served:    { label: 'Served',    color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: CheckCircle2 },
  }
  const cfg = config[status] || config.pending
  const Icon = cfg.icon

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs 
                      font-semibold border ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

// ── Recent Order Row ──────────────────────────────────────────────────────────
function RecentOrderRow({ order }) {
  const navigate = useNavigate()
  const createdAt = new Date(order.created_at)
  const timeAgo = getTimeAgo(createdAt)

  return (
    <tr className="border-b border-white/5 hover:bg-white/3 transition-colors group cursor-pointer"
        onClick={() => navigate('/admin/orders')}>
      <td className="px-4 py-3.5">
        <p className="text-white text-sm font-mono">#{order.id.slice(0, 8)}</p>
        <p className="text-gray-600 text-xs flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3" />
          {timeAgo}
        </p>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-700 flex items-center
                          justify-center text-white text-xs font-bold">
            {order.table_number}
          </div>
          <span className="text-white text-sm">Table {order.table_number}</span>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <StatusBadge status={order.status} />
      </td>
      <td className="px-4 py-3.5 text-right">
        <span className="text-amber-400 font-bold text-sm">
          ${Number(order.total_amount).toFixed(2)}
        </span>
      </td>
      <td className="px-4 py-3.5 text-right">
        <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400
                               group-hover:translate-x-1 transition-all duration-200" />
      </td>
    </tr>
  )
}

// ── Activity Item ─────────────────────────────────────────────────────────────
function ActivityItem({ order }) {
  const createdAt = new Date(order.created_at)
  const timeStr = createdAt.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  const statusConfig = {
    pending:   { color: 'text-gray-400',   icon: Package },
    preparing: { color: 'text-amber-400',  icon: Flame },
    ready:     { color: 'text-purple-400', icon: UtensilsCrossed },
    served:    { color: 'text-green-400',  icon: CheckCircle2 },
  }

  const cfg = statusConfig[order.status] || statusConfig.pending
  const Icon = cfg.icon

  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center
                       shrink-0 ${cfg.color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm">
          Table {order.table_number} • {statusConfig[order.status]?.color && (
            <span className={statusConfig[order.status].color}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          )}
        </p>
        <p className="text-gray-500 text-xs mt-0.5">{timeStr}</p>
      </div>
      <span className="text-amber-400 text-sm font-semibold shrink-0">
        ${Number(order.total_amount).toFixed(2)}
      </span>
    </div>
  )
}

// ── Time ago helper ───────────────────────────────────────────────────────────
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    activeOrders: 0,
    totalRevenue: 0,
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [recentActivity, setRecentActivity] = useState([])

  // ── Fetch dashboard data ────────────────────────────────────────────────────
  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    setLoading(true)

    try {
      // Fetch all orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (!orders) {
        setLoading(false)
        return
      }

      // Calculate stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todayOrders = orders.filter(o => 
        new Date(o.created_at) >= today
      )

      const activeOrders = orders.filter(o => 
        o.status !== 'served'
      )

      const todayRevenue = todayOrders.reduce((sum, o) => 
        sum + Number(o.total_amount), 0
      )

      const totalRevenue = orders.reduce((sum, o) => 
        sum + Number(o.total_amount), 0
      )

      setStats({
        todayRevenue,
        todayOrders: todayOrders.length,
        activeOrders: activeOrders.length,
        totalRevenue,
      })

      // Recent orders (last 5)
      setRecentOrders(orders.slice(0, 5))

      // Recent activity (last 8)
      setRecentActivity(orders.slice(0, 8))

    } catch (err) {
      console.error('Failed to fetch dashboard:', err)
    }

    setLoading(false)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
            <p className="text-gray-400 text-sm">Loading dashboard…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-gray-950/80 backdrop-blur-lg
                        border-b border-white/5 px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-white text-xl font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                Dashboard
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">
                Welcome back! Here's what's happening today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={fetchDashboard} className="btn-ghost text-sm">
                <Activity className="w-4 h-4" />
                Refresh
              </button>
              <button 
                onClick={() => navigate('/admin/orders')}
                className="btn-primary text-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                View All Orders
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col gap-6">

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Today's Revenue"
              value={`$${stats.todayRevenue.toFixed(2)}`}
              icon={DollarSign}
              color="amber"
              sublabel="Revenue generated today"
            />
            <KPICard
              label="Today's Orders"
              value={stats.todayOrders}
              icon={ShoppingBag}
              color="purple"
              sublabel="Orders placed today"
            />
            <KPICard
              label="Active Orders"
              value={stats.activeOrders}
              icon={Clock}
              color="blue"
              sublabel="Currently in progress"
            />
            <KPICard
              label="Total Revenue"
              value={`$${stats.totalRevenue.toFixed(0)}`}
              icon={TrendingUp}
              color="green"
              sublabel="All time revenue"
            />
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Recent Orders Table */}
            <div className="lg:col-span-2 glass-card overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-purple-400" />
                    Recent Orders
                  </h2>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Latest {recentOrders.length} orders
                  </p>
                </div>
                <button
                  onClick={() => navigate('/admin/orders')}
                  className="text-purple-400 hover:text-purple-300 text-xs font-medium
                             flex items-center gap-1 transition-colors"
                >
                  View All
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {recentOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-white/5 bg-white/3">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold
                                       text-gray-400 uppercase tracking-wider">
                          Order
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold
                                       text-gray-400 uppercase tracking-wider">
                          Table
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold
                                       text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold
                                       text-gray-400 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map(order => (
                        <RecentOrderRow key={order.id} order={order} />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <ShoppingBag className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No orders yet</p>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="glass-card flex flex-col">
              <div className="p-5 border-b border-white/5">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  Recent Activity
                </h2>
                <p className="text-gray-500 text-xs mt-0.5">
                  Latest order updates
                </p>
              </div>
              <div className="p-5 flex-1 overflow-y-auto max-h-96">
                {recentActivity.length > 0 ? (
                  <div className="flex flex-col">
                    {recentActivity.map(order => (
                      <ActivityItem key={order.id} order={order} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Activity className="w-12 h-12 text-gray-700 mb-3" />
                    <p className="text-gray-500 text-sm">No activity yet</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/admin/menu')}
              className="glass-card p-5 flex items-center gap-4 hover:border-purple-500/30
                         transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-700/20 border border-purple-500/30
                              flex items-center justify-center group-hover:bg-purple-700/30
                              transition-colors">
                <UtensilsCrossed className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-semibold text-sm">Manage Menu</p>
                <p className="text-gray-500 text-xs mt-0.5">Add or edit items</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400
                                     group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => navigate('/admin/orders')}
              className="glass-card p-5 flex items-center gap-4 hover:border-amber-500/30
                         transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-600/20 border border-amber-500/30
                              flex items-center justify-center group-hover:bg-amber-600/30
                              transition-colors">
                <ShoppingBag className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-semibold text-sm">View Orders</p>
                <p className="text-gray-500 text-xs mt-0.5">Track all orders</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-amber-400
                                     group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => navigate('/admin/analytics')}
              className="glass-card p-5 flex items-center gap-4 hover:border-green-500/30
                         transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-green-600/20 border border-green-500/30
                              flex items-center justify-center group-hover:bg-green-600/30
                              transition-colors">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-semibold text-sm">Analytics</p>
                <p className="text-gray-500 text-xs mt-0.5">View insights</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-green-400
                                     group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => navigate('/admin/qr')}
              className="glass-card p-5 flex items-center gap-4 hover:border-blue-500/30
                         transition-all duration-300 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30
                              flex items-center justify-center group-hover:bg-blue-600/30
                              transition-colors">
                <ChefHat className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-semibold text-sm">QR Codes</p>
                <p className="text-gray-500 text-xs mt-0.5">Generate codes</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400
                                     group-hover:translate-x-1 transition-all" />
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}