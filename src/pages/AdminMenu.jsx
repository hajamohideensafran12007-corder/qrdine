import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import Sidebar from '../components/Sidebar'
import ImageUpload from '../components/ImageUpload'
import {
  Plus, Pencil, Trash2, X, Check, Search,
  UtensilsCrossed, ToggleLeft, ToggleRight,
  AlertTriangle, ChevronDown, Star, StarOff,
  PackageOpen, Loader2
} from 'lucide-react'

// ── tiny helpers ─────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '', description: '', price: '',
  category_id: '', image_url: '',
  is_available: true, is_featured: false,
}

function Badge({ children, color = 'purple' }) {
  const map = {
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    green:  'bg-green-500/10  text-green-400  border-green-500/20',
    red:    'bg-red-500/10    text-red-400    border-red-500/20',
    amber:  'bg-amber-500/10  text-amber-400  border-amber-500/20',
  }
  return (
    <span className={`status-badge border ${map[color]}`}>{children}</span>
  )
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4
                    bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto
                      animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-white font-semibold text-lg">{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center
                       justify-center text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ── Delete confirmation modal ─────────────────────────────────────────────────
function DeleteModal({ item, onConfirm, onCancel, loading }) {
  return (
    <Modal title="Delete Menu Item" onClose={onCancel}>
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20
                          flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <p className="text-white font-medium">
              Delete &ldquo;{item.name}&rdquo;?
            </p>
            <p className="text-gray-400 text-sm mt-1">
              This action cannot be undone. The item will be permanently
              removed from your menu.
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-ghost">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500
                       disabled:opacity-60 text-white font-semibold px-4 py-2
                       rounded-xl transition-colors"
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Trash2 className="w-4 h-4" />}
            {loading ? 'Deleting…' : 'Delete Item'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Item form (shared for add + edit) ────────────────────────────────────────
function ItemForm({ form, setForm, categories, onSubmit, onCancel, saving, isEdit }) {

  const handleChange = (field, value) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const valid = form.name.trim() && form.price !== '' &&
                Number(form.price) >= 0 && form.category_id

  return (
    <form
      onSubmit={e => { e.preventDefault(); if (valid) onSubmit() }}
      className="flex flex-col gap-5"
    >
      {/* Image */}
      <div className="flex flex-col gap-1.5">
        <label className="text-gray-400 text-xs font-medium uppercase tracking-wider">
          Item Image
        </label>
        <ImageUpload
          value={form.image_url}
          onChange={url => handleChange('image_url', url)}
        />
      </div>

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-gray-400 text-xs font-medium uppercase tracking-wider">
          Item Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={e => handleChange('name', e.target.value)}
          placeholder="e.g. Crispy Calamari"
          required
          className="input-field"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-gray-400 text-xs font-medium uppercase tracking-wider">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={e => handleChange('description', e.target.value)}
          placeholder="Short description of the dish…"
          rows={3}
          className="input-field resize-none"
        />
      </div>

      {/* Price + Category row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-gray-400 text-xs font-medium uppercase tracking-wider">
            Price ($) <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={e => handleChange('price', e.target.value)}
            placeholder="0.00"
            required
            className="input-field"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-gray-400 text-xs font-medium uppercase tracking-wider">
            Category <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <select
              value={form.category_id}
              onChange={e => handleChange('category_id', e.target.value)}
              required
              className="input-field appearance-none pr-8"
            >
              <option value="" disabled>Select…</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2
                                    w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-col gap-3 p-4 bg-white/3 rounded-xl border border-white/5">
        {/* Available toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-medium">Available</p>
            <p className="text-gray-500 text-xs">Show this item on the customer menu</p>
          </div>
          <button
            type="button"
            onClick={() => handleChange('is_available', !form.is_available)}
            className="transition-colors"
          >
            {form.is_available
              ? <ToggleRight className="w-8 h-8 text-purple-400" />
              : <ToggleLeft  className="w-8 h-8 text-gray-600" />}
          </button>
        </div>
        {/* Featured toggle */}
        <div className="flex items-center justify-between border-t border-white/5 pt-3">
          <div>
            <p className="text-white text-sm font-medium">Featured</p>
            <p className="text-gray-500 text-xs">Highlight this item at the top of menu</p>
          </div>
          <button
            type="button"
            onClick={() => handleChange('is_featured', !form.is_featured)}
            className="transition-colors"
          >
            {form.is_featured
              ? <ToggleRight className="w-8 h-8 text-amber-400" />
              : <ToggleLeft  className="w-8 h-8 text-gray-600" />}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 justify-center">
          Cancel
        </button>
        <button
          type="submit"
          disabled={!valid || saving}
          className="btn-primary flex-1 justify-center disabled:opacity-60
                     disabled:cursor-not-allowed"
        >
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            : <><Check className="w-4 h-4" /> {isEdit ? 'Save Changes' : 'Add Item'}</>}
        </button>
      </div>
    </form>
  )
}

// ── Menu item card ────────────────────────────────────────────────────────────
function ItemCard({ item, categoryName, onEdit, onDelete, onToggleAvail, onToggleFeat }) {
  return (
    <div className="glass-card overflow-hidden flex flex-col group
                    hover:border-purple-500/20 transition-all duration-300">
      {/* Image */}
      <div className="relative h-44 bg-gray-800 overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover transition-transform
                       duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UtensilsCrossed className="w-10 h-10 text-gray-600" />
          </div>
        )}
        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {item.is_featured && (
            <span className="flex items-center gap-1 text-xs font-semibold
                             bg-amber-500/90 text-gray-900 px-2 py-0.5 rounded-full
                             backdrop-blur-sm">
              <Star className="w-3 h-3" /> Featured
            </span>
          )}
          {!item.is_available && (
            <span className="text-xs font-semibold bg-red-500/90 text-white
                             px-2 py-0.5 rounded-full backdrop-blur-sm">
              Unavailable
            </span>
          )}
        </div>
        {/* Action buttons (appear on hover) */}
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0
                        group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onEdit(item)}
            className="w-8 h-8 bg-white/10 backdrop-blur-sm hover:bg-purple-700
                       border border-white/10 rounded-lg flex items-center justify-center
                       text-white transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(item)}
            className="w-8 h-8 bg-white/10 backdrop-blur-sm hover:bg-red-600
                       border border-white/10 rounded-lg flex items-center justify-center
                       text-white transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm leading-tight truncate">
              {item.name}
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">{categoryName}</p>
          </div>
          <span className="text-amber-400 font-bold text-sm shrink-0">
            ${Number(item.price).toFixed(2)}
          </span>
        </div>

        {item.description && (
          <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Toggle row */}
        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/5">
          <button
            onClick={() => onToggleAvail(item)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg
                        border transition-colors flex-1 justify-center font-medium
                        ${item.is_available
                          ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                        }`}
          >
            {item.is_available
              ? <><ToggleRight className="w-3.5 h-3.5" /> Available</>
              : <><ToggleLeft  className="w-3.5 h-3.5" /> Hidden</>}
          </button>
          <button
            onClick={() => onToggleFeat(item)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg
                        border transition-colors flex-1 justify-center font-medium
                        ${item.is_featured
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                          : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10'
                        }`}
          >
            {item.is_featured
              ? <><Star    className="w-3.5 h-3.5" /> Featured</>
              : <><StarOff className="w-3.5 h-3.5" /> Feature</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function AdminMenu() {
  const [items,      setItems]      = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  // modal state
  const [showAdd,    setShowAdd]    = useState(false)
  const [editItem,   setEditItem]   = useState(null)   // item obj or null
  const [deleteItem, setDeleteItem] = useState(null)   // item obj or null

  // search + filter
  const [search,     setSearch]     = useState('')
  const [filterCat,  setFilterCat]  = useState('all')

  // form
  const [form, setForm] = useState(EMPTY_FORM)

  // ── Fetch data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: cats }, { data: items }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('menu_items')
        .select('*, categories(name,icon)')
        .order('sort_order'),
    ])
    setCategories(cats || [])
    setItems(items || [])
    setLoading(false)
  }

  // ── Filtered + searched items ───────────────────────────────────────────────
  const displayed = items.filter(item => {
    const matchCat    = filterCat === 'all' || item.category_id === filterCat
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                        (item.description || '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  // ── ADD item ────────────────────────────────────────────────────────────────
  const openAdd = () => { setForm(EMPTY_FORM); setShowAdd(true) }

  const handleAdd = async () => {
    setSaving(true)
    const { error } = await supabase.from('menu_items').insert({
      name:         form.name.trim(),
      description:  form.description.trim() || null,
      price:        Number(form.price),
      category_id:  form.category_id,
      image_url:    form.image_url || null,
      is_available: form.is_available,
      is_featured:  form.is_featured,
    })
    setSaving(false)
    if (!error) { setShowAdd(false); fetchAll() }
  }

  // ── EDIT item ───────────────────────────────────────────────────────────────
  const openEdit = (item) => {
    setForm({
      name:         item.name,
      description:  item.description || '',
      price:        item.price,
      category_id:  item.category_id,
      image_url:    item.image_url || '',
      is_available: item.is_available,
      is_featured:  item.is_featured,
    })
    setEditItem(item)
  }

  const handleEdit = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('menu_items')
      .update({
        name:         form.name.trim(),
        description:  form.description.trim() || null,
        price:        Number(form.price),
        category_id:  form.category_id,
        image_url:    form.image_url || null,
        is_available: form.is_available,
        is_featured:  form.is_featured,
      })
      .eq('id', editItem.id)
    setSaving(false)
    if (!error) { setEditItem(null); fetchAll() }
  }

  // ── DELETE item ─────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', deleteItem.id)
    setDeleting(false)
    if (!error) { setDeleteItem(null); fetchAll() }
  }

  // ── Quick toggles ───────────────────────────────────────────────────────────
  const toggleAvail = async (item) => {
    await supabase
      .from('menu_items')
      .update({ is_available: !item.is_available })
      .eq('id', item.id)
    setItems(prev =>
      prev.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i)
    )
  }

  const toggleFeat = async (item) => {
    await supabase
      .from('menu_items')
      .update({ is_featured: !item.is_featured })
      .eq('id', item.id)
    setItems(prev =>
      prev.map(i => i.id === item.id ? { ...i, is_featured: !i.is_featured } : i)
    )
  }

  // ── Category name lookup ────────────────────────────────────────────────────
  const catName = (item) => {
    const c = item.categories
    return c ? `${c.icon} ${c.name}` : '—'
  }

  // ── Stats bar ───────────────────────────────────────────────────────────────
  const totalItems     = items.length
  const availableItems = items.filter(i => i.is_available).length
  const featuredItems  = items.filter(i => i.is_featured).length

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-gray-950 transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">

        {/* ── Header ── */}
        <div className="sticky top-0 z-20 bg-gray-950/80 backdrop-blur-lg
                        border-b border-white/5 px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-white text-xl font-bold">Menu Management</h1>
              <p className="text-gray-400 text-sm mt-0.5">
                {totalItems} items · {availableItems} available · {featuredItems} featured
              </p>
            </div>
            <button onClick={openAdd} className="btn-primary">
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col gap-6">

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Items',  value: totalItems,               color: 'purple' },
              { label: 'Available',    value: availableItems,           color: 'green'  },
              { label: 'Unavailable',  value: totalItems-availableItems,color: 'red'    },
              { label: 'Featured',     value: featuredItems,            color: 'amber'  },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card px-4 py-3 flex flex-col gap-1">
                <p className="text-gray-400 text-xs">{label}</p>
                <p className={`text-2xl font-bold
                  ${color==='purple'?'text-purple-400':
                    color==='green'?'text-green-400':
                    color==='red'?'text-red-400':'text-amber-400'}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* ── Search + Filter ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2
                                 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search items…"
                className="input-field pl-9"
              />
            </div>
            {/* Category filter */}
            <div className="relative">
              <select
                value={filterCat}
                onChange={e => setFilterCat(e.target.value)}
                className="input-field appearance-none pr-8 sm:w-44"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2
                                      w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* ── Grid ── */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                <p className="text-gray-400 text-sm">Loading menu items…</p>
              </div>
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center
                            py-24 gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10
                              flex items-center justify-center">
                <PackageOpen className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <p className="text-white font-medium">No items found</p>
                <p className="text-gray-500 text-sm mt-1">
                  {search || filterCat !== 'all'
                    ? 'Try adjusting your search or filter.'
                    : 'Click "Add Item" to create your first menu item.'}
                </p>
              </div>
              {!search && filterCat === 'all' && (
                <button onClick={openAdd} className="btn-primary mt-2">
                  <Plus className="w-4 h-4" /> Add First Item
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                            xl:grid-cols-4 gap-4">
              {displayed.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  categoryName={catName(item)}
                  onEdit={openEdit}
                  onDelete={setDeleteItem}
                  onToggleAvail={toggleAvail}
                  onToggleFeat={toggleFeat}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── Add Modal ── */}
      {showAdd && (
        <Modal title="Add Menu Item" onClose={() => setShowAdd(false)}>
          <ItemForm
            form={form}
            setForm={setForm}
            categories={categories}
            onSubmit={handleAdd}
            onCancel={() => setShowAdd(false)}
            saving={saving}
            isEdit={false}
          />
        </Modal>
      )}

      {/* ── Edit Modal ── */}
      {editItem && (
        <Modal title="Edit Menu Item" onClose={() => setEditItem(null)}>
          <ItemForm
            form={form}
            setForm={setForm}
            categories={categories}
            onSubmit={handleEdit}
            onCancel={() => setEditItem(null)}
            saving={saving}
            isEdit={true}
          />
        </Modal>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteItem && (
        <DeleteModal
          item={deleteItem}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}