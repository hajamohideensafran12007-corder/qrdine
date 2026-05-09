import { useState, useRef, useCallback } from 'react'
import { Upload, X, ImageIcon, CheckCircle, AlertCircle, FileImage } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const MAX_FILE_SIZE_MB = 2
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export default function ImageUpload({ value, onChange }) {
  const [uploading, setUploading]   = useState(false)
  const [progress, setProgress]     = useState(0)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState(false)
  const [dragging, setDragging]     = useState(false)
  const inputRef                    = useRef(null)

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = (file) => {
    if (!file) return 'No file selected.'
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type. Allowed: JPG, PNG, WEBP, GIF.`
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`
    }
    return null
  }

  // ── Core upload logic ───────────────────────────────────────────────────────
  const uploadFile = useCallback(async (file) => {
    const validationError = validate(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setUploading(true)
    setError('')
    setSuccess(false)
    setProgress(0)

    // Simulate progress in increments while uploading
    // (Supabase JS v2 doesn't expose upload progress natively,
    //  so we fake a smooth progress bar for UX)
    const fakeProgress = setInterval(() => {
      setProgress(prev => {
        if (prev >= 85) {
          clearInterval(fakeProgress)
          return 85
        }
        return prev + Math.random() * 15
      })
    }, 200)

    try {
      // Build a unique file path: menu/timestamp-sanitised-name.ext
      const ext      = file.name.split('.').pop().toLowerCase()
      const safeName = file.name
        .replace(/\.[^.]+$/, '')           // remove extension
        .replace(/[^a-zA-Z0-9]/g, '_')    // sanitise special chars
        .toLowerCase()
        .slice(0, 40)                      // limit length
      const fileName = `menu/${Date.now()}-${safeName}.${ext}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        })

      clearInterval(fakeProgress)

      if (uploadError) {
        setError(uploadError.message)
        setProgress(0)
        setUploading(false)
        return
      }

      // Get the permanent public URL
      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName)

      setProgress(100)
      setSuccess(true)

      // Small delay so user sees 100% before the preview replaces the uploader
      await new Promise(r => setTimeout(r, 600))

      onChange(publicUrl)
    } catch (err) {
      clearInterval(fakeProgress)
      setError(err.message || 'Upload failed. Please try again.')
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }, [onChange])

  // ── Remove / clear ──────────────────────────────────────────────────────────
  const handleRemove = () => {
    onChange('')
    setSuccess(false)
    setProgress(0)
    setError('')
    // Reset the file input so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = ''
  }

  // ── File input change ───────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  // ── Drag and drop handlers ──────────────────────────────────────────────────
  const handleDragOver  = (e) => { e.preventDefault(); setDragging(true)  }
  const handleDragLeave = (e) => { e.preventDefault(); setDragging(false) }
  const handleDrop      = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  // ── Render: Image preview (after upload) ────────────────────────────────────
  if (value) {
    return (
      <div className="flex flex-col gap-2">
        <div className="relative w-full h-48 rounded-xl overflow-hidden
                        border border-white/10 group">
          <img
            src={value}
            alt="Menu item preview"
            className="w-full h-full object-cover transition-transform
                       duration-300 group-hover:scale-105"
          />
          {/* Dark overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40
                          transition-colors duration-200 flex items-center justify-center">
            <button
              onClick={handleRemove}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200
                         flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white
                         text-sm font-medium px-4 py-2 rounded-xl shadow-lg"
            >
              <X className="w-4 h-4" />
              Remove Image
            </button>
          </div>
          {/* Success badge */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5
                          bg-green-500/20 border border-green-500/40 text-green-400
                          text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
            <CheckCircle className="w-3 h-3" />
            Uploaded
          </div>
        </div>
        <p className="text-gray-500 text-xs truncate px-1">
          {value.split('/').pop()}
        </p>
      </div>
    )
  }

  // ── Render: Drop zone (before upload) ───────────────────────────────────────
  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center w-full h-48
          border-2 border-dashed rounded-xl transition-all duration-200
          ${uploading
            ? 'border-purple-500/50 bg-purple-700/5 cursor-wait'
            : dragging
              ? 'border-amber-500/70 bg-amber-500/5 scale-[1.01] cursor-copy'
              : 'border-white/10 hover:border-purple-500/50 hover:bg-purple-700/5 cursor-pointer'
          }
        `}
      >
        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          className="hidden"
          onChange={handleInputChange}
          disabled={uploading}
        />

        {uploading ? (
          /* ── Uploading state ── */
          <div className="flex flex-col items-center gap-4 w-full px-8">
            <div className="w-12 h-12 rounded-full bg-purple-700/20
                            border border-purple-500/30 flex items-center justify-center">
              <Upload className="w-6 h-6 text-purple-400 animate-bounce" />
            </div>
            <div className="w-full flex flex-col gap-1.5">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Uploading to Supabase Storage…</span>
                <span>{Math.round(progress)}%</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-amber-500
                             rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        ) : dragging ? (
          /* ── Dragging state ── */
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/20
                            border border-amber-500/40 flex items-center justify-center">
              <FileImage className="w-6 h-6 text-amber-400" />
            </div>
            <p className="text-amber-400 font-medium text-sm">Drop to upload</p>
          </div>
        ) : (
          /* ── Idle state ── */
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/5
                            border border-white/10 flex items-center justify-center
                            group-hover:border-purple-500/40 transition-colors">
              <ImageIcon className="w-6 h-6 text-gray-500" />
            </div>
            <div className="text-center">
              <p className="text-gray-300 text-sm font-medium">
                Click to upload or drag & drop
              </p>
              <p className="text-gray-600 text-xs mt-1">
                PNG, JPG, WEBP, GIF — max {MAX_FILE_SIZE_MB}MB
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600
                            border border-white/5 rounded-lg px-3 py-1.5">
              <Upload className="w-3 h-3" />
              Uploads to Supabase Storage → menu-images bucket
            </div>
          </div>
        )}
      </div>

      {/* ── Error message ── */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs
                        bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2
                        animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Success flash (before preview takes over) ── */}
      {success && !value && (
        <div className="flex items-center gap-2 text-green-400 text-xs
                        bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2
                        animate-fade-in">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          Image uploaded successfully!
        </div>
      )}
    </div>
  )
}