import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import Sidebar from '../components/Sidebar'
import {
  TrendingUp, DollarSign, ShoppingBag, Award,
  Calendar, Loader2, BarChart3, PieChart as PieChartIcon
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({ label, value, icon: Icon, color, trend }) {
  const colorMap = {
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    amber:  { bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/20'  },
    green:  { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/20'  },
    blue:   { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20'   },
  }
  const c = colorMap[color]

  return (
    <div className={`glass-card p-5 flex items-center gap-4 border ${c.border}`}>
      <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-6 h-6 ${c.text}`} />
      </div>
      <div className="flex-1">
        <p className="text-gray-400 text-xs uppercase tracking-wider">{label}</p>
        <p className={`text-2xl font-bold ${c.text} mt-1`}>{value}</p>
        {trend && (
          <p className="text-gray-600 text-xs mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Top Item Row ──────────────────────────────────────────────────────────────
function TopItemRow({ item, rank }) {
  const medals = ['🥇', '🥈', '🥉']
  return (
    <tr className="border-b border-white/5 hover:bg-white/3 transition-colors">
      <td className="px-4 py-3">
        <span className="text-2xl">{medals[rank - 1] || `#${rank}`}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {item.image_url && (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-10 h-10 rounded-lg object-cover"
            />
          )}
          <div>
            <p className="text-white text-sm font-medium">{item.name}</p>
            <p className="text-gray-500 text-xs">{item.category_name}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-purple-400 font-bold text-sm">{item.order_count}</span>
        <p className="text-gray-600 text-xs">orders</p>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-amber-400 font-bold text-sm">
          ${(item.total_revenue || 0).toFixed(2)}
        </span>
        <p className="text-gray-600 text-xs">revenue</p>
      </td>
    </tr>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    mostOrderedItem: 'N/A',
  })
  const [dailySales, setDailySales] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [topItems, setTopItems] = useState([])

  // ── Fetch analytics data ────────────────────────────────────────────────────
  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)

    try {
      // Fetch all orders with items
      const { data: orders } = await supabase
        .from('orders')
        .select('id, total_amount, created_at, status')
        .order('created_at', { ascending: false })

      const { data: orderItems } = await supabase
        .from('order_items')
        .select('*, menu_items(name, image_url, category_id, categories(name))')

      // ── KPIs ──
      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0
      const totalOrders = orders?.length || 0
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Most ordered item
      const itemCounts = {}
      orderItems?.forEach(item => {
        const name = item.menu_items?.name || 'Unknown'
        itemCounts[name] = (itemCounts[name] || 0) + item.quantity
      })
      const mostOrdered = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0]

      setKpis({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        mostOrderedItem: mostOrdered ? mostOrdered[0] : 'N/A',
      })

      // ── Daily sales (last 7 days) ──
      const today = new Date()
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today)
        date.setDate(date.getDate() - (6 - i))
        return date.toISOString().split('T')[0]
      })

      const salesByDay = {}
      last7Days.forEach(day => { salesByDay[day] = 0 })

      orders?.forEach(order => {
        const day = order.created_at.split('T')[0]
        if (salesByDay[day] !== undefined) {
          salesByDay[day] += Number(order.total_amount)
        }
      })

      const dailySalesData = last7Days.map(day => ({
        date: day,
        label: new Date(day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        revenue: salesByDay[day],
      }))

      setDailySales(dailySalesData)

      // ── Orders by category ──
      const categoryCounts = {}
      orderItems?.forEach(item => {
        const categoryName = item.menu_items?.categories?.name || 'Uncategorized'
        if (!categoryCounts[categoryName]) {
          categoryCounts[categoryName] = 0
        }
        categoryCounts[categoryName] += item.quantity
      })

      const categoryArray = Object.entries(categoryCounts).map(([name, count]) => ({
        name,
        count,
      }))

      setCategoryData(categoryArray)

      // ── Top 5 items ──
      const itemStats = {}
      orderItems?.forEach(item => {
        const itemId = item.menu_item_id
        const itemName = item.menu_items?.name || 'Unknown'
        const categoryName = item.menu_items?.categories?.name || 'Unknown'
        const imageUrl = item.menu_items?.image_url

        if (!itemStats[itemId]) {
          itemStats[itemId] = {
            id: itemId,
            name: itemName,
            category_name: categoryName,
            image_url: imageUrl,
            order_count: 0,
            total_revenue: 0,
          }
        }

        itemStats[itemId].order_count += item.quantity
        itemStats[itemId].total_revenue += item.price * item.quantity
      })

      const topItemsArray = Object.values(itemStats)
        .sort((a, b) => b.order_count - a.order_count)
        .slice(0, 5)

      setTopItems(topItemsArray)

    } catch (err) {
      console.error('Failed to fetch analytics:', err)
    }

    setLoading(false)
  }

  // ── Chart.js data ───────────────────────────────────────────────────────────
  const barChartData = {
    labels: dailySales.map(d => d.label),
    datasets: [
      {
        label: 'Daily Revenue',
        data: dailySales.map(d => d.revenue),
        backgroundColor: 'rgba(109, 40, 217, 0.6)',
        borderColor: 'rgba(109, 40, 217, 1)',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  }

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#fff',
        bodyColor: '#d1d5db',
        borderColor: 'rgba(109, 40, 217, 0.3)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => `Revenue: $${context.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#9ca3af',
          font: { size: 11 },
          callback: (value) => `$${value}`,
        },
      },
    },
  }

  const pieChartData = {
    labels: categoryData.map(c => c.name),
    datasets: [
      {
        data: categoryData.map(c => c.count),
        backgroundColor: [
          'rgba(109, 40, 217, 0.8)',   // Purple
          'rgba(245, 158, 11, 0.8)',   // Amber
          'rgba(34, 197, 94, 0.8)',    // Green
          'rgba(59, 130, 246, 0.8)',   // Blue
          'rgba(239, 68, 68, 0.8)',    // Red
          'rgba(168, 85, 247, 0.8)',   // Violet
          'rgba(251, 146, 60, 0.8)',   // Orange
        ],
        borderColor: 'rgba(17, 24, 39, 1)',
        borderWidth: 2,
      },
    ],
  }

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#d1d5db',
          padding: 15,
          font: { size: 12 },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#fff',
        bodyColor: '#d1d5db',
        borderColor: 'rgba(109, 40, 217, 0.3)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed} orders`,
        },
      },
    },
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-950 transition-colors duration-300">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
            <p className="text-gray-400 text-sm">Loading analytics…</p>
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
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Analytics Dashboard
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">
                Business insights and performance metrics
              </p>
            </div>
            <button onClick={fetchAnalytics} className="btn-ghost">
              <Calendar className="w-4 h-4" />
              Refresh Data
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col gap-6">

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Total Revenue"
              value={`$${kpis.totalRevenue.toFixed(2)}`}
              icon={DollarSign}
              color="amber"
              trend="All time"
            />
            <KPICard
              label="Total Orders"
              value={kpis.totalOrders}
              icon={ShoppingBag}
              color="purple"
              trend="All time"
            />
            <KPICard
              label="Avg Order Value"
              value={`$${kpis.avgOrderValue.toFixed(2)}`}
              icon={TrendingUp}
              color="green"
              trend="Per order"
            />
            <KPICard
              label="Most Ordered"
              value={kpis.mostOrderedItem}
              icon={Award}
              color="blue"
              trend="Top item"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="glass-card p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <h2 className="text-white font-semibold">Daily Revenue (Last 7 Days)</h2>
              </div>
              <div className="flex-1 min-h-[300px]">
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </div>

            {/* Pie Chart */}
            <div className="glass-card p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon className="w-5 h-5 text-purple-400" />
                <h2 className="text-white font-semibold">Orders by Category</h2>
              </div>
              <div className="flex-1 min-h-[300px] flex items-center justify-center">
                {categoryData.length > 0 ? (
                  <Pie data={pieChartData} options={pieChartOptions} />
                ) : (
                  <p className="text-gray-500 text-sm">No category data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Top Items Table */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" />
                <h2 className="text-white font-semibold">Top 5 Menu Items</h2>
              </div>
              <p className="text-gray-500 text-xs mt-1">Best selling items by order count</p>
            </div>
            {topItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/5 bg-white/3">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold
                                     text-gray-400 uppercase tracking-wider w-16">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold
                                     text-gray-400 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold
                                     text-gray-400 uppercase tracking-wider">
                        Orders
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold
                                     text-gray-400 uppercase tracking-wider">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topItems.map((item, index) => (
                      <TopItemRow key={item.id} item={item} rank={index + 1} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-gray-500">No order data yet</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}