export function History({ txs }) {
  return (
    <div>
      <div className="card">
        <div className="card-title">All transactions</div>
        {txs.length === 0 ? (
          <div className="empty-state">No transactions yet. Swap and send to get started.</div>
        ) : (
          <table className="tx-table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Destination</th>
                <th>USDC</th>
                <th>Fee</th>
                <th>Date</th>
                <th>Status</th>
                <th>Hash</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((tx, i) => (
                <tr key={i}>
                  <td>
                    <div className="tx-name">
                      {tx.recipient?.startsWith("wallet:")
                        ? tx.recipient.replace("wallet:","").slice(0,10)+"..."
                        : tx.recipient}
                    </div>
                  </td>
                  <td className="tx-mono">{tx.country}</td>
                  <td className="tx-mono">{tx.usdc}</td>
                  <td className="tx-mono">{tx.fee}</td>
                  <td style={{ fontSize:12, color:"var(--text-muted)" }}>{tx.timestamp}</td>
                  <td><span className="tx-success">✓ Successful</span></td>
                  <td>
                    <span className="tx-mono" style={{ color:"var(--accent)", fontSize:11 }}>
                      {tx.hash?.slice(0,14)}...
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export function Architecture() {
  const layers = [
    {
      title:"User Layer", color:"var(--accent)",
      nodes:[
        { icon:"🌍", name:"Global User",     desc:"Any country · Web or mobile" },
        { icon:"⇄",  name:"Swap + Send UI",  desc:"React · Vercel · Mobile responsive" },
      ]
    },
    {
      title:"Wallet Layer", color:"var(--amber)",
      nodes:[
        { icon:"◈",  name:"Circle Embedded Wallet", desc:"Custodial · No seed phrase" },
        { icon:"🦊", name:"MetaMask / EIP-1193",    desc:"Arc Testnet · Chain 5042002" },
      ]
    },
    {
      title:"Swap Layer", color:"var(--purple)",
      nodes:[
        { icon:"⇄", name:"Token Swap",        desc:"USDC, ETH, MATIC, AVAX, ARB" },
        { icon:"$", name:"USDC Settlement",   desc:"Arc L1 · Dollar-denominated fees" },
      ]
    },
    {
      title:"Contract Layer", color:"var(--green)",
      nodes:[
        { icon:"⬡", name:"RemitArc Contract",  desc:"0x5A8d08...4769 · 30 bps fee" },
        { icon:"◈", name:"AI Yield Agent",     desc:"DeFi monitor · Auto-rebalance" },
      ]
    },
    {
      title:"Bridge Layer", color:"var(--accent)",
      nodes:[
        { icon:"⇄", name:"CCTP Bridge Kit",  desc:"Burn-and-mint · ETH / MATIC" },
        { icon:"⬡", name:"Circle Gateway",   desc:"Treasury routing · Off-ramp" },
      ]
    },
    {
      title:"Recipient Layer", color:"var(--green)",
      nodes:[
        { icon:"◈", name:"USDC Wallet",  desc:"Direct on-chain settlement" },
        { icon:"🌍", name:"12+ Corridors", desc:"Africa · Asia · Americas · Europe" },
      ]
    },
  ];

  const tools = [
    { tag:"USDC",    color:"var(--accent)", desc:"Primary settlement rail on Arc" },
    { tag:"WALLETS", color:"var(--amber)",  desc:"Embedded wallet -- no seed phrase" },
    { tag:"CCTP",    color:"var(--green)",  desc:"Cross-chain USDC burn-and-mint" },
    { tag:"GATEWAY", color:"var(--accent)", desc:"Treasury routing and off-ramp" },
  ];

  const agentFeatures = [
    { icon:"👁", label:"Monitors",     desc:"8+ DeFi protocols across ETH + Polygon" },
    { icon:"📊", label:"Evaluates",    desc:"APY, TVL, risk, trend in real time"       },
    { icon:"⇄",  label:"Rebalances",   desc:"Auto-allocates for max yield on approval" },
    { icon:"◈",  label:"Recommends",   desc:"Surfaces highest yield with risk context" },
  ];

  return (
    <div>
      {/* Metrics */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10, marginBottom:24 }}>
        {[
          { label:"Settlement",  value:"<1s",     color:"var(--green)"  },
          { label:"Fee",         value:"0.30%",   color:"var(--accent)" },
          { label:"Corridors",   value:"12+",     color:"var(--accent)" },
          { label:"Chains",      value:"3",       color:"var(--amber)"  },
          { label:"SWIFT saving",value:"~94%",    color:"var(--green)"  },
          { label:"Chain ID",    value:"5042002", color:"var(--amber)"  },
        ].map(m => (
          <div key={m.label} style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:"12px", textAlign:"center" }}>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:18, fontWeight:600, color:m.color, marginBottom:3 }}>{m.value}</div>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:0.5, color:"var(--text-muted)", textTransform:"uppercase" }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:20 }}>
        {/* Architecture flow */}
        <div className="card">
          <div className="card-title">System architecture</div>
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {layers.map((layer, li) => (
              <div key={layer.title}>
                <div className="arch-layer-label">
                  <div className="arch-layer-bar" style={{ background:layer.color }} />
                  <span style={{ fontSize:9, fontWeight:700, letterSpacing:1, color:layer.color, textTransform:"uppercase" }}>
                    {layer.title}
                  </span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:`repeat(${layer.nodes.length},1fr)`, gap:8, marginBottom:8 }}>
                  {layer.nodes.map((node, ni) => (
                    <div key={ni} style={{
                      background:`${layer.color}0d`,
                      border:`1px solid ${layer.color}28`,
                      borderRadius:"var(--radius-md)",
                      padding:"10px 12px",
                      display:"flex", alignItems:"center", gap:9,
                    }}>
                      <div style={{
                        width:32, height:32, borderRadius:"var(--radius-sm)",
                        background:`${layer.color}18`, border:`1px solid ${layer.color}33`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:16, flexShrink:0,
                      }}>{node.icon}</div>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:"var(--text-primary)", marginBottom:1 }}>{node.name}</div>
                        <div style={{ fontSize:10, color:"var(--text-secondary)" }}>{node.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {li < layers.length - 1 && (
                  <div style={{ textAlign:"center", color:"var(--text-muted)", fontSize:14, padding:"2px 0 8px", display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ flex:1, height:1, background:"var(--border)" }} />
                    <span>↓</span>
                    <div style={{ flex:1, height:1, background:"var(--border)" }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* AI Agent */}
          <div className="card">
            <div className="card-title">AI yield agent</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {agentFeatures.map(f => (
                <div key={f.label} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 11px", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)" }}>
                  <div style={{ width:30, height:30, background:"var(--purple-dim)", border:"1px solid rgba(167,139,250,0.25)", borderRadius:"var(--radius-sm)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:"var(--purple)" }}>{f.label}</div>
                    <div style={{ fontSize:11, color:"var(--text-secondary)" }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Circle tools */}
          <div className="card">
            <div className="card-title">Circle products</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {tools.map(t => (
                <div key={t.tag} style={{ display:"flex", alignItems:"center", gap:9, padding:"9px 11px", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)" }}>
                  <span style={{ padding:"2px 7px", background:`${t.color}15`, border:`1px solid ${t.color}33`, borderRadius:20, fontSize:9, fontWeight:700, color:t.color, letterSpacing:0.5, flexShrink:0 }}>{t.tag}</span>
                  <span style={{ fontSize:12, color:"var(--text-secondary)" }}>{t.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contract */}
          <div className="card">
            <div className="card-title">Contract details</div>
            {[
              ["Network",  "Arc Testnet"],
              ["Chain ID", "5042002"],
              ["Contract", "0x5A8d08...4769"],
              ["USDC",     "0x360000...0000"],
              ["Fee",      "30 bps (0.30%)"],
              ["Finality", "< 1 second"],
              ["Solidity", "0.8.20"],
            ].map(([k,v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid var(--border)" }}>
                <span style={{ fontSize:11, color:"var(--text-secondary)" }}>{k}</span>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--text-primary)" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default History;
