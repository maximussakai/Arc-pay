import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useReadContract } from 'wagmi'
import { erc20Abi, isAddress } from 'viem'
import { ConnectKitButton } from 'connectkit'
import { arcTestnet } from 'viem/chains'
import { ArrowUpRight, Loader2, ExternalLink, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getUsdc, buildTxExplorerUrl } from '@/onchain-facts'
import { Amount, usdcDecimalsFor } from '@/onchain-money'

const CHAIN_ID = arcTestnet.id
const usdc = getUsdc(CHAIN_ID)!

const QUICK_AMOUNTS = ['1', '5', '10', '25']

function parseOnchainError(error: unknown): string {
  const msg = (error as { message?: string })?.message?.toLowerCase() ?? ''
  if (msg.includes('user rejected') || (error as { code?: number })?.code === 4001)
    return 'Transaction cancelled.'
  if (msg.includes('insufficient') || msg.includes('exceeds balance'))
    return 'Insufficient USDC balance.'
  if (msg.includes('reverted')) return 'Transaction reverted. Please try again.'
  if (msg.includes('network') || msg.includes('timeout'))
    return 'Network error. Please retry.'
  return 'Something went wrong. Please try again.'
}

export default function SendPanel() {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')

  const wrongChain = isConnected && chainId !== CHAIN_ID
  const decimals = usdcDecimalsFor(CHAIN_ID)

  const { data: rawBalance } = useReadContract({
    address: usdc.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    chainId: CHAIN_ID,
    query: { enabled: !!address },
  })

  const formattedBalance = rawBalance !== undefined
    ? Amount.fromRaw(rawBalance, decimals).toFixed(2)
    : undefined

  const { writeContract, data: hash, isPending, isError, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const isValidRecipient = recipient.trim() !== '' && isAddress(recipient.trim())
  const isValidAmount = /^\d*\.?\d+$/.test(amount) && parseFloat(amount) > 0
  const canSend = isConnected && !wrongChain && isValidRecipient && isValidAmount && !isPending && !isConfirming

  const handleSend = () => {
    if (wrongChain) { switchChain({ chainId: CHAIN_ID }); return }
    if (!canSend) return
    try {
      const parsed = Amount.parse(amount, decimals)
      if (rawBalance !== undefined && parsed.raw > (rawBalance)) {
        toast.error('Insufficient USDC balance.')
        return
      }
      writeContract({
        address: usdc.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [recipient.trim() as `0x${string}`, parsed.raw],
        chainId: CHAIN_ID,
      })
    } catch {
      toast.error('Invalid amount entered.')
    }
  }

  const txUrl = hash ? buildTxExplorerUrl(CHAIN_ID, hash) : undefined

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center gap-5 py-6 text-center">
        <div
          className="flex size-14 items-center justify-center rounded-full"
          style={{ background: 'rgba(26,128,71,0.12)' }}
        >
          <CheckCircle2 className="size-7" style={{ color: 'var(--success)' }} />
        </div>
        <div>
          <p className="display text-xl font-bold" style={{ color: 'var(--ink)' }}>Payment sent!</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            {amount} USDC to {recipient.slice(0, 6)}...{recipient.slice(-4)}
          </p>
        </div>
        {txUrl && (
          <a
            href={txUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold"
            style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)' }}
          >
            View on ArcScan <ExternalLink className="size-3" />
          </a>
        )}
        <button
          onClick={() => { reset(); setAmount(''); setRecipient(''); setMemo('') }}
          className="mt-1 text-sm font-semibold"
          style={{ color: 'var(--accent-hover)' }}
        >
          Send another
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Amount */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--surface-muted)' }}>
        <label className="mb-1.5 block text-xs font-semibold tracking-wide" style={{ color: 'var(--muted)' }}>
          AMOUNT
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
            className="display w-full bg-transparent text-4xl font-bold tabular-nums outline-none placeholder:text-slate-300"
            style={{ color: 'var(--ink)' }}
          />
          <span className="text-lg font-medium" style={{ color: 'var(--subtle)' }}>USDC</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-1.5">
            {QUICK_AMOUNTS.map((q) => (
              <button
                key={q}
                onClick={() => setAmount(q)}
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
          <button
            disabled={formattedBalance === undefined}
            onClick={() => formattedBalance && setAmount(formattedBalance)}
            className="text-xs font-semibold disabled:opacity-40"
            style={{ color: 'var(--accent-hover)' }}
          >
            {formattedBalance !== undefined ? `Max: $${formattedBalance}` : 'Balance unavailable'}
          </button>
        </div>
      </div>

      {/* Recipient */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--surface-muted)' }}>
        <label className="mb-1.5 block text-xs font-semibold tracking-wide" style={{ color: 'var(--muted)' }}>
          RECIPIENT
        </label>
        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x..."
          className="mono w-full bg-transparent text-sm outline-none placeholder:text-slate-300"
          style={{ color: isValidRecipient || recipient === '' ? 'var(--ink)' : 'var(--danger)' }}
        />
        {recipient !== '' && !isValidRecipient && (
          <p className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>Enter a valid address</p>
        )}
      </div>

      {/* Memo (optional) */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--surface-muted)' }}>
        <label className="mb-1.5 block text-xs font-semibold tracking-wide" style={{ color: 'var(--muted)' }}>
          NOTE (OPTIONAL)
        </label>
        <input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="What's this for?"
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-300"
          style={{ color: 'var(--ink)' }}
        />
      </div>

      {/* Error */}
      {isError && (
        <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: 'rgba(186,43,76,0.08)' }}>
          <XCircle className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--danger)' }} />
          <p className="text-xs" style={{ color: 'var(--danger)' }}>{parseOnchainError(error)}</p>
        </div>
      )}

      {/* CTA */}
      {!isConnected ? (
        <ConnectKitButton.Custom>
          {({ show }) => (
            <button
              onClick={show}
              className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: 'var(--accent)' }}
            >
              Connect Wallet
            </button>
          )}
        </ConnectKitButton.Custom>
      ) : (
        <button
          disabled={!canSend && !wrongChain}
          onClick={handleSend}
          className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: wrongChain ? 'var(--accent-hover)' : 'var(--accent)' }}
        >
          {wrongChain ? (
            'Switch to Arc Testnet'
          ) : isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" /> Confirm in wallet...
            </span>
          ) : isConfirming ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" /> Confirming...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <ArrowUpRight className="size-4" /> Send USDC
            </span>
          )}
        </button>
      )}
    </div>
  )
}
