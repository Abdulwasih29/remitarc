export default function Dashboard({ balances, totalUSD, stats, recentTxs, onSwap, connected, onConnect, connecting, onReceive }) {
  return (
    <div>
      {/* Hero */}
      <div className="hero-card">
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, color:"var(--accent)", textTransform:"uppercase", marginBottom:7 }}>
          Total Portfolio · Arc Testnet
        </div>
        <div className="hero-amount">
          <span className="hero-currency">$</span>
          {totalUSD.toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 })}
        </div>
        <div className="hero-sub">
          {balances.length} assets · Arc Testnet
        </div>
        <div className="hero-actions">
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
        {/* Currency balances */}
        <div className="card">
          <div className="card-title">Your balances</div>
          <div className="currency-list">
            {balances.map(b => (
              <div key={b.symbol} className="currency-row">
                <div className="currency-icon" style={{ background:`${b.color}18`, border:`1px solid ${b.color}33` }}>
                  <span style={{ color:b.color, fontWeight:700, fontSize:14 }}>{b.icon}</span>
                </div>
                <div>
                  <div className="currency-name">{b.symbol}</div>
                  <div className="currency-full">{b.name}</div>
                </div>
                <div className="currency-amount">
                  <div className="currency-bal">{b.amount.toLocaleString("en-US", { maximumFractionDigits:4 })}</div>
                  <div className="currency-usd">${b.usdValue.toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 })}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div className="stat-card">
              <div className="stat-label">Volume</div>
              <div className="stat-value stat-accent" style={{ fontSize:22 }}>${stats.volume}</div>
              <div className="stat-sub">Total settled</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Transfers</div>
              <div className="stat-value" style={{ fontSize:22 }}>{stats.count}</div>
              <div className="stat-sub">On-chain txns</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Fee</div>
              <div className="stat-value stat-green" style={{ fontSize:22 }}>0.30%</div>
              <div className="stat-sub">30 bps/transfer</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Settlement</div>
              <div className="stat-value stat-amber" style={{ fontSize:22 }}>&lt;1s</div>
              <div className="stat-sub">Deterministic</div>
            </div>
          </div>

          {/* Recent txns */}
          <div className="card" style={{ flex:1 }}>
            <div className="card-title">Recent transactions</div>
            {recentTxs.length === 0 ? (
              <div className="empty-state">No transactions yet</div>
            ) : (
              <table className="tx-table">
                <thead>
                  <tr><th>Recipient</th><th>USDC</th><th>Status</th></tr>
                </thead>
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
    </div>
  );
}
