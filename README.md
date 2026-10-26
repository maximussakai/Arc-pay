# ArcPay

A full-stack USDC payment app running on Arc Testnet. Send USDC, generate shareable payment request links, and browse your recent transfer history — all from a single mobile-friendly interface.

Built with [Arc Studio](https://studio.arc.io)

## Tech Stack

- React + TypeScript + Vite
- wagmi v2 + ConnectKit (wallet connection)
- viem (onchain reads and writes)
- Framer Motion (tab transitions, sheet animations)
- Tailwind CSS (Arc Light design tokens)
- Arc Testnet (USDC is the native gas token — no ETH needed)

## Features

- **Send**: transfer USDC to any address with quick-amount chips, a Max button, and real-time transaction state
- **Request**: generate a shareable payment link pre-filled with amount and memo; recipients open the link and pay in one click
- **Activity**: live feed of the last 20 USDC transfers to/from your wallet, linked to ArcScan

## Development

### Prerequisites

- [Bun](https://bun.sh) runtime
- A browser wallet (MetaMask, Coinbase Wallet, or any injected provider)

### Install

```bash
bun install
```

### Environment Variables

| Variable | Purpose |
|---|---|
| `RPC_PROXY_BASE_URL` | Arc Studio RPC proxy base URL (optional outside Arc Studio) |
| `RPC_PROXY_TOKEN` | Arc Studio RPC proxy token (optional outside Arc Studio) |
| `RPC_PROXY_CHAINS` | Comma-separated proxy-enabled chain keys (optional outside Arc Studio) |

### Run

```bash
bun run dev
```

### Build

```bash
bun run build
```

### Test & Lint

```bash
bun run check
```

## Testing

1. Connect a wallet in the preview.
2. Use the **Get test USDC** button in the Arc Studio sidebar to fund your wallet with Arc Testnet USDC.
3. Use the Send tab to transfer USDC to another address, or the Request tab to generate a payment link.

Arc Testnet uses no real funds. The USDC here is testnet-only.
