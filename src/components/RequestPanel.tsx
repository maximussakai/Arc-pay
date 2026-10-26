import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { Copy, Check, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { buildShareLink } from '@/lib/share'

const QUICK_AMOUNTS = ['1', '5', '10', '25', '50', '100']

export default function RequestPanel() {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [copied, setCopied] = useState(false)
  const [shareBase, setShareBase] = useState('')

  // Resolve share base once on mount
  useEffect(() => {
    void buildShareLink('').then((base) => setShareBase(base.replace(/\/$/, '')))
  }, [])

  // Derive the link synchronously from current state — no secondary setState needed
  const link = (() => {
    if (!address || !shareBase) return ''
    const params = new URLSearchParams({ to: address })
    if (amount && parseFloat(amount) > 0) params.set('amount', amount)
    if (memo.trim()) params.set('memo', memo.trim())
    return `${shareBase}?${params.toString()}`
  })()

  const handleCopy = () => {
    if (!link) return
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      toast.success('Payment link copied!')
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      toast.error('Could not copy to clipboard.')
    })
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div
          className="flex size-14 items-center justify-center rounded-full"
          style={{ background: 'var(--surface-muted)' }}
        >
          <Link2 className="size-6" style={{ color: 'var(--muted)' }} />
        </div>
        <div>
          <p className="font-semibold" style={{ color: 'var(--ink)' }}>Connect to generate a link</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Your wallet address will be the payment destination.
          </p>
        </div>
        <ConnectKitButton.Custom>
          {({ show }) => (
            <button
              onClick={show}
              className="rounded-2xl px-6 py-3 text-sm font-semibold text-white"
              style={{ background: 'var(--accent)' }}
            >
              Connect Wallet
            </button>
          )}
        </ConnectKitButton.Custom>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Amount (optional) */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--surface-muted)' }}>
        <label className="mb-1.5 block text-xs font-semibold tracking-wide" style={{ color: 'var(--muted)' }}>
          REQUEST AMOUNT (OPTIONAL)
        </label>
        <div className="flex items-baseline gap-2">
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.]/g, '')
              if (v === '' || /^\d*\.?\d*$/.test(v)) setAmount(v)
            }}
            placeholder="0.00"
            className="display w-full bg-transparent text-3xl font-bold tabular-nums outline-none placeholder:text-slate-300"
            style={{ color: 'var(--ink)' }}
          />
          <span className="text-base font-medium" style={{ color: 'var(--subtle)' }}>USDC</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {QUICK_AMOUNTS.map((q) => (
            <button
              key={q}
              onClick={() => setAmount(amount === q ? '' : q)}
              className="rounded-lg px-2.5 py-1 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
              style={{
                background: amount === q ? 'var(--accent)' : 'var(--surface)',
                color: amount === q ? '#fff' : 'var(--ink-2)',
                border: '1px solid var(--border)',
              }}
            >
              ${q}
            </button>
          ))}
        </div>
      </div>

      {/* Memo */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--surface-muted)' }}>
        <label className="mb-1.5 block text-xs font-semibold tracking-wide" style={{ color: 'var(--muted)' }}>
          NOTE (OPTIONAL)
        </label>
        <input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Invoice #42, dinner split…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-300"
          style={{ color: 'var(--ink)' }}
        />
      </div>

      {/* Generated link */}
      {link && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-wide" style={{ color: 'var(--muted)' }}>
            YOUR PAYMENT LINK
          </p>
          <div
            className="flex items-center gap-3 rounded-2xl p-4"
            style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
          >
            <p
              className="mono min-w-0 flex-1 truncate text-xs"
              style={{ color: 'var(--ink-2)' }}
            >
              {link}
            </p>
            <button
              onClick={handleCopy}
              className="shrink-0 rounded-xl p-2 transition-all hover:scale-105 active:scale-95"
              style={{ background: copied ? 'rgba(26,128,71,0.12)' : 'var(--surface)' }}
            >
              {copied
                ? <Check className="size-4" style={{ color: 'var(--success)' }} />
                : <Copy className="size-4" style={{ color: 'var(--ink-2)' }} />}
            </button>
          </div>
          <p className="text-xs" style={{ color: 'var(--subtle)' }}>
            Share this link — the sender will see the amount and note pre-filled.
          </p>
        </div>
      )}
    </div>
  )
}
