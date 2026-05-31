import { useState, useRef, useEffect } from "react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

const CORRIDORS = [
  { code:"NGN", flag:"🇳🇬", name:"Nigeria",       region:"Africa"        },
  { code:"INR", flag:"🇮🇳", name:"India",         region:"South Asia"    },
  { code:"PHP", flag:"🇵🇭", name:"Philippines",   region:"SE Asia"       },
  { code:"PKR", flag:"🇵🇰", name:"Pakistan",      region:"South Asia"    },
  { code:"KES", flag:"🇰🇪", name:"Kenya",         region:"Africa"        },
  { code:"GHS", flag:"🇬🇭", name:"Ghana",         region:"Africa"        },
  { code:"EGP", flag:"🇪🇬", name:"Egypt",         region:"Africa"        },
  { code:"GBP", flag:"🇬🇧", name:"UK",            region:"Europe"        },
  { code:"EUR", flag:"🇪🇺", name:"Euro",          region:"Europe"        },
  { code:"MXN", flag:"🇲🇽", name:"Mexico",        region:"Latin America" },
  { code:"BRL", flag:"🇧🇷", name:"Brazil",        region:"Latin America" },
  { code:"BDT", flag:"🇧🇩", name:"Bangladesh",    region:"South Asia"    },
  { code:"AED", flag:"🇦🇪", name:"UAE Dirham",    region:"Middle East"   },
  { code:"JPY", flag:"🇯🇵", name:"Japan",         region:"East Asia"     },
  { code:"CNY", flag:"🇨🇳", name:"China",         region:"East Asia"     },
];

const SUGGESTED = [
  "How much NGN will $500 get me?",
  "Best corridor to send $1000 to India?",
  "Compare sending to Nigeria vs Ghana",
  "What is the GBP rate right now?",
  "Which corridor has the best rate today?",
  "How much does RemitArc charge in fees?",
];

export default function Agent({ usdcBalance, account }) {
  const [messages, setMessages]       = useState([
    { role:"assistant", text:"Hello. I am RemitArc's FX agent.\n\nI pull live exchange rates for 15+ global corridors and help you find the best way to send USDC cross-border.\n\nAsk me anything -- conversion amounts, corridor comparisons, fee breakdowns, or which destination gives the most local currency right now." }
  ]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [rates, setRates]             = useState({});
  const [ratesLoading, setRatesLoading] = useState(true);
  const [backendOk, setBackendOk]     = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  useEffect(() => {
    fetchRates();
    fetch(`${BACKEND}/health`)
      .then(r => r.ok ? setBackendOk(true) : setBackendOk(false))
      .catch(() => setBackendOk(false));
  }, []);

  async function fetchRates() {
    setRatesLoading(true);
    try {
      const res  = await fetch("https://latest.currency-api.pages.dev/v1/currencies/usd.json");
      const data = await res.json();
      setRates(data.usd || {});
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Rate fetch failed", e);
    } finally {
      setRatesLoading(false);
    }
  }

  const ratesSummary = Object.keys(rates).length > 0
    ? CORRIDORS.map(c => `${c.name} (${c.code}): 1 USDC = ${rates[c.code.toLowerCase()]?.toLocaleString("en-US",{maximumFractionDigits:4}) || "N/A"} ${c.code}`).join("\n")
    : "Live FX rates: loading...";

  async function sendMessage(text) {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");

    const newMessages = [...messages, { role:"user", text: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND}/api/agent`, {
        method:  "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          messages:    newMessages,
          usdcBalance: usdcBalance || 0,
          account:     account || null,
          rates,
          mode:        "fx",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Backend error ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role:"assistant", text: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role:"assistant",
        text:`Error: ${err.message}\n\nCheck that your backend is running and ANTHROPIC_API_KEY is set in backend/.env`
      }]);
    } finally {
      setLoading(false);
    }
  }

  // Best rate among corridors
  const bestCorridor = CORRIDORS
    .filter(c => rates[c.code.toLowerCase()] && c.code !== "GBP" && c.code !== "EUR")
    .sort((a,b) => (rates[b.code.toLowerCase()] || 0) - (rates[a.code.toLowerCase()] || 0))[0];

  return (
    <div className="agent-layout">
      {/* Chat panel */}
      <div>
        {backendOk === false && (
          <div className="error-box" style={{ marginBottom:12 }}>
            Backend offline -- start your Railway backend and add ANTHROPIC_API_KEY to .env
          </div>
        )}

        <div className="chat-window">
          <div style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:12, fontWeight:700 }}>FX Agent</span>
              <span style={{ fontSize:10, color: backendOk ? "var(--green)" : backendOk === false ? "var(--red)" : "var(--amber)", fontWeight:600 }}>
                {backendOk === null ? "● Connecting..." : backendOk ? "● Live" : "● Offline"}
              </span>
            </div>
            <button
              onClick={fetchRates}
              disabled={ratesLoading}
              style={{ padding:"5px 12px", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", fontSize:11, color:"var(--text-secondary)", cursor:"pointer", fontFamily:"var(--font-sans)", fontWeight:600 }}
            >
              {ratesLoading ? "Refreshing..." : "↻ Refresh rates"}
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
                <span className="spinner" style={{ marginRight:6 }} /> Checking rates...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder={backendOk ? "Ask about rates, conversions, corridors..." : "Backend offline..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              disabled={loading || !backendOk}
            />
            <button
              className="chat-send"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim() || !backendOk}
            >Send</button>
          </div>
        </div>

        {/* Suggested prompts */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:10 }}>
          {SUGGESTED.map(p => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              disabled={loading || !backendOk}
              style={{ padding:"5px 11px", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:20, color:"var(--text-secondary)", fontSize:11, fontWeight:500, cursor:"pointer", fontFamily:"var(--font-sans)", transition:"all 0.15s" }}
              onMouseOver={e => { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.color="var(--accent)"; }}
              onMouseOut={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text-secondary)"; }}
            >{p}</button>
          ))}
        </div>
      </div>

      {/* Right panel: live rates */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

        {/* Best rate highlight */}
        {bestCorridor && rates[bestCorridor.code.toLowerCase()] && (
          <div style={{ background:"var(--green-dim)", border:"1px solid rgba(0,229,160,0.25)", borderRadius:"var(--radius-lg)", padding:"14px 16px" }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.8, color:"var(--green)", textTransform:"uppercase", marginBottom:6 }}>
              Most local currency per USDC
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:26 }}>{bestCorridor.flag}</span>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>{bestCorridor.name}</div>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:18, fontWeight:600, color:"var(--green)" }}>
                  {rates[bestCorridor.code.toLowerCase()]?.toLocaleString("en-US",{maximumFractionDigits:2})} {bestCorridor.code}
                </div>
                <div style={{ fontSize:10, color:"var(--text-secondary)" }}>per 1 USDC</div>
              </div>
            </div>
          </div>
        )}

        {/* Live rate table */}
        <div className="card">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div className="card-title" style={{ marginBottom:0 }}>Live rates · 1 USDC</div>
            {lastUpdated && (
              <span style={{ fontSize:9, color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>{lastUpdated}</span>
            )}
          </div>

          {ratesLoading ? (
            <div style={{ textAlign:"center", padding:"20px 0", color:"var(--text-muted)", fontSize:12 }}>
              <span className="spinner" style={{ marginRight:6 }} /> Fetching live rates...
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
              {CORRIDORS.map(c => {
                const rate = rates[c.code.toLowerCase()];
                return (
                  <div
                    key={c.code}
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid var(--border)", cursor:"pointer" }}
                    onClick={() => sendMessage(`What is the current ${c.code} rate and how much ${c.code} will $100 get me?`)}
                    onMouseOver={e => e.currentTarget.style.background="var(--bg-hover)"}
                    onMouseOut={e => e.currentTarget.style.background="transparent"}
                  >
                    <span style={{ fontSize:16, flexShrink:0 }}>{c.flag}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)" }}>{c.name}</div>
                      <div style={{ fontSize:10, color:"var(--text-muted)" }}>{c.region}</div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontFamily:"var(--font-mono)", fontSize:12, fontWeight:500, color: rate ? "var(--text-primary)" : "var(--text-muted)" }}>
                        {rate ? rate.toLocaleString("en-US",{maximumFractionDigits:4}) : "N/A"}
                      </div>
                      <div style={{ fontSize:9, color:"var(--text-muted)" }}>{c.code}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ fontSize:9, color:"var(--text-muted)", marginTop:10, textAlign:"right", fontFamily:"var(--font-mono)" }}>
            ECB · currency-api.pages.dev · click rate to ask agent
          </div>
        </div>
      </div>
    </div>
  );
}
