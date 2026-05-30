import { useEffect, useState } from "react";

const CORRIDORS_PREVIEW = [
  { code:"IN", flag:"🇮🇳", name:"India",       currency:"INR" },
  { code:"NG", flag:"🇳🇬", name:"Nigeria",     currency:"NGN" },
  { code:"PH", flag:"🇵🇭", name:"Philippines", currency:"PHP" },
  { code:"GB", flag:"🇬🇧", name:"UK",          currency:"GBP" },
  { code:"MX", flag:"🇲🇽", name:"Mexico",      currency:"MXN" },
  { code:"EG", flag:"🇪🇬", name:"Egypt",       currency:"EGP" },
];

export default function Dashboard({ usdcBalance, stats, recentTxs, onSwap, connected, onConnect, connecting, onReceive }) {
  const [rates, setRates] = useState({});

  useEffect(() => {
    async function fetchRates() {
      try {
        const res  = await fetch("https://latest.currency-api.pages.dev/v1/currencies/usd.json");
        const data = await res.json();
        setRates(data.usd || {});
      } catch { /* silent */ }
    }
    fetchRates();
  }, []);

  const getRate = (currency) => rates[currency.toLowerCase()] || null;

  return (
    <div>
      <div className="hero-card">
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, color:"var(--accent)", textTransform:"uppercase", marginBottom:7 }}>
          USDC Balance · Arc Testnet
        </div>
        {connected ? (
          <>
            <div className="hero-amount">
              <span className="hero-currency">USDC </span>
              {usdcBalance.toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 })}
            </div>
            <div className="hero-sub">
              {rates.aed ? `≈ AED ${(usdcBalance * rates.aed).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 })}` : "Fetching live rate..."}
            </div>
          </>
        ) : (
          <>
            <div className="hero-amount" style={{ color:"var(--text-muted)" }}>---.--</div>
            <div className="hero-sub">Connect wallet to see balance</div>
          </>
        )}
        <div className="hero-actions" style={{ marginTop:20 }}>
          {connected ? (
            <>
              <button className="btn-primary" onClick={onSwap}>⇄ Swap + Send</button>
              <button className="btn-secondary" onClick={onReceive}>Receive</button>
            </>
          ) : (
            <button className="btn-primary" onClick={onConnect} disabled={connecting}>
              {connecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>

      <div className="two-col" style={{ marginBottom:16 }}>
        <div className="card">
          <div className="card-title">Your balance</div>
          {!connected ? (
            <div className="empty-state" style={{ padding:"32px 0" }}>
              <div style={{ fontSize:28, marginBottom:10 }}>◈</div>
              <div style={{ marginBottom:6 }}>Connect wallet to view balances</div>
              <button className="btn-primary" style={{ fontSize:12, padding:"8px 18px", marginTop:4 }} onClick={onConnect} disabled={connecting}>
                {connecting ? "Connecting..." : "Connect"}
              </button>
            </div>
          ) : (
            <div className="currency-list">
              <div className="currency-row">
                <div className="currency-icon" style={{ background:"rgba(39,117,202,0.12)", border:"1px solid rgba(39,117,202,0.25)" }}>
                  <span style={{ color:"#2775ca", fontWeight:700, fontSize:13 }}>$</span>
                </div>
                <div>
                  <div className="currency-name">USDC</div>
                  <div className="currency-full">USD Coin · Arc Testnet</div>
                </div>
                <div className="currency-amount">
                  <div className="currency-bal">{usdcBalance.toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:4 })}</div>
                  <div className="currency-usd">${usdcBalance.toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 })}</div>
                </div>
              </div>
              {usdcBalance === 0 && (
                <div style={{ fontSize:12, color:"var(--text-muted)", textAlign:"center", padding:"12px 0" }}>
                  Get testnet USDC at faucet.circle.com
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              { label:"Volume", value:`$${stats.volume}`, sub:"Total settled", cls:"stat-accent" },
              { label:"Transfers", value:stats.count, sub:"On-chain txns", cls:"" },
              { label:"Fee", value:"0.30%", sub:"30 bps/transfer", cls:"stat-green" },
              { label:"Settlement", value:"<1s", sub:"Deterministic", cls:"stat-amber" },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className={`stat-value ${s.cls}`} style={{ fontSize:22 }}>{s.value}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ flex:1 }}>
            <div className="card-title">Recent transactions</div>
            {recentTxs.length === 0 ? (
              <div className="empty-state">No transactions yet</div>
            ) : (
              <table className="tx-table">
                <thead><tr><th>Recipient</th><th>USDC</th><th>Status</th></tr></thead>
                <tbody>
                  {recentTxs.map((tx, i) => (
                    <tr key={i}>
                      <td>
                        <div className="tx-name">
                          {tx.recipient?.startsWith("wallet:") ? tx.recipient.replace("wallet:","").slice(0,10)+"..." : tx.recipient}
                        </div>
                        <div className="tx-mono" style={{ color:"var(--text-muted)" }}>{tx.country}</div>
                      </td>
                      <td className="tx-mono">{tx.usdc}</td>
                      <td><span className="tx-success">✓ Successful</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Live corridor rates · 1 USDC =</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
          {CORRIDORS_PREVIEW.map(c => {
            const rate = getRate(c.currency);
            return (
              <div key={c.code} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)" }}>
                <span style={{ fontSize:20 }}>{c.flag}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)" }}>{c.name}</div>
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color: rate ? "var(--green)" : "var(--text-muted)" }}>
                    {rate ? `${rate.toLocaleString("en-US", { maximumFractionDigits:2 })} ${c.currency}` : "Loading..."}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {Object.keys(rates).length > 0 && (
          <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:10, textAlign:"right", fontFamily:"var(--font-mono)" }}>
            Rates via currency-api.pages.dev · ECB source
          </div>
        )}
      </div>
    </div>
  );
}
