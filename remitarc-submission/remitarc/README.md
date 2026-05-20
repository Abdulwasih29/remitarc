# RemitArc

**Track 1 — Best Cross-Border Payments and Remittances Experience (UAE to Global)**

RemitArc is a stablecoin-powered remittance application built on Circle's Arc L1. It lets UAE residents send money cross-border in seconds, with transparent fees, real-time finality, and an on-chain receipt for every transfer. The UX requires no crypto knowledge — users think in AED, and the app handles everything else.

---

## Architecture

```
UAE User (AED input)
       |
       v
Circle Embedded Wallet  <-- custodial, no seed phrase UX
       |
       v
RemitArc Smart Contract (Arc L1)
  - Pulls USDC from sender
  - Deducts fee (30 bps default)
  - Emits TransferInitiated event
       |
       v
RemitArc Backend (Node.js)
  - Listens to contract events
  - Routes through Circle Gateway (treasury movement)
  - Triggers CCTP Bridge Kit for cross-chain USDC
       |
       v
Recipient receives USDC (or local currency via off-ramp)
```

**Circle products used:**

| Product | Role |
|---------|------|
| USDC on Arc | Primary settlement rail |
| Circle Embedded Wallets | User wallet abstraction (no seed phrase) |
| Circle Gateway | Treasury routing and off-ramp orchestration |
| CCTP with Bridge Kit | Cross-chain USDC movement to destination chain |

---

## Project Structure

```
remitarc/
  contracts/
    RemitArc.sol           -- Main settlement contract
    hardhat.config.js      -- Arc testnet Hardhat config
    scripts/deploy.js      -- Deployment script
  backend/
    index.js               -- Express + Arc event listener + Circle API relay
    package.json
    .env.example
  frontend/
    src/
      App.jsx              -- Root app with wallet connection
      components/
        Dashboard.jsx      -- Balance, stats, recent transfers
        SendFlow.jsx       -- 3-step remittance wizard
        History.jsx        -- Full transaction history
        Architecture.jsx   -- System architecture view
    package.json
    .env.example
```

---

## Setup and Running

### 1. Deploy the smart contract

```bash
cd contracts
npm install
cp .env.example .env       # fill in USDC_ADDRESS, DEPLOYER_PRIVATE_KEY
npx hardhat run scripts/deploy.js --network arc_testnet
```

Save the deployed contract address.

### 2. Start the backend

```bash
cd backend
npm install
cp .env.example .env       # fill in CONTRACT_ADDRESS, CIRCLE_API_KEY, etc.
npm start
```

The backend:
- Exposes REST endpoints at http://localhost:3001
- Listens for `TransferInitiated` events on Arc
- Calls Circle Gateway for treasury routing
- Calls CCTP for cross-chain transfers
- Calls `markSettled` on-chain with the CCTP attestation hash

### 3. Start the frontend

```bash
cd frontend
npm install
cp .env.example .env       # fill in CONTRACT_ADDRESS, USDC_ADDRESS
npm run dev
```

Open http://localhost:5173, connect MetaMask (Arc testnet), and send a transfer.

---

## Key flows

### Sending a remittance
1. User selects destination corridor (India, Philippines, Pakistan, Egypt, UK, USA)
2. User enters AED amount and recipient name
3. App calculates USDC equivalent (AED × 0.272) and fee (30 bps)
4. User confirms — frontend calls `usdc.approve()` then `contract.initiateTransfer()`
5. Backend picks up the event, routes via Circle Gateway, triggers CCTP
6. Backend calls `markSettled()` with CCTP message hash
7. User sees confirmation with on-chain receipt

### Fee model
- 30 bps (0.30%) of USDC amount
- Paid in USDC to a configurable `feeRecipient` address
- Adjustable by owner (max 200 bps hard cap)

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| POST | /api/wallet/create | Create Circle embedded wallet for user |
| GET | /api/transfer/:id | Fetch on-chain transfer by ID |
| GET | /api/stats | Contract stats (count, volume) |
| GET | /api/fx/aed-to-usdc?amount=500 | FX rate proxy |

---

## Arc testnet resources

- RPC: https://rpc.arc-testnet.circle.com
- Chain ID: 2911
- Explorer: https://explorer.arc-testnet.circle.com
- Faucet: https://faucet.arc-testnet.circle.com
- USDC address: see Circle Arc docs

---

## Circle Product Feedback

See [CIRCLE_FEEDBACK.md](./CIRCLE_FEEDBACK.md)

---

## License

MIT
