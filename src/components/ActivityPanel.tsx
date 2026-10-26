import { useAccount, useReadContract, usePublicClient } from 'wagmi'
import { erc20Abi, parseAbiItem } from 'viem'
import { arcTestnet } from 'viem/chains'
import { useEffect, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, RefreshCw, ExternalLink } from 'lucide-react'
import { ConnectKitButton } from 'connectkit'
import { getUsdc, buildTxExplorerUrl } from '@/onchain-facts'
import { Amount, usdcDecimalsFor } from '@/onchain-money'

const CHAIN_ID = arcTestnet.id
const usdc = getUsdc(CHAIN_ID)!
const DECIMALS = usdcDecimalsFor(CHAIN_ID)

interface TxEvent {
  hash: `0x${string}`
  direction: 'in' | 'out'
  from: string
  to: string
  amount: string
  blockNumber: bigint
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function ActivityPanel() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient({ chainId: CHAIN_ID })
  const [events, setEvents] = useState<TxEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const { data: rawBalance } = useReadContract({
    address: usdc.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    chainId: CHAIN_ID,
    query: { enabled: !!address },
  })

  useEffect(() => {
    if (!address || !publicClient) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const head = await publicClient.getBlockNumber()
        const from = head > 5000n ? head - 5000n : 0n

        const [sent, received] = await Promise.all([
          publicClient.getLogs({
            address: usdc.address as `0x${string}`,
            event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
            args: { from: address },
            fromBlock: from,
            toBlock: head,
          }),
          publicClient.getLogs({
            address: usdc.address as `0x${string}`,
            event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
            args: { to: address },
            fromBlock: from,
            toBlock: head,
          }),
        ])

        if (cancelled) return

        const mapLog = (log: typeof sent[number], direction: 'in' | 'out') => ({
            hash: log.transactionHash ?? null,
            direction,
            from: log.args.from ?? '',
            to: log.args.to ?? '',
            amount: Amount.fromRaw(log.args.value ?? 0n, DECIMALS).toFixed(2),
            blockNumber: log.blockNumber ?? 0n,
          })

        const all: TxEvent[] = [
          ...sent.map((log) => mapLog(log, 'out')),
          ...received.map((log) => mapLog(log, 'in')),
        ]
          .filter((e): e is TxEvent => e.hash !== null)
          .sort((a, b) => (a.blockNumber > b.blockNumber ? -1 : 1))
          .slice(0, 20)

        setEvents(all)
      } catch {
        // silently handle RPC errors
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [address, publicClient, refreshKey])

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div
          className="flex size-14 items-center justify-center rounded-full"
          style={{ background: 'var(--surface-muted)' }}
        >
          <ArrowDownLeft className="size-6" style={{ color: 'var(--muted)' }} />
        </div>
        <div>
          <p className="font-semibold" style={{ color: 'var(--ink)' }}>Connect to see activity</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Recent USDC transfers will appear here.
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

  const formattedBalance = rawBalance !== undefined
    ? Amount.fromRaw(rawBalance, DECIMALS).toFixed(2)
    : undefined

  return (
    <div className="flex flex-col gap-4">
      {/* Balance summary */}
      <div
        className="flex items-center justify-between rounded-2xl p-4"
        style={{ background: 'var(--surface-muted)' }}
      >
        <div>
          <p className="text-xs font-semibold tracking-wide" style={{ color: 'var(--muted)' }}>
            USDC BALANCE
          </p>
          <p className="display mt-0.5 text-2xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
            {formattedBalance !== undefined ? `$${formattedBalance}` : '...'}
          </p>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="rounded-xl p-2.5 transition-all hover:scale-105 active:scale-95"
          style={{ background: 'var(--surface)' }}
          aria-label="Refresh activity"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} style={{ color: 'var(--ink-2)' }} />
        </button>
      </div>

      {/* Events list */}
      {loading && events.length === 0 ? (
        <div className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>Loading recent transfers...</div>
      ) : events.length === 0 ? (
        <div className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
          No USDC transfers found in the last 5,000 blocks.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-wide" style={{ color: 'var(--muted)' }}>
            RECENT TRANSFERS
          </p>
          {events.map((ev) => {
            const txUrl = buildTxExplorerUrl(CHAIN_ID, ev.hash)
            const isIn = ev.direction === 'in'
            return (
              <a
                key={ev.hash}
                href={txUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl p-3.5 transition-all hover:scale-[1.01]"
                style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
              >
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: isIn ? 'rgba(26,128,71,0.12)' : 'rgba(186,43,76,0.10)' }}
                >
                  {isIn
                    ? <ArrowDownLeft className="size-4" style={{ color: 'var(--success)' }} />
                    : <ArrowUpRight className="size-4" style={{ color: 'var(--danger)' }} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                    {isIn ? 'Received' : 'Sent'}
                  </p>
                  <p className="mono truncate text-xs" style={{ color: 'var(--muted)' }}>
                    {isIn ? `from ${shortAddr(ev.from)}` : `to ${shortAddr(ev.to)}`}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="display text-sm font-bold tabular-nums"
                    style={{ color: isIn ? 'var(--success)' : 'var(--ink)' }}
                  >
                    {isIn ? '+' : '-'}${ev.amount}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--subtle)' }}>USDC</p>
                </div>
                <ExternalLink className="size-3.5 shrink-0" style={{ color: 'var(--subtle)' }} />
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
