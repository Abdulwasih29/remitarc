require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const { ethers } = require("ethers");
const axios   = require("axios");

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

// ── Config ───────────────────────────────────────────────────────────────────

const PORT              = process.env.PORT || 3001;
const ARC_RPC_URL       = process.env.ARC_RPC_URL;
const CONTRACT_ADDRESS  = process.env.CONTRACT_ADDRESS;
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY;
const CIRCLE_API_KEY    = process.env.CIRCLE_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CIRCLE_BASE_URL   = "https://api-sandbox.circle.com/v1";

const CONTRACT_ABI = [
  "event TransferInitiated(uint256 indexed id, address indexed sender, string recipientName, string destinationCountry, uint256 usdcAmount, uint256 feeAmount, uint256 timestamp)",
  "function markSettled(uint256 transferId, bytes32 cctpMessageHash) external",
  "function getTransfer(uint256 id) external view returns (tuple(address sender, string recipientName, string destinationCountry, uint256 usdcAmount, uint256 feeAmount, uint256 timestamp, bytes32 cctpMessageHash, bool settled))",
  "function transferCount() external view returns (uint256)",
  "function totalVolume() external view returns (uint256)",
];

// ── Circle helpers ───────────────────────────────────────────────────────────

const circleHeaders = {
  "Authorization": `Bearer ${CIRCLE_API_KEY}`,
  "Content-Type":  "application/json",
};

async function gatewayPayout({ destinationAddress, usdcAmount, country }) {
  const resp = await axios.post(
    `${CIRCLE_BASE_URL}/payouts`,
    {
      idempotencyKey: `remitarc-${Date.now()}-${Math.random()}`,
      source:      { type:"wallet", id: process.env.TREASURY_WALLET_ID },
      destination: { type:"blockchain", address:destinationAddress, chain:"ARC" },
      amount:      { amount:(usdcAmount/1e6).toFixed(2), currency:"USD" },
      metadata:    { country },
    },
    { headers: circleHeaders }
  );
  return resp.data;
}

async function cctpTransfer({ amount, destinationChain, destinationAddress }) {
  const resp = await axios.post(
    `${CIRCLE_BASE_URL}/transfers`,
    {
      idempotencyKey: `cctp-${Date.now()}-${Math.random()}`,
      source:      { type:"wallet", id: process.env.TREASURY_WALLET_ID },
      destination: { type:"blockchain", address:destinationAddress, chain:destinationChain },
      amount:      { amount:(amount/1e6).toFixed(2), currency:"USD" },
      feeLevel:    "MEDIUM",
    },
    { headers: circleHeaders }
  );
  return resp.data;
}

const COUNTRY_CHAIN = {
  US:"ETH", GB:"ETH", IN:"MATIC", PH:"MATIC",
  PK:"MATIC", EG:"MATIC", NG:"MATIC", GH:"MATIC",
  KE:"MATIC", MX:"ETH", BR:"ETH", BD:"MATIC",
};

// ── Arc event listener ───────────────────────────────────────────────────────

async function startEventListener() {
  if (!ARC_RPC_URL || !CONTRACT_ADDRESS || !OWNER_PRIVATE_KEY) {
    console.warn("Arc event listener disabled -- missing env vars.");
    return;
  }
  const provider = new ethers.JsonRpcProvider(ARC_RPC_URL);
  const signer   = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  console.log("Listening for TransferInitiated events on Arc...");

  contract.on("TransferInitiated", async (id, sender, recipientName, destinationCountry, usdcAmount, feeAmount, timestamp) => {
    console.log(`Transfer #${id} -- ${recipientName} -- ${destinationCountry} -- ${(Number(usdcAmount)/1e6).toFixed(2)} USDC`);
    try {
      const destChain = COUNTRY_CHAIN[destinationCountry] || "ETH";
      await gatewayPayout({ destinationAddress:sender, usdcAmount:Number(usdcAmount), country:destinationCountry });
      let cctpHash = ethers.ZeroHash;
      if (destChain !== "ARC") {
        const cctp = await cctpTransfer({ amount:Number(usdcAmount), destinationChain:destChain, destinationAddress:sender });
        cctpHash   = cctp.data?.transactionHash || ethers.ZeroHash;
      }
      const tx = await contract.markSettled(id, cctpHash);
      await tx.wait();
      console.log(`Transfer #${id} settled. Tx: ${tx.hash}`);
    } catch (err) {
      console.error(`Transfer #${id} error:`, err.message);
    }
  });
}

// ── REST endpoints ───────────────────────────────────────────────────────────

app.get("/health", (req, res) => {
  res.json({ status:"ok", contract:CONTRACT_ADDRESS, network:"arc_testnet" });
});

app.post("/api/wallet/create", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error:"userId required" });
    const resp = await axios.post(`${CIRCLE_BASE_URL}/w3s/users`, { userId }, { headers:circleHeaders });
    res.json({ success:true, data:resp.data });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.get("/api/transfer/:id", async (req, res) => {
  try {
    const provider = new ethers.JsonRpcProvider(ARC_RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const t        = await contract.getTransfer(req.params.id);
    res.json({
      id:                 req.params.id,
      sender:             t.sender,
      recipientName:      t.recipientName,
      destinationCountry: t.destinationCountry,
      usdcAmount:         (Number(t.usdcAmount)/1e6).toFixed(2),
      feeAmount:          (Number(t.feeAmount) /1e6).toFixed(2),
      timestamp:          new Date(Number(t.timestamp)*1000).toISOString(),
      cctpMessageHash:    t.cctpMessageHash,
      settled:            t.settled,
    });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.get("/api/stats", async (req, res) => {
  try {
    const provider = new ethers.JsonRpcProvider(ARC_RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const [count, vol] = await Promise.all([contract.transferCount(), contract.totalVolume()]);
    res.json({ transferCount:Number(count), totalVolumeUSDC:(Number(vol)/1e6).toFixed(2) });
  } catch (err) { res.status(500).json({ error:err.message }); }
});

app.get("/api/fx/rates", async (req, res) => {
  try {
    const response = await axios.get("https://latest.currency-api.pages.dev/v1/currencies/usd.json");
    res.json({ rates:response.data?.usd, source:"ECB via currency-api.pages.dev" });
  } catch (err) { res.status(500).json({ error:"Failed to fetch rates" }); }
});

// ── AI FX Agent ──────────────────────────────────────────────────────────────

app.post("/api/agent", async (req, res) => {
  try {
    const { messages, usdcBalance, account, rates } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error:"messages array required" });
    }

    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error:"ANTHROPIC_API_KEY not set in backend .env" });
    }

    // Fetch live rates server-side
    let liveRates = rates || {};
    try {
      const ratesRes = await axios.get("https://latest.currency-api.pages.dev/v1/currencies/usd.json");
      liveRates      = ratesRes.data?.usd || {};
    } catch (e) {
      console.warn("Rate fetch failed, using client rates");
    }

    const CORRIDORS = [
      { code:"NGN", name:"Nigeria"     },
      { code:"INR", name:"India"       },
      { code:"PHP", name:"Philippines" },
      { code:"PKR", name:"Pakistan"    },
      { code:"KES", name:"Kenya"       },
      { code:"GHS", name:"Ghana"       },
      { code:"EGP", name:"Egypt"       },
      { code:"GBP", name:"UK"          },
      { code:"EUR", name:"Euro"        },
      { code:"MXN", name:"Mexico"      },
      { code:"BRL", name:"Brazil"      },
      { code:"BDT", name:"Bangladesh"  },
      { code:"AED", name:"UAE"         },
      { code:"JPY", name:"Japan"       },
      { code:"CNY", name:"China"       },
    ];

    const rateLines = CORRIDORS.map(c => {
      const rate = liveRates[c.code.toLowerCase()];
      return rate
        ? `${c.name} (${c.code}): 1 USDC = ${rate.toLocaleString("en-US",{maximumFractionDigits:4})} ${c.code}`
        : `${c.name} (${c.code}): rate unavailable`;
    }).join("\n");

    const systemPrompt = `You are RemitArc's FX agent. You help users understand exchange rates, compare corridors, calculate conversions, and find the best way to send USDC globally.

RemitArc fee: flat 0.30% (30 bps) on every transfer. Settlement is instant on Arc testnet.

User wallet: ${account || "not connected"}
User USDC balance: ${parseFloat(usdcBalance || 0).toFixed(2)} USDC

Live exchange rates (ECB source, 1 USDC = 1 USD):
${rateLines}

Conversion formula:
- Fee = amount x 0.003
- Total deducted = amount + fee
- Local received = amount x local rate

Rules:
- Always use the live rates above for calculations
- Show exact numbers -- never say "approximately" when you have the rate
- Include fee breakdown in every conversion calculation
- Recommend the corridor giving the most local currency when asked
- Be concise and direct`;

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model:      "claude-sonnet-4-20250514",
        max_tokens: 600,
        system:     systemPrompt,
        messages:   messages.map(m => ({
          role:    m.role === "assistant" ? "assistant" : "user",
          content: m.text,
        })),
      },
      {
        headers: {
          "x-api-key":         ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type":      "application/json",
        },
      }
    );

    const reply = response.data?.content?.[0]?.text || "No response.";
    res.json({ reply });

  } catch (err) {
    console.error("Agent error:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

// ── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, async () => {
  console.log(`RemitArc backend running on port ${PORT}`);
  await startEventListener();
});
