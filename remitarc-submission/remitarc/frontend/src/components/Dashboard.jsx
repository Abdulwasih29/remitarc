const CORRIDORS = [
  { code:"IN", flag:"🇮🇳", name:"India",         currency:"INR", rate:83.12  },
  { code:"PH", flag:"🇵🇭", name:"Philippines",   currency:"PHP", rate:58.20  },
  { code:"PK", flag:"🇵🇰", name:"Pakistan",      currency:"PKR", rate:278.50 },
  { code:"EG", flag:"🇪🇬", name:"Egypt",         currency:"EGP", rate:48.70  },
  { code:"US", flag:"🇺🇸", name:"United States", currency:"USD", rate:1.00   },
  { code:"GB", flag:"🇬🇧", name:"UK",            currency:"GBP", rate:0.792  },
];

export default function Dashboard({ usdcBalance, stats, recentTxs, onSend, connected, onConnect, connecting }) {
  return (
    <div>
      <div className="tagline-banner">"From stablecoins to spending power."</div>
      <div className="hero-card">
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, color:"var(--accent)", textTransform:"uppercase", marginBottom:8 }}>USDC Balance · Arc Testnet</div>
        <div className="hero-amount">
          <span className="hero-currency">USDC </span>
          {usdcBalance.toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 })}
        </div>
        <div className="hero-sub">AED {(usdcBalance * 3.674).toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 })}</div>
        <div className="hero-actions">
          {connected ? (
            <button className="btn-primary" onClick={onSend}>Send Money</button>
          ) : (
            <button className="btn-primary" onClick={onConnect} disabled={connecting}>
              {connecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
          <button className="btn-secondary">Receive</button>
        </div>
      </div>
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-label">Total volume</div>
          <div className="stat-value stat-accent">${stats.volume}</div>
          <div className="stat-sub">Lifetime USDC settled</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Transfers</div>
          <div className="stat-value">{stats.count}</div>
          <div className="stat-sub">On-chain transactions</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg fee</div>
          <div className="stat-value stat-green">0.30%</div>
          <div className="stat-sub">30 bps per transfer</div>
        </div>
      </div>
      <div className="two-col" style={{ marginTop:16 }}>
        <div className="card">
          <div className="card-title">Active corridors</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {CORRIDORS.map(c => (
              <div key={c.code} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)" }}>
                <span style={{ fontSize:20 }}>{c.flag}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{c.name}</div>
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--text-secondary)" }}>1 USDC = {c.rate} {c.currency}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Recent transactions</div>
          {recentTxs.length === 0 ? (
            <div className="empty-state">No transactions yet</div>
          ) : (
            <table className="tx-table">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTxs.map((tx, i) => (
                  <tr key={i}>
                    <td>
                      <div className="tx-name">{tx.recipient}</div>
                      <div className="tx-mono" style={{ color:"var(--text-muted)" }}>{tx.country}</div>
                    </td>
                    <td className="tx-mono">{tx.usdc} USDC</td>
                    <td>{tx.settled ? <span className="tx-settled">Settled</span> : <span className="tx-pending">Pending</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <div className="card" style={{ marginTop:16 }}>
        <div className="card-title">Revenue model</div>
        <div className="revenue-grid">
          {["FX Spread","Instant Settlement Fees","API Usage","Liquidity Provider Commissions","SaaS Treasury Plans"].map(r => (
            <div key={r} className="revenue-pill">{r}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
