import { useState } from 'react'
import { Lock, ChefHat } from 'lucide-react'

const CHEF_PIN = '1234'

export default function ChefPINGate({ children }) {
  const [pin, setPin] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (pin === CHEF_PIN) {
      setUnlocked(true)
      setError('')
    } else {
      setError('Incorrect PIN. Try again.')
      setPin('')
    }
  }

  if (unlocked) return children

  return (
    <div className="min-h-screen bg-gray-950 bg-grid flex items-center justify-center px-4">
      <div className="glass-card p-8 w-full max-w-sm flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-purple-700/20 border border-purple-500/30 flex items-center justify-center">
          <ChefHat className="w-8 h-8 text-purple-400" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-1">Chef Access</h1>
          <p className="text-gray-400 text-sm">Enter your 4-digit PIN to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="• • • •"
            className="input-field text-center text-2xl tracking-widest"
            autoFocus
          />
          {error && (
            <p className="text-red-400 text-sm text-center flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> {error}
            </p>
          )}
          <button type="submit" className="btn-primary justify-center py-3">
            <Lock className="w-4 h-4" />
            Unlock Dashboard
          </button>
        </form>
        <p className="text-gray-600 text-xs">Demo PIN: 1234</p>
      </div>
    </div>
  )
}