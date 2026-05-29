import { useState } from "react";

const CORRIDORS = [
  { code:"IN", flag:"🇮🇳", name:"India",         currency:"INR", rate:83.12,  fee:0.50, chain:"MATIC" },
  { code:"PH", flag:"🇵🇭", name:"Philippines",   currency:"PHP", rate:58.20,  fee:0.40, chain:"MATIC" },
  { code:"PK", flag:"🇵🇰", name:"Pakistan",      currency:"PKR", rate:278.50, fee:0.45, chain:"MATIC" },
  { code:"EG", flag:"🇪🇬", name:"Egypt",         currency:"EGP", rate:48.70,  fee:0.60, chain:"ETH"   },
  { code:"US", flag:"🇺🇸", name:"United States", currency:"USD", rate:1.00,   fee:0.30, chain:"ETH"   },
  { code:"GB", flag:"🇬🇧", name:"UK",            currency:"GBP", rate:0.792,  fee:0.40, chain:"ETH"   },
];

const PAYOUT_METHODS = [
  { id:"usdc",  icon:"◈", name:"USDC Wallet",     desc:"Direct to crypto wallet"    },
  { id:"bank",  icon:"🏦", name:"Bank Transfer",  desc:"Local bank account"          },
  { id:"mobile",icon:"📱", name:"Mobile Money",   desc:"M-Pesa, GCash, EasyPaisa"   },
  { id:"cash",  icon:"💵", name:"Cash Pickup",    desc:"Agent network (coming soon)" },
];

const STEPS = ["Corridor", "Amount", "Payout", "Route", "Confirm"];

export default function SendFlow({ onBack, onComplete, usdcBalance, sendTransfer, connected, onConnect }) {
  const [step, setStep]           = useState(1);
  const [corridor, setCorridor]   = useState(null);
  const [aedAmount, setAedAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [payout, setPayout]       = useState("usdc");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);

  const usdcAmt   = aedAmount ? (parseFloat(aedAmount) * 0.272).toFixed(2) : "0.00";
  const fee       = corridor  ? (parseFloat(usdcAmt) * 0.003).toFixed(3)   : "0.00";
  const localAmt  = corridor && aedAmount ? (parseFloat(usdcAmt) * corridor.rate).toFixed(2) : "0.00";
  const total     = (parseFloat(usdcAmt) + parseFloat(fee)).toFixed(4);
  const canNext2  = !!corridor;
  const canNext3  = aedAmount && parseFloat(aedAmount) >= 10 && recipient.trim().length >= 2;
  const canNext4  = !!payout;

  async function handleSend() {
    setLoading(true);
    setError(null);
    try {
      const res = await sendTransfer({ aedAmount: parseFloat(aedAmount), recipientName: recipient, countryCode: corridor.code });
      setResult(res);
      setStep(6);
    } catch (err) {
      setError(err.message || "Transaction failed.");
    } finally {
      setLoading(false);
    }
  }

  // Success screen
  if (step === 6) {
    return (
      <div className="success-wrap">
        <div className="success-icon-ring">✓</div>
        <div className="success-title">Transfer Confirmed</div>
        <div className="success-sub">{result?.usdcAmt?.toFixed(2)} USDC sent to {recipient} · {corridor?.flag} {corridor?.name}</div>
        <div className="hash-card" style={{ maxWidth:520, margin:"0 auto 12px" }}>
          <div className="hash-label">Arc Transaction Hash</div>
          <div className="hash-val">{result?.txHash}</div>
        </div>
        <div className="hash-card" style={{ maxWidth:520, margin:"0 auto 28px" }}>
          <div className="hash-label">Settlement Rail</div>
          <div className="hash-val">USDC on Arc · Deterministic finality · Circle CCTP cross-chain to {corridor?.chain}</div>
        </div>
        <button className="btn-primary" onClick={onComplete}>← Back to Dashboard</button>
      </div>
    );
  }

  if (!connected) {
    return (
      <div style={{ textAlign:"center", padding:"64px 32px" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>◈</div>
        <div style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>Connect your wallet</div>
        <div style={{ fontSize:14, color:"var(--text-secondary)", marginBottom:28 }}>You need a wallet connected to Arc Testnet to send.</div>
        <button className="btn-primary" onClick={onConnect}>Connect Wallet</button>
      </div>
    );
  }

  return (
    <div>
      {/* Step progress */}
      <div className="step-progress">
        {STEPS.map((s, i) => (
          <div key={s} style={{ display:"flex", alignItems:"center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
            <div className={`step-item ${step === i+1 ? "active" : step > i+1 ? "done" : ""}`}>
              <div className="step-num">{step > i+1 ? "✓" : i+1}</div>
              <span>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`step-line ${step > i+1 ? "done" : ""}`} />}
          </div>
        ))}
      </div>

      <div className="send-layout">
        {/* Left: step content */}
        <div>
          {step === 1 && (
            <div className="card">
              <div className="card-title">Select destination corridor</div>
              <div className="corridor-grid">
                {CORRIDORS.map(c => (
                  <div key={c.code} className={`corridor-card ${corridor?.code === c.code ? "selected" : ""}`} onClick={() => setCorridor(c)}>
                    <div className="corridor-flag">{c.flag}</div>
                    <div className="corridor-name">{c.name}</div>
                    <div className="corridor-rate">1 USDC = {c.rate} {c.currency}</div>
                    <div className="corridor-fee-chip">Fee ${c.fee.toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button className="btn-secondary" onClick={onBack}>Cancel</button>
                <button className="btn-primary" disabled={!canNext2} onClick={() => setStep(2)}>Continue →</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="card">
              <div className="card-title">Enter amount and recipient</div>
              <label className="field-label">Amount (AED)</label>
              <div className="amount-wrap">
                <span className="amount-prefix">AED</span>
                <input type="number" className="amount-input" placeholder="0" min={10} value={aedAmount} onChange={e => setAedAmount(e.target.value)} />
              </div>
              {aedAmount && parseFloat(aedAmount) > 0 && (
                <div className="conversion-row">
                  <span style={{ color:"var(--text-secondary)", fontSize:12 }}>AED {parseFloat(aedAmount).toFixed(2)}</span>
                  <span className="conv-arrow">→</span>
                  <span className="conv-usdc">{usdcAmt} USDC</span>
                  <span className="conv-arrow">→</span>
                  <span className="conv-local">{corridor?.currency} {localAmt}</span>
                </div>
              )}
              <label className="field-label">Recipient name</label>
              <input type="text" className="text-input" placeholder="e.g. Priya Sharma" value={recipient} onChange={e => setRecipient(e.target.value)} />
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
                <button className="btn-primary" disabled={!canNext3} onClick={() => setStep(3)}>Continue →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="card">
              <div className="card-title">Choose payout method</div>
              <div className="payout-grid">
                {PAYOUT_METHODS.map(m => (
                  <div key={m.id} className={`payout-card ${payout === m.id ? "selected" : ""}`} onClick={() => setPayout(m.id)}>
                    <div className="payout-icon">{m.icon}</div>
                    <div className="payout-name">{m.name}</div>
                    <div className="payout-desc">{m.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button className="btn-secondary" onClick={() => setStep(2)}>← Back</button>
                <button className="btn-primary" disabled={!canNext4} onClick={() => setStep(4)}>Continue →</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="card">
              <div className="card-title">AI route preview</div>
              <div style={{ padding:"10px 14px", background:"var(--accent-dim)", border:"1px solid rgba(0,212,255,0.2)", borderRadius:"var(--radius-md)", marginBottom:20, fontSize:13, color:"var(--accent)" }}>
                ◈ Optimal route selected · Estimated delivery: &lt;30 seconds · Savings vs. SWIFT: ~94%
              </div>
              <div className="route-steps">
                {[
                  { icon:"◈", cls:"blue",  name:"Circle Embedded Wallet",  desc:"User wallet on Arc Testnet" },
                  { icon:"$", cls:"amber", name:"USDC on Arc",              desc:"Settlement + gas in USDC" },
                  { icon:"⇄", cls:"green", name:"CCTP Bridge Kit",          desc:`Cross-chain to ${corridor?.chain}` },
                  { icon:"⬡", cls:"blue",  name:"Circle Gateway",           desc:"Treasury routing + off-ramp" },
                  { icon:"✓", cls:"green", name:`Recipient in ${corridor?.name}`, desc:`${PAYOUT_METHODS.find(m=>m.id===payout)?.name}` },
                ].map((n, i, arr) => (
                  <div key={i}>
                    <div className="route-node">
                      <div className={`route-icon ${n.cls}`}>{n.icon}</div>
                      <div><div className="route-name">{n.name}</div><div className="route-desc">{n.desc}</div></div>
                    </div>
                    {i < arr.length - 1 && <div className="route-arrow">↓</div>}
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button className="btn-secondary" onClick={() => setStep(3)}>← Back</button>
                <button className="btn-primary" onClick={() => setStep(5)}>Confirm Route →</button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="card">
              <div className="card-title">Final confirmation</div>
              <div style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:20, lineHeight:1.7 }}>
                Please review your transfer details below. Once confirmed, USDC will be deducted from your wallet and the transfer will be settled on Arc testnet in real time.
              </div>
              {error && <div className="error-box">{error}</div>}
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button className="btn-secondary" onClick={() => setStep(4)}>← Back</button>
                <button className="btn-primary" onClick={handleSend} disabled={loading}>
                  {loading ? <><span className="spinner" /> Processing on Arc...</> : "Confirm and Send ↗"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: review panel */}
        <div className="review-panel">
          <div className="review-header">Transfer Summary</div>
          <div className="review-row"><span className="review-key">To</span><span className="review-val">{recipient || "—"}</span></div>
          <div className="review-row"><span className="review-key">Destination</span><span className="review-val">{corridor ? `${corridor.flag} ${corridor.name}` : "—"}</span></div>
          <div className="review-row"><span className="review-key">AED amount</span><span className="review-val">{aedAmount ? `AED ${parseFloat(aedAmount).toFixed(2)}` : "—"}</span></div>
          <div className="review-row"><span className="review-key">USDC settled</span><span className="review-val review-accent">{usdcAmt} USDC</span></div>
          <div className="review-row"><span className="review-key">Local equivalent</span><span className="review-val">{corridor ? `${corridor.currency} ${localAmt}` : "—"}</span></div>
          <div className="review-row"><span className="review-key">Network fee</span><span className="review-val">{fee} USDC</span></div>
          <div className="review-row"><span className="review-key">Payout method</span><span className="review-val">{PAYOUT_METHODS.find(m=>m.id===payout)?.name || "—"}</span></div>
          <div className="review-row"><span className="review-key">Settlement</span><span className="review-val review-green">Instant finality</span></div>
          <div className="review-row"><span className="review-key">Rail</span><span className="review-val"><span className="circle-badge">◈ USDC on Arc</span></span></div>
          <div className="review-total">
            <span className="review-total-label">Total</span>
            <span className="review-total-val">{total} USDC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
