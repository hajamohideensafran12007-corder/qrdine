import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import Sidebar from '../components/Sidebar'
import {
  ShoppingBag, Search, Download, CheckCircle2,
  XCircle, Clock, Package, Flame, UtensilsCrossed,
  Eye, Loader2, FileText, ChevronDown, TrendingUp,
  X, Bell, Calendar, DollarSign
} from 'lucide-react'
import jsPDF from 'jspdf'

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'gray',   icon: Package        },
  preparing: { label: 'Preparing', color: 'amber',  icon: Flame          },
  ready:     { label: 'Ready',     color: 'purple', icon: UtensilsCrossed},
  served:    { label: 'Served',    color: 'green',  icon: CheckCircle2   },
}

const PAYMENT_CONFIG = {
  paid:   { label: 'Paid',   color: 'green', icon: CheckCircle2 },
  unpaid: { label: 'Unpaid', color: 'red',   icon: XCircle      },
}

const COLOR_MAP = {
  gray:   { bg: 'bg-gray-500/10',   text: 'text-gray-400',   border: 'border-gray-500/20'   },
  amber:  { bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/20'  },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  green:  { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/20'  },
  red:    { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/20'    },
}

// ── Badge component ───────────────────────────────────────────────────────────
function Badge({ config, value }) {
  const cfg = config[value]
  if (!cfg) return null
  const colors = COLOR_MAP[cfg.color]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg
                      text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

// ── Order row ─────────────────────────────────────────────────────────────────
function OrderRow({ order, payment, onViewDetails, onTogglePayment, updatingPayment }) {
  const createdAt = new Date(order.created_at)
  const timeStr = createdAt.toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
  })

  return (
    <tr className="border-b border-white/5 hover:bg-white/3 transition-colors group">
      {/* Order ID + Time */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-600 shrink-0" />
          <div>
            <p className="text-white text-sm font-mono">#{order.id.slice(0, 8)}</p>
            <p className="text-gray-600 text-xs flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {timeStr}
            </p>
          </div>
        </div>
      </td>

      {/* Table */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-700 flex items-center
                          justify-center text-white text-xs font-bold shadow-md">
            {order.table_number}
          </div>
          <span className="text-white text-sm font-medium">Table {order.table_number}</span>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3.5">
        <Badge config={STATUS_CONFIG} value={order.status} />
      </td>

      {/* Payment — Clickable toggle */}
      <td className="px-4 py-3.5">
        <button
          onClick={() => onTogglePayment(order.id, payment?.status)}
          disabled={updatingPayment === order.id}
          className="transition-transform hover:scale-105 active:scale-95"
          title="Click to toggle payment status"
        >
          {updatingPayment === order.id ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg
                             text-xs font-semibold bg-white/5 text-gray-500 border border-white/5">
              <Loader2 className="w-3 h-3 animate-spin" />
              Updating…
            </span>
          ) : (
            <Badge config={PAYMENT_CONFIG} value={payment?.status || 'unpaid'} />
          )}
        </button>
      </td>

      {/* Total */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-amber-500" />
          <span className="text-amber-400 font-bold text-sm">
            ${Number(order.total_amount).toFixed(2)}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5">
        <button
          onClick={() => onViewDetails(order)}
          className="btn-ghost text-xs py-1.5 opacity-0 group-hover:opacity-100
                     transition-opacity"
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </button>
      </td>
    </tr>
  )
}

// ── Order details modal ───────────────────────────────────────────────────────
function OrderDetailsModal({ order, items, payment, onClose, onDownloadBill }) {
  const createdAt = new Date(order.created_at)
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4
                    bg-black/60 backdrop-blur-sm animate-fade-in"
         onClick={onClose}>
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto
                      animate-slide-up"
           onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-white font-semibold text-lg">Order Details</h2>
            <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-2">
              <FileText className="w-3 h-3" />
              #{order.id.slice(0, 8)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center
                       justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-3 border border-white/5">
              <p className="text-gray-500 text-xs mb-1.5 flex items-center gap-1">
                <UtensilsCrossed className="w-3 h-3" />
                Table Number
              </p>
              <p className="text-white font-semibold text-lg">Table {order.table_number}</p>
            </div>
            <div className="glass-card p-3 border border-white/5">
              <p className="text-gray-500 text-xs mb-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Order Status
              </p>
              <Badge config={STATUS_CONFIG} value={order.status} />
            </div>
            <div className="glass-card p-3 border border-white/5">
              <p className="text-gray-500 text-xs mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Payment
              </p>
              <Badge config={PAYMENT_CONFIG} value={payment?.status || 'unpaid'} />
            </div>
            <div className="glass-card p-3 border border-white/5">
              <p className="text-gray-500 text-xs mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Created
              </p>
              <p className="text-white text-sm">
                {createdAt.toLocaleDateString()}
              </p>
              <p className="text-gray-500 text-xs">
                {createdAt.toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-purple-400" />
              Items Ordered ({items.length})
            </h3>
            <div className="flex flex-col gap-2">
              {items.map(item => (
                <div key={item.id}
                  className="flex items-center justify-between py-2.5 px-3
                             bg-white/3 rounded-lg border border-white/5
                             hover:bg-white/5 transition-colors">
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{item.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      ${Number(item.price).toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-amber-400 font-bold text-sm">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          {order.note && (
            <div>
              <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                Special Instructions
              </h3>
              <p className="text-gray-300 text-sm bg-amber-500/5 rounded-lg px-4 py-3
                            border border-amber-500/10 leading-relaxed">
                {order.note}
              </p>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <span className="text-gray-400 text-sm">Total Amount</span>
            <span className="text-amber-400 font-bold text-2xl">
              ${Number(order.total_amount).toFixed(2)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-ghost flex-1 justify-center">
              Close
            </button>
            <button
              onClick={() => onDownloadBill(order, items)}
              className="btn-primary flex-1 justify-center"
            >
              <Download className="w-4 h-4" />
              Download Bill PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function AdminOrders() {
  const [orders,          setOrders]          = useState([])
  const [payments,        setPayments]        = useState({}) // { orderId: payment }
  const [orderItems,      setOrderItems]      = useState({}) // { orderId: [items] }
  const [loading,         setLoading]         = useState(true)
  const [search,          setSearch]          = useState('')
  const [filterStatus,    setFilterStatus]    = useState('all')
  const [filterPayment,   setFilterPayment]   = useState('all')
  const [selectedOrder,   setSelectedOrder]   = useState(null)
  const [updatingPayment, setUpdatingPayment] = useState(null)

  // ── Initial fetch ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)

    // Fetch all orders
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    setOrders(ordersData || [])

    if (ordersData && ordersData.length > 0) {
      const orderIds = ordersData.map(o => o.id)

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .in('order_id', orderIds)

      const paymentsMap = {}
      ;(paymentsData || []).forEach(p => { paymentsMap[p.order_id] = p })
      setPayments(paymentsMap)

      // Fetch order items
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds)

      const itemsMap = {}
      ;(itemsData || []).forEach(item => {
        if (!itemsMap[item.order_id]) itemsMap[item.order_id] = []
        itemsMap[item.order_id].push(item)
      })
      setOrderItems(itemsMap)
    }

    setLoading(false)
  }

  // ── 🔴 REALTIME SUBSCRIPTION ────────────────────────────────────────────────
  useEffect(() => {
    const ordersChannel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'orders',
        },
        async (payload) => {
          const newOrder = payload.new
          console.log('🔔 New order in admin panel:', newOrder)

          setOrders(prev => [newOrder, ...prev])

          const { data: itemsData } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', newOrder.id)

          setOrderItems(prev => ({
            ...prev,
            [newOrder.id]: itemsData || [],
          }))

          const { data: paymentData } = await supabase
            .from('payments')
            .select('*')
            .eq('order_id', newOrder.id)
            .single()

          if (paymentData) {
            setPayments(prev => ({
              ...prev,
              [newOrder.id]: paymentData,
            }))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'orders',
        },
        (payload) => {
          const updated = payload.new
          console.log('♻️ Order updated in admin panel:', updated)

          setOrders(prev =>
            prev.map(o => (o.id === updated.id ? updated : o))
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'payments',
        },
        (payload) => {
          const updated = payload.new
          console.log('💳 Payment updated:', updated)

          setPayments(prev => ({
            ...prev,
            [updated.order_id]: updated,
          }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ordersChannel)
    }
  }, [])

  // ── Toggle payment status ───────────────────────────────────────────────────
  const togglePayment = async (orderId, currentStatus) => {
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid'
    setUpdatingPayment(orderId)

    const { error } = await supabase
      .from('payments')
      .update({
        status:  newStatus,
        paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
      })
      .eq('order_id', orderId)

    if (!error) {
      setPayments(prev => ({
        ...prev,
        [orderId]: { ...prev[orderId], status: newStatus },
      }))
    }

    setUpdatingPayment(null)
  }

  // ── View order details ──────────────────────────────────────────────────────
  const viewDetails = (order) => {
    setSelectedOrder(order)
  }

  // ── Generate bill PDF ───────────────────────────────────────────────────────
  // const downloadBill = (order, items) => {
  //   const doc = new jsPDF()

  //   // ── Header ──
  //   doc.setFontSize(24)
  //   doc.setFont('helvetica', 'bold')
  //   doc.setTextColor(109, 40, 217) // Purple
  //   doc.text('QrDine', 20, 25)

  //   doc.setFontSize(11)
  //   doc.setFont('helvetica', 'normal')
  //   doc.setTextColor(100, 100, 100)
  //   doc.text('Restaurant Billing System', 20, 32)

  //   // ── Order info ──
  //   doc.setFontSize(10)
  //   doc.setTextColor(0, 0, 0)
  //   doc.setFont('helvetica', 'bold')
  //   doc.text('Bill Details', 20, 45)

  //   doc.setFont('helvetica', 'normal')
  //   doc.text(`Order ID:`, 20, 52)
  //   doc.text(`#${order.id.slice(0, 8).toUpperCase()}`, 60, 52)

  //   doc.text(`Table:`, 20, 58)
  //   doc.text(`${order.table_number}`, 60, 58)

  //   doc.text(`Date:`, 20, 64)
  //   doc.text(`${new Date(order.created_at).toLocaleDateString()}`, 60, 64)

  //   doc.text(`Time:`, 20, 70)
  //   doc.text(`${new Date(order.created_at).toLocaleTimeString()}`, 60, 70)

  //   doc.text(`Status:`, 20, 76)
  //   doc.text(`${STATUS_CONFIG[order.status].label}`, 60, 76)

  //   // ── Separator line ──
  //   doc.setLineWidth(0.5)
  //   doc.setDrawColor(200, 200, 200)
  //   doc.line(20, 82, 190, 82)

  //   // ── Items header ──
  //   doc.setFont('helvetica', 'bold')
  //   doc.setFontSize(10)
  //   doc.text('Item', 20, 92)
  //   doc.text('Qty', 120, 92)
  //   doc.text('Price', 145, 92)
  //   doc.text('Total', 170, 92)

  //   doc.setLineWidth(0.3)
  //   doc.line(20, 94, 190, 94)

  //   // ── Items ──
  //   doc.setFont('helvetica', 'normal')
  //   doc.setFontSize(9)
  //   let y = 102
  //   items.forEach((item, index) => {
  //     // Alternate row background
  //     if (index % 2 === 0) {
  //       doc.setFillColor(250, 250, 250)
  //       doc.rect(20, y - 5, 170, 7, 'F')
  //     }

  //     doc.text(item.name.substring(0, 35), 22, y)
  //     doc.text(item.quantity.toString(), 125, y, { align: 'center' })
  //     doc.text(`$${Number(item.price).toFixed(2)}`, 145, y)
  //     doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 175, y, { align: 'right' })
  //     y += 7
  //   })

  //   // ── Special note ──
  //   if (order.note) {
  //     y += 5
  //     doc.setFont('helvetica', 'italic')
  //     doc.setFontSize(8)
  //     doc.setTextColor(150, 100, 0)
  //     doc.text(`Note: ${order.note}`, 20, y, { maxWidth: 170 })
  //     y += 10
  //     doc.setTextColor(0, 0, 0)
  //   }

  //   // ── Total section ──
  //   y += 5
  //   doc.setLineWidth(0.5)
  //   doc.setDrawColor(200, 200, 200)
  //   doc.line(20, y, 190, y)

  //   y += 8
  //   doc.setFont('helvetica', 'bold')
  //   doc.setFontSize(12)
  //   doc.text('TOTAL:', 145, y)
  //   doc.setTextColor(245, 158, 11) // Amber
  //   doc.text(`$${Number(order.total_amount).toFixed(2)}`, 175, y, { align: 'right' })

  //   // ── Payment status ──
  //   y += 10
  //   doc.setFontSize(9)
  //   const paymentStatus = payments[order.id]?.status || 'unpaid'
  //   if (paymentStatus === 'paid') {
  //     doc.setTextColor(34, 197, 94) // Green
  //     doc.text('✓ PAID', 20, y)
  //   } else {
  //     doc.setTextColor(239, 68, 68) // Red
  //     doc.text('⚠ UNPAID', 20, y)
  //   }

  //   // ── Footer ──
  //   doc.setFontSize(9)
  //   doc.setFont('helvetica', 'italic')
  //   doc.setTextColor(150, 150, 150)
  //   doc.text('Thank you for dining with us!', 105, 280, { align: 'center' })
  //   doc.setFontSize(8)
  //   doc.text('QrDine - Powered by QR Technology', 105, 286, { align: 'center' })

  //   // ── Save ──
  //   doc.save(`QrDine-Bill-${order.id.slice(0, 8)}.pdf`)
  // }

  // ── Generate bill PDF ───────────────────────────────────────────────────────
  const downloadBill = (order, items) => {
    const doc = new jsPDF()

    // ═══════════════════════════════════════════════════════════════════════════
    // HEADER SECTION
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Logo text
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(109, 40, 217) // Purple
    doc.text('QrDine', 20, 25)

    // Tagline
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text('QR-Based Food Ordering System', 20, 32)

    // Bill title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('BILL', 170, 25)

    // ═══════════════════════════════════════════════════════════════════════════
    // ORDER INFORMATION SECTION
    // ═══════════════════════════════════════════════════════════════════════════
    
    const createdAt = new Date(order.created_at)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Bill Details', 20, 48)

    // Info table
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    
    const infoY = 56
    const labelX = 20
    const valueX = 65

    doc.setFont('helvetica', 'bold')
    doc.text('Order ID:', labelX, infoY)
    doc.text('Table:', labelX, infoY + 6)
    doc.text('Date:', labelX, infoY + 12)
    doc.text('Time:', labelX, infoY + 18)
    doc.text('Status:', labelX, infoY + 24)

    doc.setFont('helvetica', 'normal')
    doc.text(`#${order.id.slice(0, 8).toUpperCase()}`, valueX, infoY)
    doc.text(`Table ${order.table_number}`, valueX, infoY + 6)
    doc.text(createdAt.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }), valueX, infoY + 12)
    doc.text(createdAt.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    }), valueX, infoY + 18)
    doc.text(STATUS_CONFIG[order.status]?.label || order.status, valueX, infoY + 24)

    // ═══════════════════════════════════════════════════════════════════════════
    // SEPARATOR LINE
    // ═══════════════════════════════════════════════════════════════════════════
    
    doc.setLineWidth(0.5)
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 88, 190, 88)

    // ═══════════════════════════════════════════════════════════════════════════
    // ITEMS TABLE HEADER
    // ═══════════════════════════════════════════════════════════════════════════
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    
    const tableHeaderY = 98
    doc.text('ITEM', 20, tableHeaderY)
    doc.text('QTY', 130, tableHeaderY, { align: 'center' })
    doc.text('PRICE', 155, tableHeaderY, { align: 'center' })
    doc.text('TOTAL', 185, tableHeaderY, { align: 'right' })

    // Header underline
    doc.setLineWidth(0.3)
    doc.setDrawColor(109, 40, 217) // Purple
    doc.line(20, tableHeaderY + 2, 190, tableHeaderY + 2)

    // ═══════════════════════════════════════════════════════════════════════════
    // ITEMS LIST
    // ═══════════════════════════════════════════════════════════════════════════
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    
    let y = tableHeaderY + 10
    const lineHeight = 8
    
    items.forEach((item, index) => {
      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(248, 248, 248)
        doc.rect(20, y - 5, 170, lineHeight, 'F')
      }

      // Item name (truncate if too long)
      const itemName = item.name.length > 45 ? item.name.substring(0, 42) + '...' : item.name
      doc.text(itemName, 22, y)
      
      // Quantity
      doc.text(item.quantity.toString(), 130, y, { align: 'center' })
      
      // Unit price
      doc.text(`$${Number(item.price).toFixed(2)}`, 155, y, { align: 'center' })
      
      // Line total
      doc.setFont('helvetica', 'bold')
      doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 185, y, { align: 'right' })
      doc.setFont('helvetica', 'normal')
      
      y += lineHeight
    })

    // ═══════════════════════════════════════════════════════════════════════════
    // SPECIAL NOTE (if present)
    // ═══════════════════════════════════════════════════════════════════════════
    
    if (order.note) {
      y += 5
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(150, 100, 0) // Amber
      
      // Note box
      doc.setFillColor(255, 251, 235) // Light amber background
      doc.setDrawColor(245, 158, 11) // Amber border
      doc.setLineWidth(0.5)
      doc.roundedRect(20, y - 4, 170, 14, 2, 2, 'FD')
      
      doc.text('NOTE:', 23, y + 2)
      const noteText = order.note.length > 80 ? order.note.substring(0, 77) + '...' : order.note
      doc.text(noteText, 40, y + 2)
      
      y += 14
      doc.setTextColor(0, 0, 0)
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TOTALS SECTION
    // ═══════════════════════════════════════════════════════════════════════════
    
    y += 8
    doc.setLineWidth(0.5)
    doc.setDrawColor(200, 200, 200)
    doc.line(20, y, 190, y)

    y += 8
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')

    // Subtotal
    const subtotal = Number(order.total_amount) / 1.05 // Remove 5% tax
    doc.text('Subtotal:', 130, y)
    doc.text(`$${subtotal.toFixed(2)}`, 185, y, { align: 'right' })

    y += 6
    // Tax (5%)
    const tax = subtotal * 0.05
    doc.text('Tax (5%):', 130, y)
    doc.text(`$${tax.toFixed(2)}`, 185, y, { align: 'right' })

    y += 2
    // Total line
    doc.setLineWidth(0.3)
    doc.setDrawColor(109, 40, 217)
    doc.line(130, y, 190, y)

    y += 8
    // GRAND TOTAL
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('TOTAL:', 130, y)
    doc.setTextColor(245, 158, 11) // Amber
    doc.text(`$${Number(order.total_amount).toFixed(2)}`, 185, y, { align: 'right' })

    // ═══════════════════════════════════════════════════════════════════════════
    // PAYMENT STATUS
    // ═══════════════════════════════════════════════════════════════════════════
    
    y += 12
    doc.setFontSize(10)
    const paymentStatus = payments[order.id]?.status || 'unpaid'
    
    if (paymentStatus === 'paid') {
      doc.setTextColor(34, 197, 94) // Green
      doc.setFont('helvetica', 'bold')
      doc.text('✓ PAID', 20, y)
      
      if (payments[order.id]?.paid_at) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        const paidDate = new Date(payments[order.id].paid_at)
        doc.text(
          `Paid on ${paidDate.toLocaleDateString()} at ${paidDate.toLocaleTimeString()}`, 
          20, 
          y + 5
        )
      }
    } else {
      doc.setTextColor(239, 68, 68) // Red
      doc.setFont('helvetica', 'bold')
      doc.text('⚠ UNPAID', 20, y)
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FOOTER
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Footer separator
    doc.setLineWidth(0.3)
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 270, 190, 270)

    // Thank you message
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(109, 40, 217) // Purple
    doc.text('Thank you for dining with us!', 105, 278, { align: 'center' })

    // System info
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text('QrDine - QR-Based Food Ordering System', 105, 284, { align: 'center' })
    doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 289, { align: 'center' })

    // ═══════════════════════════════════════════════════════════════════════════
    // SAVE PDF
    // ═══════════════════════════════════════════════════════════════════════════
    
    const filename = `QrDine-Bill-Table-${order.table_number}-${order.id.slice(0, 8)}.pdf`
    doc.save(filename)
  }

  // ── Filtered orders ─────────────────────────────────────────────────────────
  const displayed = orders.filter(order => {
    const matchSearch = 
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.table_number.toString().includes(search)

    const matchStatus = filterStatus === 'all' || order.status === filterStatus

    const payment = payments[order.id]
    const matchPayment = filterPayment === 'all' || payment?.status === filterPayment

    return matchSearch && matchStatus && matchPayment
  })

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = {
    total:    orders.length,
    pending:  orders.filter(o => o.status === 'pending').length,
    paid:     Object.values(payments).filter(p => p.status === 'paid').length,
    unpaid:   Object.values(payments).filter(p => p.status === 'unpaid').length,
    revenue:  orders.reduce((sum, o) => sum + Number(o.total_amount), 0),
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-gray-950 transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-gray-950/80 backdrop-blur-lg
                        border-b border-white/5 px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-white text-xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-purple-400" />
                Orders Management
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">
                {displayed.length} of {stats.total} orders
                {(filterStatus !== 'all' || filterPayment !== 'all' || search) && ' (filtered)'}
              </p>
            </div>
            <button onClick={fetchOrders} className="btn-ghost" disabled={loading}>
              <Download className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col gap-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Total Orders', value: stats.total,    icon: ShoppingBag,  color: 'purple' },
              { label: 'Pending',      value: stats.pending,  icon: Clock,        color: 'amber'  },
              { label: 'Paid',         value: stats.paid,     icon: CheckCircle2, color: 'green'  },
              { label: 'Unpaid',       value: stats.unpaid,   icon: XCircle,      color: 'red'    },
              { label: 'Revenue',      value: `$${stats.revenue.toFixed(0)}`, icon: TrendingUp, color: 'purple' },
            ].map(({ label, value, icon: Icon, color }) => {
              const c = COLOR_MAP[color]
              return (
                <div key={label} className="glass-card p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${c.text}`} />
                    <p className="text-gray-400 text-xs">{label}</p>
                  </div>
                  <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
                </div>
              )
            })}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2
                                 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by order ID or table…"
                className="input-field pl-9"
              />
            </div>

            {/* Status filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="input-field appearance-none pr-8 sm:w-40"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="served">Served</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2
                                      w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            {/* Payment filter */}
            <div className="relative">
              <select
                value={filterPayment}
                onChange={e => setFilterPayment(e.target.value)}
                className="input-field appearance-none pr-8 sm:w-40"
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2
                                      w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <ShoppingBag className="w-12 h-12 text-gray-600" />
              <p className="text-gray-400">
                {search || filterStatus !== 'all' || filterPayment !== 'all'
                  ? 'No orders match your filters'
                  : 'No orders yet'}
              </p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/5 bg-white/3">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold
                                     text-gray-400 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold
                                     text-gray-400 uppercase tracking-wider">
                        Table
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold
                                     text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold
                                     text-gray-400 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold
                                     text-gray-400 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold
                                     text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map(order => (
                      <OrderRow
                        key={order.id}
                        order={order}
                        payment={payments[order.id]}
                        onViewDetails={viewDetails}
                        onTogglePayment={togglePayment}
                        updatingPayment={updatingPayment}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Live indicator */}
          <div className="flex items-center gap-2 justify-center text-xs text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Real-time updates active
          </div>
        </div>
      </main>

      {/* Order details modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          items={orderItems[selectedOrder.id] || []}
          payment={payments[selectedOrder.id]}
          onClose={() => setSelectedOrder(null)}
          onDownloadBill={downloadBill}
        />
      )}
    </div>
  )
}