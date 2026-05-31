// backend/index.js
// RemitArc backend - listens to Arc smart contract events,
// calls Circle Gateway for treasury routing, and relays CCTP
// attestations back on-chain.

require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const { ethers } = require("ethers");
const axios    = require("axios");

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

// -------------------------------------------------------------------------
// Config
// -------------------------------------------------------------------------

const PORT              = process.env.PORT || 3001;
const ARC_RPC_URL       = process.env.ARC_RPC_URL;
const CONTRACT_ADDRESS  = process.env.CONTRACT_ADDRESS;
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY;
const CIRCLE_API_KEY    = process.env.CIRCLE_API_KEY;
const CIRCLE_BASE_URL   = "https://api-sandbox.circle.com/v1";

const CONTRACT_ABI = [
  "event TransferInitiated(uint256 indexed id, address indexed sender, string recipientName, string destinationCountry, uint256 usdcAmount, uint256 feeAmount, uint256 timestamp)",
  "function markSettled(uint256 transferId, bytes32 cctpMessageHash) external",
  "function getTransfer(uint256 id) external view returns (tuple(address sender, string recipientName, string destinationCountry, uint256 usdcAmount, uint256 feeAmount, uint256 timestamp, bytes32 cctpMessageHash, bool settled))",
  "function transferCount() external view returns (uint256)",
  "function totalVolume() external view returns (uint256)",
];

// -------------------------------------------------------------------------
// Provider + signer
// -------------------------------------------------------------------------

const provider = new ethers.JsonRpcProvider(ARC_RPC_URL);
const signer   = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

// -------------------------------------------------------------------------
// Circle API helpers
// -------------------------------------------------------------------------

const circleHeaders = {
  "Authorization": `Bearer ${CIRCLE_API_KEY}`,
  "Content-Type":  "application/json",
};

/**
 * Create a Circle wallet for a new user (embedded wallet UX).
 * Called when a user signs up on the frontend.
 */
async function createCircleWallet(userId) {
  const resp = await axios.post(
    `${CIRCLE_BASE_URL}/w3s/users`,
    { userId },
    { headers: circleHeaders }
  );
  return resp.data;
}

/**
 * Initiate a USDC payout via Circle Gateway (treasury routing).
 * Called after the smart contract emits TransferInitiated.
 */
async function gatewayPayout({ destinationAddress, usdcAmount, country }) {
  const resp = await axios.post(
    `${CIRCLE_BASE_URL}/payouts`,
    {
      idempotencyKey: `remitarc-${Date.now()}-${Math.random()}`,
      source:         { type: "wallet", id: process.env.TREASURY_WALLET_ID },
      destination: {
        type:    "blockchain",
        address: destinationAddress,
        chain:   "ARC",
      },
      amount: {
        amount:   (usdcAmount / 1e6).toFixed(2),
        currency: "USD",
      },
      metadata: { country },
    },
    { headers: circleHeaders }
  );
  return resp.data;
}

/**
 * Trigger CCTP transfer for cross-chain USDC movement.
 * Circle's CCTP burns USDC on Arc and mints on destination chain.
 */
async function cctpTransfer({ amount, destinationChain, destinationAddress }) {
  const resp = await axios.post(
    `${CIRCLE_BASE_URL}/transfers`,
    {
      idempotencyKey:   `cctp-${Date.now()}-${Math.random()}`,
      source:           { type: "wallet", id: process.env.TREASURY_WALLET_ID },
      destination:      { type: "blockchain", address: destinationAddress, chain: destinationChain },
      amount:           { amount: (amount / 1e6).toFixed(2), currency: "USD" },
      feeLevel:         "MEDIUM",
    },
    { headers: circleHeaders }
  );
  return resp.data;
}

// -------------------------------------------------------------------------
// Country -> destination chain mapping (CCTP supported chains)
// -------------------------------------------------------------------------

const COUNTRY_CHAIN = {
  US: "ETH",
  GB: "ETH",
  IN: "MATIC",
  PH: "MATIC",
  PK: "MATIC",
  EG: "MATIC",
};

// -------------------------------------------------------------------------
// Event listener: auto-relay transfers
// -------------------------------------------------------------------------

async function startEventListener() {
  console.log("Listening for TransferInitiated events on Arc...");

  contract.on("TransferInitiated", async (
    id, sender, recipientName, destinationCountry, usdcAmount, feeAmount, timestamp
  ) => {
    console.log(`\nTransfer #${id} detected`);
    console.log(`  Sender:     ${sender}`);
    console.log(`  Recipient:  ${recipientName}`);
    console.log(`  Country:    ${destinationCountry}`);
    console.log(`  USDC:       ${(Number(usdcAmount) / 1e6).toFixed(2)}`);

    try {
      const destChain = COUNTRY_CHAIN[destinationCountry] || "ETH";

      // 1. Route via Circle Gateway (treasury movement)
      const payout = await gatewayPayout({
        destinationAddress: sender,
        usdcAmount:         Number(usdcAmount),
        country:            destinationCountry,
      });
      console.log("  Gateway payout id:", payout.data?.id);

      // 2. CCTP cross-chain transfer if needed
      let cctpHash = ethers.ZeroHash;
      if (destChain !== "ARC") {
        const cctp = await cctpTransfer({
          amount:             Number(usdcAmount),
          destinationChain:   destChain,
          destinationAddress: sender,
        });
        cctpHash = cctp.data?.transactionHash || ethers.ZeroHash;
        console.log("  CCTP tx hash:", cctpHash);
      }

      // 3. Mark settled on-chain with CCTP message hash
      const tx = await contract.markSettled(id, cctpHash);
      await tx.wait();
      console.log(`  Transfer #${id} marked settled. Tx: ${tx.hash}`);

    } catch (err) {
      console.error(`  Error processing transfer #${id}:`, err.message);
    }
  });
}

// -------------------------------------------------------------------------
// REST API
// -------------------------------------------------------------------------

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", contract: CONTRACT_ADDRESS, network: "arc_testnet" });
});

// Create embedded wallet for user
app.post("/api/wallet/create", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const result = await createCircleWallet(userId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get on-chain transfer by ID
app.get("/api/transfer/:id", async (req, res) => {
  try {
    const t = await contract.getTransfer(req.params.id);
    res.json({
      id:                  req.params.id,
      sender:              t.sender,
      recipientName:       t.recipientName,
      destinationCountry:  t.destinationCountry,
      usdcAmount:          (Number(t.usdcAmount) / 1e6).toFixed(2),
      feeAmount:           (Number(t.feeAmount) / 1e6).toFixed(2),
      timestamp:           new Date(Number(t.timestamp) * 1000).toISOString(),
      cctpMessageHash:     t.cctpMessageHash,
      settled:             t.settled,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Contract stats
app.get("/api/stats", async (req, res) => {
  try {
    const [count, volume] = await Promise.all([
      contract.transferCount(),
      contract.totalVolume(),
    ]);
    res.json({
      transferCount: Number(count),
      totalVolumeUSDC: (Number(volume) / 1e6).toFixed(2),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/fx/rates", async (req, res) => {
  try {
    const response = await fetch("https://latest.currency-api.pages.dev/v1/currencies/usd.json");
    const data     = await response.json();
    res.json({ rates: data.usd, source: "ECB via currency-api.pages.dev" });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch rates" });
  }
});

// -------------------------------------------------------------------------
// Start
// -------------------------------------------------------------------------

app.listen(PORT, async () => {
  console.log(`RemitArc backend running on port ${PORT}`);
  if (CONTRACT_ADDRESS && OWNER_PRIVATE_KEY) {
    await startEventListener();
  } else {
    console.warn("CONTRACT_ADDRESS or OWNER_PRIVATE_KEY not set — event listener disabled.");
  }
});
