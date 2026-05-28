export default function History({ txs, onBack }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
        <button onClick={onBack} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>←</button>
        <div style={{ fontWeight: 500 }}>Transaction History</div>
      </div>
      <div style={{ padding: 16 }}>
        {txs.length === 0 ? <div style={{ color: "#9ca3af", fontSize: 13 }}>No transactions yet.</div> : txs.map((tx, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
            <div><div style={{ fontSize: 13, fontWeight: 500 }}>{tx.recipient}</div><div style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>{tx.country} · {tx.timestamp}</div><div style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace", wordBreak: "break-all" }}>{tx.hash}</div></div>
            <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}><div style={{ fontSize: 13, fontFamily: "monospace" }}>{tx.usdc} USDC</div><div style={{ fontSize: 10, color: tx.settled ? "#22c55e" : "#f59e0b" }}>{tx.settled ? "Settled" : "Pending"}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}
