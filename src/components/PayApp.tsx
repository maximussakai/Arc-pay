import { useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { arcTestnet } from 'viem/chains'
import { ConnectKitButton } from 'connectkit'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Link2, Clock, Wallet } from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'
import { getUsdc, buildAddressExplorerUrl } from '@/onchain-facts'
import { Amount, usdcDecimalsFor } from '@/onchain-money'
import SendPanel from './SendPanel'
import RequestPanel from './RequestPanel'
import ActivityPanel from './ActivityPanel'

const CHAIN_ID = arcTestnet.id
const usdc = getUsdc(CHAIN_ID)!
const DECIMALS = usdcDecimalsFor(CHAIN_ID)

type Tab = 'send' | 'request' | 'activity'

const TABS: { id: Tab; label: string; Icon: typeof ArrowUpRight }[] = [
  { id: 'send', label: 'Send', Icon: ArrowUpRight },
  { id: 'request', label: 'Request', Icon: Link2 },
  { id: 'activity', label: 'Activity', Icon: Clock },
]

// Parse URL params for pre-filled payment link
function parsePrefill() {
  const params = new URLSearchParams(window.location.search)
  const to = params.get('to')
  const amount = params.get('amount')
  const memo = params.get('memo')
  if (to) return { to, amount: amount ?? '', memo: memo ?? '' }
  return null
}

export default function PayApp() {
  const { address, isConnected } = useAccount()
  const prefill = parsePrefill()
  const [tab, setTab] = useState<Tab>('send')

  const { data: rawBalance } = useReadContract({
    address: usdc.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    chainId: CHAIN_ID,
    query: { enabled: !!address },
  })

  const formattedBalance = rawBalance !== undefined
    ? Amount.fromRaw(rawBalance, DECIMALS).toFixed(2)
    : undefined

  return (
    <div
      className="flex min-h-dvh flex-col items-center px-4 py-8"
      style={{ background: 'var(--bg-gradient)' }}
    >
      <div className="w-full max-w-md">

        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex size-8 items-center justify-center rounded-xl"
              style={{ background: 'var(--accent)' }}
            >
              <Wallet className="size-4 text-white" />
            </div>
            <span className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>ArcPay</span>
          </div>
          <ConnectKitButton.Custom>
            {({ isConnected: ck, show, address: addr, truncatedAddress }) => (
              <button
                onClick={show}
                className="flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--ink)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {ck ? (
                  <>
                    <span
                      className="size-2 rounded-full"
                      style={{ background: 'var(--success)' }}
                    />
                    <span className="mono text-xs">{truncatedAddress ?? (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '')}</span>
                  </>
                ) : (
                  'Connect Wallet'
                )}
              </button>
            )}
          </ConnectKitButton.Custom>
        </header>

        {/* Hero Balance Card */}
        <section
          className="mb-5 rounded-3xl p-6"
          style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 24px rgba(18,45,69,0.07)',
          }}
        >
          {/* Spectral strip */}
          <div
            className="absolute left-0 right-0 top-0 h-1 rounded-t-3xl"
            style={{ position: 'relative', marginTop: -24, marginLeft: -24, marginRight: -24, marginBottom: 16, height: 3, borderRadius: '12px 12px 0 0',
              background: 'linear-gradient(90deg, #a78bfa, #60a5fa, #34d399, #fbbf24, #f87171)',
            }}
          />
          <div className="mt-2 flex items-center gap-2 mb-3">
            <TokenUSDC variant="branded" size={20} />
            <span className="text-xs font-semibold tracking-wide" style={{ color: 'var(--muted)' }}>
              USDC BALANCE · ARC TESTNET
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            {isConnected ? (
              <>
                <span className="display text-5xl font-bold tabular-nums" style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}>
                  {formattedBalance !== undefined ? `$${formattedBalance}` : '...'}
                </span>
                <span className="text-xl font-medium" style={{ color: 'var(--subtle)' }}>USDC</span>
              </>
            ) : (
              <span className="display text-5xl font-bold" style={{ color: 'var(--subtle)', letterSpacing: '-0.03em' }}>
                —
              </span>
            )}
          </div>
          <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
            {isConnected && address
              ? <a
                  href={buildAddressExplorerUrl(CHAIN_ID, address)}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  {address.slice(0, 10)}...{address.slice(-6)} ↗
                </a>
              : 'Connect your wallet to view live balance'}
          </p>

          {!isConnected && (
            <div className="mt-4 rounded-2xl p-3 text-xs text-center" style={{ background: 'var(--surface-muted)' }}>
              <span style={{ color: 'var(--muted)' }}>
                Use the "Get test USDC" button in the sidebar to fund your wallet with Arc Testnet USDC.
              </span>
            </div>
          )}
        </section>

        {/* Prefill notice */}
        {prefill && (
          <div
            className="mb-4 rounded-2xl p-3 text-sm"
            style={{ background: 'rgba(26,128,71,0.08)', color: 'var(--success)' }}
          >
            Payment request pre-filled: {prefill.amount ? `$${prefill.amount} USDC` : 'amount unspecified'}
            {prefill.memo ? ` · "${prefill.memo}"` : ''}
          </div>
        )}

        {/* Tab bar */}
        <div
          className="mb-4 flex rounded-2xl p-1"
          style={{ background: 'var(--surface-muted)', gap: 2 }}
        >
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all"
              style={{
                background: tab === id ? '#fff' : 'transparent',
                color: tab === id ? 'var(--ink)' : 'var(--subtle)',
                boxShadow: tab === id ? '0 1px 6px rgba(18,45,69,0.10)' : 'none',
              }}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="rounded-3xl p-5"
            style={{
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 24px rgba(18,45,69,0.07)',
            }}
          >
            {tab === 'send' && <SendPanel />}
            {tab === 'request' && <RequestPanel />}
            {tab === 'activity' && <ActivityPanel />}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <p className="mt-6 text-center text-xs" style={{ color: 'var(--subtle)' }}>
          Arc Testnet · USDC is the native gas token · No real funds
        </p>
      </div>
    </div>
  )
}
