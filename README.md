# ArcPay

A USDC payment app running on Arc Testnet. Send USDC, create shareable payment request links, and browse your recent transfer history from a single mobile-friendly interface.

Built with [Arc Studio](https://studio.arc.io)

## Demo

Watch the walkthrough: [ArcPay demo on YouTube](https://youtu.be/OtvDTh8PONk)

Live app: https://imaginative-toffee-b20ac4.netlify.app

## Features

- **Send**: transfer USDC to any address with quick-amount chips, a Max button, and live transaction status.
- **Request**: create a payment link with an optional amount and note. Anyone who opens it lands on the Send screen with the details pre-filled.
- **Activity**: see your most recent USDC transfers in and out of your wallet, each linked to the block explorer.
- **Balance**: your live USDC balance on Arc Testnet is always shown at the top.

## Tech Stack

- React, TypeScript, Vite
- wagmi and ConnectKit for wallet connection
- viem for onchain reads and writes
- Tailwind CSS and Framer Motion for the interface
- Arc Testnet, where USDC is also the gas token (no other token needed for fees)

## Development

### Prerequisites

- [Bun](https://bun.sh)
- A browser wallet (MetaMask, Coinbase Wallet, or any injected wallet)

### Install

```bash
bun install
```

### Environment variables

None.

### Run

```bash
bun run dev
```

### Build

```bash
bunx vite build
```

The production build is written to `dist/` and can be hosted on any static host.

### Lint and typecheck

```bash
bun run check
```

## Trying it out

1. Open the app and connect a wallet on Arc Testnet.
2. Get test USDC for your wallet. Inside Arc Studio, use the **Get test USDC** button in the sidebar.
3. Use **Send** to transfer USDC, or **Request** to create a payment link to share.

Arc Testnet uses test funds only. No real money is involved.
