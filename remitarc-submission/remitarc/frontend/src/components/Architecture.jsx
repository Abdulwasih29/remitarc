export default function Architecture({ onBack }) {
  const nodes = [
    { label: "UAE User", desc: "AED input · no crypto UX", color: "#3b82f6" },
    { label: "Circle Embedded Wallet", desc: "Custodial · no seed phrase", color: "#f59e0b" },
    { label: "USDC on Arc", desc: "Deterministic finality · dollar fees", color: "#3b82f6" },
    { label: "CCTP Bridge Kit", desc: "Cross-chain USDC transfer", color: "#22c55e" },
    { label: "Circle Gateway", desc: "Treasury routing · off-ramp", color: "#6b7280" },
    { label: "Recipient", desc: "USDC or local currency", color: "#22c55e" },
  ];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
        <button onClick={onBack} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>←</button>
        <div style={{ fontWeight: 500 }}>System Architecture</div>
      </div>
      <div style={{ padding: 16 }}>
        {nodes.map((n, i) => (
          <div key={i}>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, background: n.color + "20", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: n.color }} />
              </div>
              <div><div style={{ fontSize: 13, fontWeight: 500 }}>{n.label}</div><div style={{ fontSize: 11, color: "#6b7280" }}>{n.desc}</div></div>
            </div>
            {i < nodes.length - 1 && <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 18, margin: "2px 0" }}>↓</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
