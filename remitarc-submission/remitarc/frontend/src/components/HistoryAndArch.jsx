// History.jsx
export function History({ txs }) {
  return (
    <div>
      <div className="tagline-banner">"The final mile for USDC."</div>
      <div className="card">
        <div className="card-title">All transactions</div>
        {txs.length === 0 ? (
          <div className="empty-state">No transactions yet. Send your first remittance to get started.</div>
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
                  <td><div className="tx-name">{tx.recipient}</div></td>
                  <td className="tx-mono">{tx.country}</td>
                  <td className="tx-mono">{tx.usdc}</td>
                  <td className="tx-mono">{tx.fee}</td>
                  <td style={{ fontSize:12, color:"var(--text-muted)" }}>{tx.timestamp}</td>
                  <td>{tx.settled ? <span className="tx-settled">✓ Settled</span> : <span className="tx-pending">Pending</span>}</td>
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

// Architecture.jsx
export function Architecture() {
  const nodes = [
    { icon:"👤", cls:"blue",  name:"UAE User",                   desc:"AED input · no crypto UX required"                  },
    { icon:"◈",  cls:"blue",  name:"Circle Embedded Wallet",     desc:"Custodial · no seed phrase · EIP-4337"              },
    { icon:"$",  cls:"amber", name:"USDC on Arc",                desc:"Native gas token · deterministic finality · <1s"    },
    { icon:"⇄",  cls:"green", name:"RemitArc Smart Contract",    desc:"0x5A8d08B9b708FB975c107A784AE0e43453Bb4769"         },
    { icon:"⬡",  cls:"blue",  name:"CCTP Bridge Kit",            desc:"Burn-and-mint cross-chain USDC movement"            },
    { icon:"🏦", cls:"amber", name:"Circle Gateway",             desc:"Treasury routing · off-ramp orchestration"          },
    { icon:"✓",  cls:"green", name:"Recipient",                  desc:"USDC or local currency via off-ramp partner"        },
  ];

  const tools = [
    { tag:"USDC",    desc:"Primary settlement rail on Arc" },
    { tag:"WALLETS", desc:"Embedded wallet -- no crypto UX" },
    { tag:"CCTP",    desc:"Cross-chain USDC movement" },
    { tag:"GATEWAY", desc:"Treasury routing and off-ramp" },
  ];

  return (
    <div>
      <div className="tagline-banner">"Stablecoin liquidity for the real world."</div>
      <div className="two-col">
        <div className="card">
          <div className="card-title">System flow</div>
          <div className="route-steps">
            {nodes.map((n, i, arr) => (
              <div key={i}>
                <div className="route-node">
                  <div className={`route-icon ${n.cls}`}>{n.icon}</div>
                  <div>
                    <div className="route-name">{n.name}</div>
                    <div className="route-desc">{n.desc}</div>
                  </div>
                </div>
                {i < arr.length - 1 && <div className="route-arrow">↓</div>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div className="card">
            <div className="card-title">Circle products used</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {tools.map(t => (
                <div key={t.tag} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)" }}>
                  <span className="circle-badge">{t.tag}</span>
                  <span style={{ fontSize:13, color:"var(--text-secondary)" }}>{t.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Contract details</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                ["Network",   "Arc Testnet"],
                ["Chain ID",  "5042002"],
                ["Contract",  "0x5A8d08...4769"],
                ["USDC",      "0x360000...0000"],
                ["Fee",       "30 bps (0.30%)"],
                ["Finality",  "< 1 second"],
              ].map(([k,v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
                  <span style={{ fontSize:12, color:"var(--text-secondary)" }}>{k}</span>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--text-primary)" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Track 1 -- Cross-Border Payments</div>
            <div style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.7 }}>
              Built for the Stablecoin Commerce Stack Challenge. RemitArc targets UAE's high-expat remittance corridor -- the world's second largest by volume -- delivering instant, low-cost USDC settlement via Circle's Arc L1.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default History;
