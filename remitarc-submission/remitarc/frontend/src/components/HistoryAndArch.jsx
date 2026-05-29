export function Architecture() {
  const layers = [
    {
      title: "User Layer",
      color: "var(--accent)",
      colorDim: "var(--accent-dim)",
      nodes: [
        { icon:"🌍", name:"Global User",        desc:"Any country · No crypto knowledge needed" },
        { icon:"📱", name:"Web App",             desc:"React frontend · Vercel · Mobile responsive" },
      ]
    },
    {
      title: "Wallet Layer",
      color: "var(--amber)",
      colorDim: "var(--amber-dim)",
      nodes: [
        { icon:"◈", name:"Circle Embedded Wallet", desc:"Custodial · No seed phrase · EIP-4337" },
        { icon:"🦊", name:"MetaMask / Web3",        desc:"EIP-1193 provider · Arc Testnet" },
      ]
    },
    {
      title: "Settlement Layer",
      color: "var(--green)",
      colorDim: "var(--green-dim)",
      nodes: [
        { icon:"$", name:"USDC on Arc",              desc:"Native stablecoin · Dollar-denominated gas" },
        { icon:"⬡", name:"RemitArc Contract",        desc:"0x5A8d08...4769 · 30 bps fee · Ownable" },
      ]
    },
    {
      title: "Bridge Layer",
      color: "var(--accent)",
      colorDim: "var(--accent-dim)",
      nodes: [
        { icon:"⇄", name:"CCTP Bridge Kit",    desc:"Burn-and-mint · ETH / MATIC / AVAX" },
        { icon:"⬡", name:"Circle Gateway",     desc:"Treasury routing · Off-ramp orchestration" },
      ]
    },
    {
      title: "Recipient Layer",
      color: "var(--green)",
      colorDim: "var(--green-dim)",
      nodes: [
        { icon:"🏦", name:"Bank Transfer",  desc:"Local bank account · SWIFT / SEPA" },
        { icon:"📱", name:"Mobile Money",   desc:"M-Pesa · GCash · EasyPaisa" },
        { icon:"◈",  name:"USDC Wallet",   desc:"Direct crypto wallet settlement" },
      ]
    },
  ];

  const metrics = [
    { label:"Settlement time",  value:"< 1s",   color:"var(--green)"  },
    { label:"Fee",              value:"0.30%",   color:"var(--accent)" },
    { label:"Corridors",        value:"12+",     color:"var(--accent)" },
    { label:"vs SWIFT savings", value:"~94%",    color:"var(--green)"  },
    { label:"Chain ID",         value:"5042002", color:"var(--amber)"  },
    { label:"USDC standard",    value:"ERC-20",  color:"var(--amber)"  },
  ];

  const circleProducts = [
    { tag:"USDC",    color:"var(--accent)", desc:"Primary settlement rail on Arc -- dollar-denominated fees, native token" },
    { tag:"WALLETS", color:"var(--amber)",  desc:"Embedded wallet abstraction -- no seed phrase, mainstream UX" },
    { tag:"CCTP",    color:"var(--green)",  desc:"Cross-chain USDC movement via burn-and-mint to ETH, MATIC" },
    { tag:"GATEWAY", color:"var(--accent)", desc:"Treasury routing, multi-party flows, off-ramp orchestration" },
  ];

  return (
    <div>
      <div className="tagline-banner">"Stablecoin liquidity for the real world."</div>

      {/* Metrics row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10, marginBottom:24 }}>
        {metrics.map(m => (
          <div key={m.label} style={{
            background:"var(--bg-card)", border:"1px solid var(--border)",
            borderRadius:"var(--radius-md)", padding:"14px 12px", textAlign:"center"
          }}>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:20, fontWeight:600, color:m.color, marginBottom:4 }}>{m.value}</div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, color:"var(--text-muted)", textTransform:"uppercase" }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20 }}>
        {/* Architecture flow */}
        <div className="card">
          <div className="card-title">System architecture</div>
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {layers.map((layer, li) => (
              <div key={layer.title}>
                {/* Layer label */}
                <div style={{
                  display:"flex", alignItems:"center", gap:10, marginBottom:8,
                  paddingLeft:4
                }}>
                  <div style={{ width:3, height:16, background:layer.color, borderRadius:2 }} />
                  <span style={{ fontSize:10, fontWeight:700, letterSpacing:1, color:layer.color, textTransform:"uppercase" }}>
                    {layer.title}
                  </span>
                </div>

                {/* Nodes in layer */}
                <div style={{ display:"grid", gridTemplateColumns:`repeat(${layer.nodes.length},1fr)`, gap:8, marginBottom:8 }}>
                  {layer.nodes.map((node, ni) => (
                    <div key={ni} style={{
                      background:layer.colorDim,
                      border:`1px solid ${layer.color}33`,
                      borderRadius:"var(--radius-md)",
                      padding:"12px 14px",
                      display:"flex", alignItems:"center", gap:10
                    }}>
                      <div style={{
                        width:36, height:36,
                        background:`${layer.color}22`,
                        border:`1px solid ${layer.color}44`,
                        borderRadius:"var(--radius-sm)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:18, flexShrink:0
                      }}>{node.icon}</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:2 }}>{node.name}</div>
                        <div style={{ fontSize:11, color:"var(--text-secondary)" }}>{node.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Connector arrow between layers */}
                {li < layers.length - 1 && (
                  <div style={{
                    textAlign:"center", fontSize:18,
                    color:"var(--text-muted)", padding:"4px 0 8px",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8
                  }}>
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
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Circle products */}
          <div className="card">
            <div className="card-title">Circle products</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {circleProducts.map(p => (
                <div key={p.tag} style={{
                  padding:"12px 14px",
                  background:"var(--bg-surface)",
                  border:"1px solid var(--border)",
                  borderRadius:"var(--radius-md)"
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                    <span style={{
                      padding:"2px 8px",
                      background:`${p.color}18`,
                      border:`1px solid ${p.color}44`,
                      borderRadius:20,
                      fontSize:10, fontWeight:700, color:p.color, letterSpacing:0.5
                    }}>{p.tag}</span>
                  </div>
                  <div style={{ fontSize:12, color:"var(--text-secondary)", lineHeight:1.5 }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Contract info */}
          <div className="card">
            <div className="card-title">Contract details</div>
            {[
              ["Network",   "Arc Testnet"],
              ["Chain ID",  "5042002"],
              ["Contract",  "0x5A8d08...4769"],
              ["USDC",      "0x360000...0000"],
              ["Fee cap",   "200 bps max"],
              ["Default fee","30 bps"],
              ["Finality",  "< 1 second"],
              ["Solidity",  "0.8.20"],
            ].map(([k,v]) => (
              <div key={k} style={{
                display:"flex", justifyContent:"space-between",
                padding:"8px 0", borderBottom:"1px solid var(--border)"
              }}>
                <span style={{ fontSize:12, color:"var(--text-secondary)" }}>{k}</span>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--text-primary)" }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Track badge */}
          <div style={{
            padding:"16px",
            background:"var(--accent-dim)",
            border:"1px solid rgba(0,212,255,0.2)",
            borderRadius:"var(--radius-lg)"
          }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, color:"var(--accent)", textTransform:"uppercase", marginBottom:6 }}>
              Track 1 · Stablecoin Commerce Stack
            </div>
            <div style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.6 }}>
              Cross-Border Payments and Remittances. Global users · USDC settlement · Circle Arc L1 · Deterministic finality.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function History({ txs }) {
  return (
    <div>
      <div className="tagline-banner">"The final mile for USDC."</div>
      <div className="card">
        <div className="card-title">All transactions</div>
        {txs.length === 0 ? (
          <div className="empty-state">No transactions yet. Send your first transfer to get started.</div>
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
                      {tx.recipient?.startsWith("wallet:") ? tx.recipient.replace("wallet:","").slice(0,10)+"..." : tx.recipient}
                    </div>
                  </td>
                  <td className="tx-mono">{tx.country}</td>
                  <td className="tx-mono">{tx.usdc}</td>
                  <td className="tx-mono">{tx.fee}</td>
                  <td style={{ fontSize:12, color:"var(--text-muted)" }}>{tx.timestamp}</td>
                  <td>{tx.settled
                    ? <span className="tx-settled">✓ Settled</span>
                    : <span className="tx-pending">Pending</span>}
                  </td>
                  <td><span className="tx-mono" style={{ color:"var(--accent)", fontSize:11 }}>{tx.hash?.slice(0,14)}...</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default History;
