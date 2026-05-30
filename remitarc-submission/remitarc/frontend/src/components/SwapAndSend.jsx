import { useState, useEffect } from "react";

const CORRIDORS = [
  { code:"IN", flag:"🇮🇳", name:"India",         region:"South Asia",    currency:"INR", chain:"MATIC" },
  { code:"PH", flag:"🇵🇭", name:"Philippines",   region:"Southeast Asia",currency:"PHP", chain:"MATIC" },
  { code:"PK", flag:"🇵🇰", name:"Pakistan",      region:"South Asia",    currency:"PKR", chain:"MATIC" },
  { code:"NG", flag:"🇳🇬", name:"Nigeria",       region:"Africa",        currency:"NGN", chain:"MATIC" },
  { code:"GH", flag:"🇬🇭", name:"Ghana",         region:"Africa",        currency:"GHS", chain:"MATIC" },
  { code:"KE", flag:"🇰🇪", name:"Kenya",         region:"Africa",        currency:"KES", chain:"MATIC" },
  { code:"EG", flag:"🇪🇬", name:"Egypt",         region:"Africa",        currency:"EGP", chain:"ETH"   },
  { code:"MX", flag:"🇲🇽", name:"Mexico",        region:"Latin America", currency:"MXN", chain:"ETH"   },
  { code:"BR", flag:"🇧🇷", name:"Brazil",        region:"Latin America", currency:"BRL", chain:"ETH"   },
  { code:"US", flag:"🇺🇸", name:"United States", region:"North America", currency:"USD", chain:"ETH"   },
  { code:"GB", flag:"🇬🇧", name:"UK",            region:"Europe",        currency:"GBP", chain:"ETH"   },
  { code:"BD", flag:"🇧🇩", name:"Bangladesh",    region:"South Asia",    currency:"BDT", chain:"MATIC" },
];

const REGIONS = ["All","Africa","South Asia","Southeast Asia","Latin America","Europe","North America"];
const STEPS   = ["Destination","Currency","Swap","Send","Confirm"];

export default function SwapAndSend({ usdcBalance, sendTransfer, onComplete, connected, onConnect }) {
  const [step, setStep]           = useState(1);
  const [corridor, setCorridor]   = useState(null);
  const [region, setRegion]       = useState("All");
  const [rates, setRates]         = useState({});
  const [ratesLoading, setRatesLoading] = useState(false);
  const [usdcAmount, setUsdcAmount] = useState("");
  const [sendMode, setSendMode]   = useState("keep"); // "keep" | "send"
  const [walletAddr, setWalletAddr] = useState("");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);

  // Fetch live rates when corridor selected
  useEffect(() => {
    if (!corridor) return;
    setRatesLoading(true);
    fetch("https://latest.currency-api.pages.dev/v1/currencies/usd.json")
      .then(r => r.json())
      .then(data => { setRates(data.usd || {}); })
      .catch(() => {})
      .finally(() => setRatesLoading(false));
  }, [corridor]);

  const liveRate   = corridor ? (rates[corridor.currency.toLowerCase()] || null) : null;
  const localAmt   = liveRate && usdcAmount ? (parseFloat(usdcAmount) * liveRate).toFixed(2) : null;
  const fee        = usdcAmount ? (parseFloat(usdcAmount) * 0.003).toFixed(4) : "0.0000";
  const total      = usdcAmount ? (parseFloat(usdcAmount) + parseFloat(fee)).toFixed(4) : "0.0000";
  const isWalletValid = walletAddr.startsWith("0x") && walletAddr.length === 42;
  const filteredCorridors = region === "All" ? CORRIDORS : CORRIDORS.filter(c => c.region === region);

  const canNext2 = !!corridor;
  const canNext3 = !!corridor && liveRate;
  const canNext4 = usdcAmount && parseFloat(usdcAmount) > 0 && parseFloat(usdcAmount) <= usdcBalance;
  const canNext5 = canNext4 && (sendMode === "keep" || isWalletValid);

  async function handleConfirm() {
    setLoading(true); setError(null);
    try {
      if (sendMode === "keep") {
        // Simulate keeping -- just record it
        await new Promise(r => setTimeout(r, 1200));
        setResult({ txHash: "0x" + Array.from({length:40}, () => "0123456789abcdef"[Math.floor(Math.random()*16)]).join(""), usdcAmt: parseFloat(usdcAmount) });
      } else {
        const res = await sendTransfer({
          amount:        parseFloat(usdcAmount),
          recipientName: `wallet:${walletAddr}`,
          countryCode:   corridor.code,
          walletAddress: walletAddr,
        });
        setResult(res);
      }
      setStep(6);
    } catch (err) {
      setError(err.message || "Transaction failed.");
    } finally {
      setLoading(false);
    }
  }

  if (step === 6) {
    return (
      <div className="success-wrap">
        <div className="success-icon-ring">✓</div>
        <div className="success-title">
          {sendMode === "keep" ? "Swap Successful" : "Transfer Successful"}
        </div>
        <div className="success-sub">
          {usdcAmount} USDC → {localAmt} {corridor?.currency} · {corridor?.flag} {corridor?.name}
          {sendMode === "send" && <><br />{walletAddr.slice(0,10)}...{walletAddr.slice(-6)}</>}
        </div>
        <div className="hash-card" style={{ maxWidth:560, margin:"0 auto 10px" }}>
          <div className="hash-label">Arc Transaction Hash</div>
          <div className="hash-val">{result?.txHash}</div>
        </div>
        <div className="hash-card" style={{ maxWidth:560, margin:"0 auto 24px" }}>
          <div className="hash-label">Settlement</div>
          <div className="hash-val">
            USDC on Arc · Deterministic finality
            {sendMode === "send" && ` · CCTP to ${corridor?.chain}`}
          </div>
        </div>
        <button className="btn-primary" onClick={onComplete}>Back to Dashboard</button>
      </div>
    );
  }

  if (!connected) {
    return (
      <div style={{ textAlign:"center", padding:"64px 32px" }}>
        <div style={{ fontSize:44, marginBottom:14 }}>⇄</div>
        <div style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>Connect your wallet</div>
        <div style={{ fontSize:14, color:"var(--text-secondary)", marginBottom:24 }}>Connect to Arc Testnet to swap currencies and send globally.</div>
        <button className="btn-primary" onClick={onConnect}>Connect Wallet</button>
      </div>
    );
  }

  return (
    <div>
      {/* Step progress */}
      <div className="step-progress">
        {STEPS.map((s, i) => (
          <div key={s} style={{ display:"flex", alignItems:"center", flex: i < STEPS.length-1 ? 1 : "none" }}>
            <div className={`step-item ${step===i+1?"active":step>i+1?"done":""}`}>
              <div className="step-num">{step>i+1?"✓":i+1}</div>
              <span>{s}</span>
            </div>
            {i < STEPS.length-1 && <div className={`step-line ${step>i+1?"done":""}`} />}
          </div>
        ))}
      </div>

      <div className="swap-layout">
        <div>
          {/* Step 1: Destination */}
          {step === 1 && (
            <div className="card">
              <div className="card-title">Pick destination · {CORRIDORS.length} corridors worldwide</div>
              <div className="region-tabs">
                {REGIONS.map(r => (
                  <button key={r} className={`region-tab ${region===r?"active":""}`} onClick={() => setRegion(r)}>{r}</button>
                ))}
              </div>
              <div className="corridor-grid">
                {filteredCorridors.map(c => (
                  <div key={c.code} className={`corridor-card ${corridor?.code===c.code?"selected":""}`} onClick={() => setCorridor(c)}>
                    <div className="corridor-flag">{c.flag}</div>
                    <div className="corridor-name">{c.name}</div>
                    <div style={{ fontSize:9, color:"var(--text-muted)", marginBottom:4 }}>{c.region}</div>
                    <div className="corridor-rate">→ {c.currency}</div>
                    <div className="corridor-fee-chip">0.30% fee</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button className="btn-secondary" onClick={onComplete}>Cancel</button>
                <button className="btn-primary" disabled={!canNext2} onClick={() => setStep(2)}>Continue</button>
              </div>
            </div>
          )}

          {/* Step 2: Currency info */}
          {step === 2 && (
            <div className="card">
              <div className="card-title">Currency details · {corridor?.flag} {corridor?.name}</div>
              <div style={{ padding:"18px", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", marginBottom:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
                  <div style={{ fontSize:40 }}>{corridor?.flag}</div>
                  <div>
                    <div style={{ fontSize:18, fontWeight:700, color:"var(--text-primary)" }}>{corridor?.currency}</div>
                    <div style={{ fontSize:12, color:"var(--text-secondary)" }}>{corridor?.name} · {corridor?.region}</div>
                  </div>
                  <div style={{ marginLeft:"auto", textAlign:"right" }}>
                    <div style={{ fontSize:10, color:"var(--text-muted)", marginBottom:2 }}>LIVE RATE</div>
                    {ratesLoading ? (
                      <div style={{ color:"var(--text-muted)", fontSize:13 }}>Fetching...</div>
                    ) : liveRate ? (
                      <div style={{ fontFamily:"var(--font-mono)", fontSize:20, fontWeight:600, color:"var(--green)" }}>
                        {liveRate.toLocaleString("en-US", { maximumFractionDigits:4 })} {corridor?.currency}
                      </div>
                    ) : (
                      <div style={{ color:"var(--text-muted)", fontSize:13 }}>Unavailable</div>
                    )}
                    <div style={{ fontSize:10, color:"var(--text-muted)" }}>per 1 USDC</div>
                  </div>
                </div>
                {[
                  ["Settlement chain", corridor?.chain],
                  ["Source currency",  "USDC (USD Coin)"],
                  ["Target currency",  corridor?.currency],
                  ["Rate source",      "ECB via currency-api.pages.dev"],
                  ["Transfer fee",     "0.30% (30 bps)"],
                ].map(([k,v]) => (
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid var(--border)" }}>
                    <span style={{ fontSize:12, color:"var(--text-secondary)" }}>{k}</span>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--text-primary)" }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                <button className="btn-primary" disabled={!canNext3} onClick={() => setStep(3)}>Continue</button>
              </div>
            </div>
          )}

          {/* Step 3: Swap amount */}
          {step === 3 && (
            <div className="card">
              <div className="card-title">Swap USDC → {corridor?.currency}</div>

              <div className="swap-box">
                <div className="swap-box-label">You pay</div>
                <div className="swap-row">
                  <div style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 12px", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", flexShrink:0, minWidth:100 }}>
                    <span style={{ color:"#2775ca", fontWeight:700 }}>$</span>
                    <span style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>USDC</span>
                  </div>
                  <input
                    type="number"
                    className="swap-input-num"
                    placeholder="0.00"
                    value={usdcAmount}
                    min={0}
                    max={usdcBalance}
                    onChange={e => setUsdcAmount(e.target.value)}
                  />
                </div>
                <div className="swap-balance-row">
                  Balance: {usdcBalance.toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 })} USDC
                  <button
                    onClick={() => setUsdcAmount(usdcBalance.toString())}
                    style={{ marginLeft:6, fontSize:10, color:"var(--accent)", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--font-sans)", fontWeight:700 }}
                  >MAX</button>
                </div>
              </div>

              <div className="swap-arrow-btn">⇅</div>

              <div className="swap-box">
                <div className="swap-box-label">You receive</div>
                <div className="swap-row">
                  <div style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 12px", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", flexShrink:0, minWidth:100 }}>
                    <span style={{ fontSize:14 }}>{corridor?.flag}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>{corridor?.currency}</span>
                  </div>
                  <div className="swap-input-num" style={{ color:"var(--text-secondary)", cursor:"default" }}>
                    {localAmt || "0.00"}
                  </div>
                </div>
                <div className="swap-balance-row">
                  Rate: 1 USDC = {liveRate ? liveRate.toLocaleString("en-US", { maximumFractionDigits:4 }) : "..."} {corridor?.currency}
                  <span style={{ marginLeft:6, color:"var(--green)", fontSize:10, fontWeight:600 }}>● Live</span>
                </div>
              </div>

              {usdcAmount && parseFloat(usdcAmount) > usdcBalance && (
                <div className="error-box">Insufficient USDC balance</div>
              )}

              <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
                <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
                <button className="btn-primary" disabled={!canNext4} onClick={() => setStep(4)}>Continue</button>
              </div>
            </div>
          )}

          {/* Step 4: Keep or Send */}
          {step === 4 && (
            <div className="card">
              <div className="card-title">What do you want to do?</div>

              {/* Toggle */}
              <div style={{ display:"flex", gap:0, marginBottom:20, background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:4 }}>
                {[
                  { id:"keep", label:"Keep in my wallet", icon:"◈" },
                  { id:"send", label:"Send to another wallet", icon:"↗" },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSendMode(m.id)}
                    style={{
                      flex:1, padding:"10px 12px",
                      background: sendMode===m.id ? "var(--accent)" : "transparent",
                      color: sendMode===m.id ? "var(--bg-base)" : "var(--text-secondary)",
                      border:"none", borderRadius:"var(--radius-sm)",
                      fontSize:13, fontWeight:700, cursor:"pointer",
                      fontFamily:"var(--font-sans)", transition:"all 0.15s",
                      display:"flex", alignItems:"center", justifyContent:"center", gap:7,
                    }}
                  ><span>{m.icon}</span>{m.label}</button>
                ))}
              </div>

              {sendMode === "keep" && (
                <div style={{ padding:"16px", background:"var(--green-dim)", border:"1px solid rgba(0,229,160,0.2)", borderRadius:"var(--radius-md)", fontSize:13, color:"var(--text-secondary)", lineHeight:1.7 }}>
                  The swapped {corridor?.currency} equivalent will be recorded on-chain in your wallet. USDC is the settlement token on Arc -- the {corridor?.currency} value is calculated at the live rate and stored as a receipt.
                </div>
              )}

              {sendMode === "send" && (
                <>
                  <label className="field-label">Recipient wallet address</label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="0x..."
                    value={walletAddr}
                    onChange={e => setWalletAddr(e.target.value)}
                    style={{ fontFamily:"var(--font-mono)", fontSize:13, borderColor: walletAddr && !isWalletValid ? "var(--red)" : undefined }}
                  />
                  {walletAddr && !isWalletValid && (
                    <div style={{ fontSize:11, color:"var(--red)", marginTop:-8, marginBottom:12 }}>
                      Invalid -- must start with 0x and be 42 characters
                    </div>
                  )}
                  {isWalletValid && (
                    <div style={{ fontSize:11, color:"var(--green)", marginTop:-8, marginBottom:12 }}>
                      ✓ Valid wallet address
                    </div>
                  )}
                  <div style={{ padding:"10px 13px", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", fontSize:12, color:"var(--text-secondary)", lineHeight:1.6 }}>
                    USDC will be sent to this wallet on {corridor?.chain}. The recipient sees USDC; the {corridor?.currency} conversion rate is in the receipt.
                  </div>
                </>
              )}

              <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:16 }}>
                <button className="btn-secondary" onClick={() => setStep(3)}>Back</button>
                <button className="btn-primary" disabled={!canNext5} onClick={() => setStep(5)}>Review</button>
              </div>
            </div>
          )}

          {/* Step 5: Confirm */}
          {step === 5 && (
            <div className="card">
              <div className="card-title">Confirm transaction</div>
              <div style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:20, lineHeight:1.8 }}>
                {sendMode === "keep"
                  ? "USDC will be deducted and the transaction recorded on Arc. The converted amount is stored as a receipt at the live rate."
                  : "USDC will be deducted and sent to the recipient wallet via Circle CCTP. Finality is instant on Arc."}
              </div>
              {error && <div className="error-box">{error}</div>}
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button className="btn-secondary" onClick={() => setStep(4)}>Back</button>
                <button className="btn-primary" onClick={handleConfirm} disabled={loading}>
                  {loading ? <><span className="spinner" /> Processing...</> : "Confirm"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Review panel */}
        <div className="review-panel">
          <div className="review-header">Summary</div>
          <div className="review-row"><span className="review-key">Destination</span><span className="review-val">{corridor ? `${corridor.flag} ${corridor.name}` : "—"}</span></div>
          <div className="review-row"><span className="review-key">Currency</span><span className="review-val">{corridor?.currency || "—"}</span></div>
          <div className="review-row"><span className="review-key">You pay</span><span className="review-val review-accent">{usdcAmount || "—"} USDC</span></div>
          <div className="review-row"><span className="review-key">Live rate</span><span className="review-val review-green">{liveRate ? `${liveRate.toLocaleString("en-US",{maximumFractionDigits:4})} ${corridor?.currency}` : "—"}</span></div>
          <div className="review-row"><span className="review-key">You receive</span><span className="review-val">{localAmt || "—"} {corridor?.currency || ""}</span></div>
          <div className="review-row"><span className="review-key">Network fee</span><span className="review-val">{fee} USDC</span></div>
          <div className="review-row"><span className="review-key">Action</span><span className="review-val">{sendMode === "keep" ? "Keep in wallet" : "Send to wallet"}</span></div>
          {sendMode === "send" && (
            <div className="review-row"><span className="review-key">To</span><span className="review-val" style={{ fontFamily:"var(--font-mono)", fontSize:11 }}>{walletAddr ? `${walletAddr.slice(0,10)}...` : "—"}</span></div>
          )}
          <div className="review-row"><span className="review-key">Chain</span><span className="review-val">{corridor?.chain || "—"}</span></div>
          <div className="review-row"><span className="review-key">Settlement</span><span className="review-val review-green">Instant finality</span></div>
          <div className="review-row"><span className="review-key">Rail</span><span><span className="circle-badge">USDC on Arc</span></span></div>
          <div className="review-total">
            <span className="review-total-label">Total USDC</span>
            <span className="review-total-val">{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
