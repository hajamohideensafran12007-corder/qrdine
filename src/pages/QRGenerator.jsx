import { useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import Sidebar from '../components/Sidebar'
import {
  QrCode, Download, Grid3x3, Sparkles, Copy,
  Check, AlertCircle, Package
} from 'lucide-react'

// ── Single QR Card ────────────────────────────────────────────────────────────
function QRCard({ tableNumber, baseUrl, onDownload }) {
  const [copied, setCopied] = useState(false)
  const url = `${baseUrl}?table=${tableNumber}`
  const qrId = `qr-table-${tableNumber}`

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    onDownload(tableNumber, qrId)
  }

  return (
    <div className="glass-card p-5 flex flex-col items-center gap-4 group
                    hover:border-purple-500/30 transition-all duration-300">
      {/* Table number badge */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-700 flex items-center
                          justify-center text-white text-sm font-bold">
            {tableNumber}
          </div>
          <span className="text-white font-semibold">Table {tableNumber}</span>
        </div>
        <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-lg">
          QR Code
        </span>
      </div>

      {/* QR Code */}
      <div className="w-full aspect-square bg-white rounded-xl p-4 flex items-center
                      justify-center shadow-lg">
        <QRCodeCanvas
          id={qrId}
          value={url}
          size={200}
          level="H"
          includeMargin={true}
          imageSettings={{
            src: '',
            excavate: true,
            width: 40,
            height: 40,
          }}
        />
      </div>

      {/* URL */}
      <div className="w-full flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2
                      border border-white/10">
        <p className="text-gray-400 text-xs flex-1 truncate font-mono">
          {url}
        </p>
        <button
          onClick={handleCopyUrl}
          className="shrink-0 w-7 h-7 rounded-lg hover:bg-white/10 flex items-center
                     justify-center text-gray-400 hover:text-white transition-colors"
          title="Copy URL"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="btn-primary w-full justify-center text-sm opacity-0
                   group-hover:opacity-100 transition-opacity"
      >
        <Download className="w-4 h-4" />
        Download PNG
      </button>
    </div>
  )
}

// ── Bulk Generation Preview ──────────────────────────────────────────────────
function BulkPreviewCard({ tableNumber, baseUrl, qrId }) {
  const url = `${baseUrl}?table=${tableNumber}`

  return (
    <div className="glass-card p-3 flex flex-col items-center gap-2">
      <span className="text-white text-xs font-semibold">Table {tableNumber}</span>
      <div className="w-full aspect-square bg-white rounded-lg p-2 flex items-center
                      justify-center">
        <QRCodeCanvas
          id={qrId}
          value={url}
          size={80}
          level="H"
          includeMargin={true}
        />
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function QRGenerator() {
  const [baseUrl, setBaseUrl] = useState('https://yoursite.com')
  const [singleTable, setSingleTable] = useState('1')
  const [bulkStart, setBulkStart] = useState('1')
  const [bulkEnd, setBulkEnd] = useState('20')
  const [generating, setGenerating] = useState(false)
  const [mode, setMode] = useState('single') // 'single' | 'bulk'

  // ── Download single QR code ─────────────────────────────────────────────────
  const downloadQR = (tableNumber, qrId) => {
    const canvas = document.getElementById(qrId)
    if (!canvas) return

    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `QrDine-Table-${tableNumber}.png`
    link.href = url
    link.click()
  }

  // ── Download all QR codes (bulk) ────────────────────────────────────────────
  const downloadAllQR = async () => {
    setGenerating(true)

    const start = parseInt(bulkStart)
    const end = parseInt(bulkEnd)

    if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
      alert('Please enter valid table range (e.g., 1 to 20)')
      setGenerating(false)
      return
    }

    // Small delay to ensure all canvases are rendered
    await new Promise(resolve => setTimeout(resolve, 500))

    for (let i = start; i <= end; i++) {
      const qrId = `qr-bulk-${i}`
      const canvas = document.getElementById(qrId)
      if (!canvas) continue

      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `QrDine-Table-${i}.png`
      link.href = url
      link.click()

      // Small delay between downloads to avoid browser blocking
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    setGenerating(false)
  }

  // ── Bulk table numbers array ────────────────────────────────────────────────
  const bulkTables = () => {
    const start = parseInt(bulkStart)
    const end = parseInt(bulkEnd)
    if (isNaN(start) || isNaN(end) || start < 1 || end < start || end > 100) {
      return []
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const tables = bulkTables()

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
                <QrCode className="w-5 h-5 text-purple-400" />
                QR Code Generator
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">
                Generate QR codes for table orders
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col gap-6">

          {/* Base URL Config */}
          <div className="glass-card p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20
                              flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm mb-1">Base URL</h3>
                <p className="text-gray-500 text-xs mb-3">
                  QR codes will link to: <span className="text-purple-400">{baseUrl}/?table=X</span>
                </p>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={e => setBaseUrl(e.target.value)}
                  placeholder="https://yourrestaurant.com"
                  className="input-field"
                />
                <p className="text-gray-600 text-xs mt-2">
                  💡 Replace with your deployed app URL (e.g., Vercel, Netlify, custom domain)
                </p>
              </div>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex gap-3">
            <button
              onClick={() => setMode('single')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3
                          rounded-xl font-semibold text-sm transition-all duration-200 border
                          ${mode === 'single'
                            ? 'bg-purple-700 text-white border-purple-600 shadow-lg shadow-purple-900/30'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                          }`}
            >
              <QrCode className="w-4 h-4" />
              Single Table
            </button>
            <button
              onClick={() => setMode('bulk')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3
                          rounded-xl font-semibold text-sm transition-all duration-200 border
                          ${mode === 'bulk'
                            ? 'bg-purple-700 text-white border-purple-600 shadow-lg shadow-purple-900/30'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                          }`}
            >
              <Grid3x3 className="w-4 h-4" />
              Bulk Generate
            </button>
          </div>

          {/* Single Mode */}
          {mode === 'single' && (
            <div className="flex flex-col gap-6">
              <div className="glass-card p-5">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-purple-400" />
                  Generate Single QR Code
                </h3>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-gray-400 text-xs mb-2 block">Table Number</label>
                    <input
                      type="number"
                      min="1"
                      value={singleTable}
                      onChange={e => setSingleTable(e.target.value)}
                      placeholder="Enter table number"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {singleTable && parseInt(singleTable) > 0 && (
                <div className="max-w-sm mx-auto w-full">
                  <QRCard
                    tableNumber={parseInt(singleTable)}
                    baseUrl={baseUrl}
                    onDownload={downloadQR}
                  />
                </div>
              )}
            </div>
          )}

          {/* Bulk Mode */}
          {mode === 'bulk' && (
            <div className="flex flex-col gap-6">
              <div className="glass-card p-5">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Grid3x3 className="w-4 h-4 text-purple-400" />
                  Bulk Generate QR Codes
                </h3>
                <div className="flex gap-3 mb-4">
                  <div className="flex-1">
                    <label className="text-gray-400 text-xs mb-2 block">From Table</label>
                    <input
                      type="number"
                      min="1"
                      value={bulkStart}
                      onChange={e => setBulkStart(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-gray-400 text-xs mb-2 block">To Table</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={bulkEnd}
                      onChange={e => setBulkEnd(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                {tables.length > 0 && (
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <p className="text-gray-400 text-sm">
                      {tables.length} QR code{tables.length !== 1 ? 's' : ''} will be generated
                    </p>
                    <button
                      onClick={downloadAllQR}
                      disabled={generating}
                      className="btn-amber disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {generating ? (
                        <>
                          <Package className="w-4 h-4 animate-pulse" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download All ({tables.length})
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Preview Grid */}
              {tables.length > 0 && tables.length <= 50 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-white font-semibold text-sm">Preview</h3>
                    <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
                      {tables.length} codes
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {tables.map(num => (
                      <BulkPreviewCard
                        key={num}
                        tableNumber={num}
                        baseUrl={baseUrl}
                        qrId={`qr-bulk-${num}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {tables.length > 50 && (
                <div className="glass-card p-5 flex items-start gap-3 bg-amber-500/5
                                border-amber-500/20">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-300 text-sm font-semibold">
                      Large Batch ({tables.length} codes)
                    </p>
                    <p className="text-amber-400/80 text-xs mt-1">
                      Preview hidden for performance. Click "Download All" to generate QR codes.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="glass-card p-5 bg-purple-500/5 border-purple-500/20">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              How to Use
            </h3>
            <ul className="text-gray-300 text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 shrink-0">1.</span>
                <span>Set your base URL (your deployed restaurant website)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 shrink-0">2.</span>
                <span>Generate QR codes for individual tables or in bulk</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 shrink-0">3.</span>
                <span>Download as PNG files</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 shrink-0">4.</span>
                <span>Print and place QR codes on restaurant tables</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 shrink-0">5.</span>
                <span>Customers scan → auto-detect table number → order directly</span>
              </li>
            </ul>
          </div>

        </div>
      </main>
    </div>
  )
}