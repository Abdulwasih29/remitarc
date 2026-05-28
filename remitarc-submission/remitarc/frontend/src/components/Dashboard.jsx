export default function Dashboard({ usdcBalance, stats, recentTxs, onSend, onHistory, connected, onConnect }) {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ background: "#1a1a2e", borderRadius: 12, padding: 20, marginBottom: 16, color: "#fff" }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>USDC Balance · Arc Testnet</div>
        <div style={{ fontSize: 32, fontWeight: 600, fontFamily: "monospace" }}>{usdcBalance.toFixed(2)}</div>
        <div style={{ fontSize: 12, opacity: 0.6 }}>≈ AED {(usdcBalance * 3.674).toFixed(2)}</div>
        <div style={{ display: "flex", gap: 16, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div><div style={{ fontSize: 10, opacity: 0.6 }}>TOTAL SENT</div><div style={{ fontFamily: "monospace" }}>${stats.volume}</div></div>
          <div><div style={{ fontSize: 10, opacity: 0.6 }}>TRANSFERS</div><div style={{ fontFamily: "monospace" }}>{stats.count}</div></div>
        </div>
      </div>
      {!connected ? (
        <button onClick={onConnect} style={{ width: "100%", padding: 14, background: "#3b82f6", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, cursor: "pointer", marginBottom: 12 }}>Connect Wallet</button>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          <button onClick={onSend} style={{ padding: 14, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Send Money</button>
          <button onClick={onHistory} style={{ padding: 14, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, cursor: "pointer", fontWeight: 500 }}>History</button>
        </div>
      )}
      <div style={{ fontSize: 12, fontWeight: 500, color: "#6b7280", marginBottom: 8, textTransform: "uppercase" }}>Recent Transactions</div>
      {recentTxs.length === 0 ? <div style={{ color: "#9ca3af", fontSize: 13 }}>No transactions yet.</div> : recentTxs.map((tx, i) => (
        <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
          <div><div style={{ fontSize: 13, fontWeight: 500 }}>{tx.recipient}</div><div style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>{tx.country} · {tx.timestamp}</div></div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontFamily: "monospace" }}>{tx.usdc} USDC</div><div style={{ fontSize: 10, color: "#22c55e" }}>Settled</div></div>
        </div>
      ))}
    </div>
  );
}
