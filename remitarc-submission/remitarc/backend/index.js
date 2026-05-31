// ── Agent endpoint ───────────────────────────────────────────────────────────
// Replace the existing app.post("/api/agent") block in backend/index.js

app.post("/api/agent", async (req, res) => {
  try {
    const { messages, usdcBalance, account, rates } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array required" });
    }

    // Fetch live rates server-side (most accurate)
    let liveRates = rates || {};
    try {
      const ratesRes = await axios.get("https://latest.currency-api.pages.dev/v1/currencies/usd.json");
      liveRates      = ratesRes.data?.usd || {};
    } catch (e) {
      console.warn("Rate fetch failed, using client rates");
    }

    const CORRIDORS = [
      { code:"NGN", name:"Nigeria"      },
      { code:"INR", name:"India"        },
      { code:"PHP", name:"Philippines"  },
      { code:"PKR", name:"Pakistan"     },
      { code:"KES", name:"Kenya"        },
      { code:"GHS", name:"Ghana"        },
      { code:"EGP", name:"Egypt"        },
      { code:"GBP", name:"UK"           },
      { code:"EUR", name:"Euro"         },
      { code:"MXN", name:"Mexico"       },
      { code:"BRL", name:"Brazil"       },
      { code:"BDT", name:"Bangladesh"   },
      { code:"AED", name:"UAE"          },
      { code:"JPY", name:"Japan"        },
      { code:"CNY", name:"China"        },
    ];

    const rateLines = CORRIDORS.map(c => {
      const rate = liveRates[c.code.toLowerCase()];
      return rate
        ? `${c.name} (${c.code}): 1 USDC = ${rate.toLocaleString("en-US",{maximumFractionDigits:4})} ${c.code}`
        : `${c.name} (${c.code}): rate unavailable`;
    }).join("\n");

    const FEE_BPS = 30; // 0.30%

    const systemPrompt = `You are RemitArc's FX agent. You help users understand exchange rates, compare corridors, calculate conversion amounts, and find the best way to send USDC globally.

RemitArc charges a flat 0.30% fee (30 bps) on every transfer. Settlement is instant on Arc testnet.

User wallet: ${account || "not connected"}
User USDC balance: ${parseFloat(usdcBalance || 0).toFixed(2)} USDC

Live exchange rates (ECB source via currency-api.pages.dev, 1 USDC = 1 USD):
${rateLines}

How to calculate a transfer:
- USDC amount = send amount in USD
- Fee = USDC amount x 0.0030 (0.30%)
- Total deducted = USDC amount + fee
- Local currency received = USDC amount x local rate

Example: Send $500 to Nigeria
- USDC: 500
- Fee: 500 x 0.003 = 1.50 USDC
- Total: 501.50 USDC
- NGN received: 500 x ${liveRates.ngn?.toFixed(2) || "N/A"} = ${liveRates.ngn ? (500 * liveRates.ngn).toLocaleString("en-US",{maximumFractionDigits:0}) : "N/A"} NGN

Your job:
- Answer conversion questions with exact numbers using the live rates above
- Compare corridors clearly when asked
- Explain fees honestly
- Recommend the corridor that gives the most local currency when asked
- Warn if a rate seems unusual
- Be specific and concise -- no filler text`;

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
          "x-api-key":         process.env.ANTHROPIC_API_KEY,
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
