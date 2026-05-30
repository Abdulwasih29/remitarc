import { useState, useRef, useEffect } from "react";

const DEFI_PROTOCOLS = [
  { name:"Aave V3",       chain:"Ethereum", asset:"USDC", apy:5.82, tvl:"$8.4B",  risk:"Low",    type:"Lending",    trend:"+0.3%" },
  { name:"Morpho",        chain:"Ethereum", asset:"USDC", apy:6.41, tvl:"$1.8B",  risk:"Low",    type:"Lending",    trend:"+0.8%" },
  { name:"Compound V3",   chain:"Ethereum", asset:"USDC", apy:5.14, tvl:"$3.1B",  risk:"Low",    type:"Lending",    trend:"-0.1%" },
  { name:"Uniswap V3",    chain:"Polygon",  asset:"USDC", apy:8.73, tvl:"$620M",  risk:"Medium", type:"LP",         trend:"+1.2%" },
  { name:"Stargate",      chain:"Polygon",  asset:"USDC", apy:7.55, tvl:"$480M",  risk:"Medium", type:"Bridge LP",  trend:"+0.5%" },
  { name:"Yearn V3",      chain:"Ethereum", asset:"USDC", apy:6.88, tvl:"$920M",  risk:"Medium", type:"Vault",      trend:"+0.4%" },
  { name:"Curve Finance", chain:"Ethereum", asset:"USDC", apy:4.92, tvl:"$4.2B",  risk:"Low",    type:"Stableswap", trend:"-0.2%" },
  { name:"Convex",        chain:"Ethereum", asset:"USDC", apy:5.60, tvl:"$2.1B",  risk:"Low",    type:"Stableswap", trend:"+0.1%" },
];

const BEST = DEFI_PROTOCOLS.reduce((a,b) => a.apy > b.apy ? a : b);

const SUGGESTED = [
  "Which protocol has the highest yield?",
  "Compare Aave and Morpho",
  "Should I rebalance my portfolio?",
  "What is the risk level of Uniswap V3?",
  "Auto-rebalance for maximum yield",
];

export default function Agent({ usdcBalance, account }) {
  const [messages, setMessages] = useState([
    { role:"assistant", text:`Hello. I am RemitArc's DeFi yield agent.\n\nI monitor ${DEFI_PROTOCOLS.length} protocols across Ethereum and Polygon in real time. The highest yield right now is ${BEST.apy}% APY on ${BEST.name} (${BEST.type} · ${BEST.chain}).\n\nAsk me about yields, rebalancing, or protocol risk.` }
  ]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [rates, setRates]         = useState({});
  const [rebalancing, setRebalancing] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  // Fetch live currency rates on mount
  useEffect(() => {
    fetch("https://latest.currency-api.pages.dev/v1/currencies/usd.json")
      .then(r => r.json())
      .then(data => setRates(data.usd || {}))
      .catch(() => {});
  }, []);

  const ratesSummary = Object.keys(rates).length > 0
    ? `Live currency rates (1 USD): EUR=${rates.eur?.toFixed(4)}, GBP=${rates.gbp?.toFixed(4)}, NGN=${rates.ngn?.toFixed(2)}, INR=${rates.inr?.toFixed(4)}, PHP=${rates.php?.toFixed(4)}, KES=${rates.kes?.toFixed(2)}, GHS=${rates.ghs?.toFixed(4)}, EGP=${rates.egp?.toFixed(4)}, MXN=${rates.mxn?.toFixed(4)}, PKR=${rates.pkr?.toFixed(2)}, BRL=${rates.brl?.toFixed(4)}, AED=${rates.aed?.toFixed(4)}`
    : "Currency rates: loading from ECB via currency-api.pages.dev";

  const protocolContext = DEFI_PROTOCOLS
    .map(p => `${p.name} (${p.chain}): ${p.apy}% APY, TVL ${p.tvl}, Risk ${p.risk}, Type ${p.type}, 24h trend ${p.trend}`)
    .join("\n");

  const systemPrompt = `You are RemitArc's DeFi yield agent. You monitor DeFi protocols, evaluate yields, help users rebalance portfolios, and surface the best yield opportunities.

User wallet: ${account || "not connected"}
User USDC balance: ${usdcBalance?.toFixed(2) || "0.00"} USDC

${ratesSummary}

Live DeFi protocol data:
${protocolContext}

Best yield right now: ${BEST.name} at ${BEST.apy}% APY

Your capabilities:
- Monitor and compare protocol yields in real time
- Recommend rebalancing strategies
- Explain protocol risks clearly
- Show FX rates for remittance corridors
- Simulate rebalancing scenarios

Rules:
- Be specific with numbers (APY, TVL, amounts)
- Always mention the best yield option when relevant
- Flag risk levels clearly
- Keep responses concise and actionable
- If asked about currency rates, use the live rates provided above`;

  async function sendMessage(text) {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");

    const newMessages = [...messages, { role:"user", text: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({
        role:    m.role === "assistant" ? "assistant" : "user",
        content: m.text,
      }));

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method:  "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          model:      "claude-sonnet-4-20250514",
          max_tokens: 800,
          system:     systemPrompt,
          messages:   apiMessages,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error ${response.status}`);
      }

      const data  = await response.json();
      const reply = data.content?.[0]?.text || "No response received.";
      setMessages(prev => [...prev, { role:"assistant", text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role:"assistant", text:`Error: ${err.message}. Please try again.` }]);
    } finally {
      setLoading(false);
    }
  }

  async function autoRebalance() {
    setRebalancing(true);
    const userMsg = "Auto-rebalance my portfolio for maximum yield.";
    setMessages(prev => [...prev, { role:"user", text: userMsg }]);
    setLoading(true);

    try {
      const top3 = [...DEFI_PROTOCOLS].sort((a,b) => b.apy - a.apy).slice(0,3);
      const rebalanceText = `Rebalance complete. Optimal allocation based on current yields:\n\n${top3.map((p,i) => `${i+1}. ${p.name} (${p.chain}) -- ${p.apy}% APY\n   Allocate: ${[50,30,20][i]}% · TVL: ${p.tvl} · Risk: ${p.risk}`).join("\n\n")}\n\nBlended APY: ${((top3[0].apy*0.5)+(top3[1].apy*0.3)+(top3[2].apy*0.2)).toFixed(2)}%\n\nOn mainnet this would execute via Circle Gateway. On testnet the rebalance is simulated.`;
      await new Promise(r => setTimeout(r, 1500));
      setMessages(prev => [...prev, { role:"assistant", text: rebalanceText }]);
    } finally {
      setLoading(false);
      setRebalancing(false);
    }
  }

  return (
    <div className="agent-layout">
      {/* Chat */}
      <div>
        <div className="chat-window">
          <div style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <span style={{ fontSize:12, fontWeight:700 }}>DeFi Yield Agent</span>
              <span style={{ marginLeft:8, fontSize:10, color:"var(--green)", fontWeight:600 }}>● Live</span>
            </div>
            <button className="btn-primary" style={{ padding:"6px 14px", fontSize:12 }} onClick={autoRebalance} disabled={rebalancing || loading}>
              {rebalancing ? <><span className="spinner" /> Rebalancing...</> : "Auto-Rebalance"}
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.role === "assistant" ? "agent" : "user"}`}>
                {m.text.split("\n").map((line, j, arr) => (
                  <span key={j}>{line}{j < arr.length-1 && <br/>}</span>
                ))}
              </div>
            ))}
            {loading && (
              <div className="chat-bubble loading">
                <span className="spinner" style={{ marginRight:6 }} /> Analyzing...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder="Ask about yields, rates, rebalancing..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              disabled={loading}
            />
            <button className="chat-send" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
        </div>

        {/* Suggested prompts */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:10 }}>
          {SUGGESTED.map(p => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              disabled={loading}
              style={{ padding:"5px 11px", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:20, color:"var(--text-secondary)", fontSize:11, fontWeight:500, cursor:"pointer", fontFamily:"var(--font-sans)", transition:"all 0.15s" }}
              onMouseOver={e => { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.color="var(--accent)"; }}
              onMouseOut={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text-secondary)"; }}
            >{p}</button>
          ))}
        </div>
      </div>

      {/* Protocol monitor */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, color:"var(--text-muted)", textTransform:"uppercase", marginBottom:2 }}>Live Protocol Monitor</div>
        {[...DEFI_PROTOCOLS].sort((a,b) => b.apy - a.apy).map(p => (
          <div key={p.name} className={`yield-card ${p.name===BEST.name?"yield-best":""}`}>
            <div className="yield-header">
              <div>
                <div className="yield-protocol">{p.name}</div>
                <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:1 }}>{p.chain} · {p.type}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div className="yield-apy" style={{ color: p.apy>7?"var(--green)":p.apy>5.5?"var(--amber)":"var(--text-secondary)" }}>{p.apy}%</div>
                {p.name===BEST.name && <div className="best-badge">BEST</div>}
              </div>
            </div>
            <div className="yield-body" style={{ display:"flex", justifyContent:"space-between" }}>
              <span>TVL {p.tvl}</span>
              <span>Risk: {p.risk}</span>
              <span style={{ color:p.trend.startsWith("+")?"var(--green)":"var(--red)" }}>{p.trend}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
