import { useState, useRef, useEffect } from "react";

// Mock DeFi protocol data (in production, fetch from on-chain / APIs)
const DEFI_PROTOCOLS = [
  { name:"Aave V3",       chain:"Ethereum", asset:"USDC", apy:5.82, tvl:"$8.4B",  risk:"Low",    type:"Lending",     trend:"+0.3%" },
  { name:"Compound V3",   chain:"Ethereum", asset:"USDC", apy:5.14, tvl:"$3.1B",  risk:"Low",    type:"Lending",     trend:"-0.1%" },
  { name:"Morpho",        chain:"Ethereum", asset:"USDC", apy:6.41, tvl:"$1.8B",  risk:"Low",    type:"Lending",     trend:"+0.8%" },
  { name:"Uniswap V3",    chain:"Polygon",  asset:"USDC", apy:8.73, tvl:"$620M",  risk:"Medium", type:"LP",          trend:"+1.2%" },
  { name:"Curve Finance", chain:"Ethereum", asset:"USDC", apy:4.92, tvl:"$4.2B",  risk:"Low",    type:"Stableswap",  trend:"-0.2%" },
  { name:"Stargate",      chain:"Polygon",  asset:"USDC", apy:7.55, tvl:"$480M",  risk:"Medium", type:"Bridge LP",   trend:"+0.5%" },
  { name:"Yearn V3",      chain:"Ethereum", asset:"USDC", apy:6.88, tvl:"$920M",  risk:"Medium", type:"Vault",       trend:"+0.4%" },
  { name:"Convex",        chain:"Ethereum", asset:"USDC", apy:5.60, tvl:"$2.1B",  risk:"Low",    type:"Stableswap",  trend:"+0.1%" },
];

const BEST = DEFI_PROTOCOLS.reduce((a, b) => a.apy > b.apy ? a : b);

const SUGGESTED_PROMPTS = [
  "Which protocol has the highest yield right now?",
  "Compare Aave and Morpho for USDC",
  "Should I rebalance my portfolio?",
  "What are the risks of Uniswap V3?",
  "Auto-rebalance my holdings for max yield",
];

export default function Agent({ balances, account }) {
  const [messages, setMessages] = useState([
    {
      role: "agent",
      text: `Hello. I am RemitArc's DeFi yield agent.\n\nI am currently monitoring ${DEFI_PROTOCOLS.length} protocols across Ethereum and Polygon. The highest yield right now is ${BEST.apy}% APY on ${BEST.name} (${BEST.type} · ${BEST.chain}).\n\nAsk me anything about yields, rebalancing, or protocol risk.`,
    }
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [rebalancing, setRebalancing] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const portfolioSummary = balances
    .map(b => `${b.symbol}: ${b.amount.toLocaleString("en-US", { maximumFractionDigits:4 })} ($${b.usdValue.toFixed(2)})`)
    .join(", ");

  const totalUSD = balances.reduce((s, b) => s + b.usdValue, 0);

  const protocolContext = DEFI_PROTOCOLS.map(p =>
    `${p.name} (${p.chain}): ${p.apy}% APY, TVL ${p.tvl}, Risk ${p.risk}, Type ${p.type}, Trend ${p.trend}`
  ).join("\n");

  async function sendMessage(text) {
    const userText = text || input.trim();
    if (!userText) return;
    setInput("");
    setMessages(prev => [...prev, { role:"user", text: userText }]);
    setLoading(true);

    try {
      const systemPrompt = `You are RemitArc's DeFi yield agent. You monitor DeFi protocols, evaluate yields, recommend rebalancing, and help users maximize returns on their stablecoin holdings.

Current portfolio (wallet: ${account || "not connected"}):
${portfolioSummary}
Total portfolio value: $${totalUSD.toFixed(2)} USD

Live DeFi protocol data (updated every block):
${protocolContext}

Best yield right now: ${BEST.name} at ${BEST.apy}% APY on ${BEST.chain}

Your capabilities:
- Monitor protocol yields in real time
- Compare APY, TVL, risk, and trend across protocols
- Recommend optimal allocation for max yield
- Simulate rebalancing scenarios
- Explain protocol risks clearly
- Execute rebalancing (simulate for testnet)

Rules:
- Always mention the highest-yield option
- Be specific with numbers (APY, TVL, amounts)
- Flag risk levels clearly
- Recommend diversification where appropriate
- Keep responses concise and actionable
- Use bullet points for comparisons`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [
            ...messages.filter(m => m.role !== "agent" || messages.indexOf(m) === 0).map(m => ({
              role: m.role === "agent" ? "assistant" : "user",
              content: m.text,
            })),
            { role:"user", content: userText },
          ],
        }),
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text || "Unable to process. Try again.";
      setMessages(prev => [...prev, { role:"agent", text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role:"agent", text:"Network error. Check your connection and try again." }]);
    } finally {
      setLoading(false);
    }
  }

  async function autoRebalance() {
    setRebalancing(true);
    setMessages(prev => [...prev,
      { role:"user",  text:"Auto-rebalance my portfolio for maximum yield." },
      { role:"agent", text:"Analyzing portfolio and protocol yields..." },
    ]);
    await new Promise(r => setTimeout(r, 1800));
    const topProtocols = [...DEFI_PROTOCOLS].sort((a,b) => b.apy - a.apy).slice(0,3);
    const rebalanceMsg = `Rebalance complete. Recommended allocation based on current yields:\n\n${topProtocols.map((p,i) => `${i+1}. ${p.name} (${p.chain}) -- ${p.apy}% APY\n   Allocate: ${[50,30,20][i]}% of USDC holdings\n   TVL: ${p.tvl} · Risk: ${p.risk}`).join("\n\n")}\n\nEstimated blended APY: ${((topProtocols[0].apy*0.5)+(topProtocols[1].apy*0.3)+(topProtocols[2].apy*0.2)).toFixed(2)}%\n\nOn testnet: rebalance simulated. On mainnet, this would execute swaps via Circle Gateway.`;
    setMessages(prev => [...prev.slice(0,-1), { role:"agent", text: rebalanceMsg }]);
    setRebalancing(false);
  }

  return (
    <div>
      <div className="agent-layout">
        {/* Chat */}
        <div>
          <div className="chat-window">
            <div style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <span style={{ fontSize:12, fontWeight:700, color:"var(--text-primary)" }}>DeFi Yield Agent</span>
                <span style={{ marginLeft:8, fontSize:10, color:"var(--green)", fontWeight:600 }}>● Live</span>
              </div>
              <button
                className="btn-primary"
                style={{ padding:"6px 14px", fontSize:12 }}
                onClick={autoRebalance}
                disabled={rebalancing || loading}
              >
                {rebalancing ? <><span className="spinner" /> Rebalancing...</> : "Auto-Rebalance"}
              </button>
            </div>

            <div className="chat-messages">
              {messages.map((m, i) => (
                <div key={i} className={`chat-bubble ${m.role}`}>
                  {m.text.split("\n").map((line, j) => (
                    <span key={j}>{line}{j < m.text.split("\n").length-1 && <br/>}</span>
                  ))}
                </div>
              ))}
              {loading && (
                <div className="chat-bubble loading">
                  <span className="spinner" style={{ marginRight:6 }} /> Analyzing protocols...
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="chat-input-row">
              <input
                className="chat-input"
                placeholder="Ask about yields, rebalancing, risks..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !loading && sendMessage()}
                disabled={loading}
              />
              <button className="chat-send" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
                Send
              </button>
            </div>
          </div>

          {/* Suggested prompts */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:10 }}>
            {SUGGESTED_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                disabled={loading}
                style={{
                  padding:"5px 11px", background:"var(--bg-card)", border:"1px solid var(--border)",
                  borderRadius:20, color:"var(--text-secondary)", fontSize:11, fontWeight:500,
                  cursor:"pointer", fontFamily:"var(--font-sans)", transition:"all 0.15s",
                }}
                onMouseOver={e => { e.target.style.borderColor="var(--accent)"; e.target.style.color="var(--accent)"; }}
                onMouseOut={e => { e.target.style.borderColor="var(--border)"; e.target.style.color="var(--text-secondary)"; }}
              >{p}</button>
            ))}
          </div>
        </div>

        {/* Protocol monitor */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, color:"var(--text-muted)", textTransform:"uppercase", marginBottom:2 }}>
            Live Protocol Monitor
          </div>

          {[...DEFI_PROTOCOLS].sort((a,b) => b.apy - a.apy).map(p => (
            <div key={p.name} className={`yield-card ${p.name === BEST.name ? "yield-best" : ""}`}>
              <div className="yield-header">
                <div>
                  <div className="yield-protocol">{p.name}</div>
                  <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:1 }}>{p.chain} · {p.type}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div className="yield-apy" style={{ color: p.apy > 7 ? "var(--green)" : p.apy > 5.5 ? "var(--amber)" : "var(--text-secondary)" }}>
                    {p.apy}%
                  </div>
                  {p.name === BEST.name && <div className="best-badge">BEST</div>}
                </div>
              </div>
              <div className="yield-body" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span>TVL {p.tvl}</span>
                <span>Risk: {p.risk}</span>
                <span style={{ color: p.trend.startsWith("+") ? "var(--green)" : "var(--red)" }}>{p.trend}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
