import { useState } from "react";

const CORRIDORS = [
  { code:"IN", flag:"🇮🇳", name:"India",         region:"South Asia",    currency:"INR", rate:83.12,  fee:0.50, chain:"MATIC" },
  { code:"PH", flag:"🇵🇭", name:"Philippines",   region:"Southeast Asia",currency:"PHP", rate:58.20,  fee:0.40, chain:"MATIC" },
  { code:"PK", flag:"🇵🇰", name:"Pakistan",      region:"South Asia",    currency:"PKR", rate:278.50, fee:0.45, chain:"MATIC" },
  { code:"NG", flag:"🇳🇬", name:"Nigeria",       region:"Africa",        currency:"NGN", rate:1610.0, fee:0.55, chain:"MATIC" },
  { code:"GH", flag:"🇬🇭", name:"Ghana",         region:"Africa",        currency:"GHS", rate:15.20,  fee:0.55, chain:"MATIC" },
  { code:"KE", flag:"🇰🇪", name:"Kenya",         region:"Africa",        currency:"KES", rate:129.50, fee:0.50, chain:"MATIC" },
  { code:"EG", flag:"🇪🇬", name:"Egypt",         region:"Africa",        currency:"EGP", rate:48.70,  fee:0.60, chain:"ETH"   },
  { code:"MX", flag:"🇲🇽", name:"Mexico",        region:"Latin America", currency:"MXN", rate:17.20,  fee:0.40, chain:"ETH"   },
  { code:"BR", flag:"🇧🇷", name:"Brazil",        region:"Latin America", currency:"BRL", rate:5.10,   fee:0.40, chain:"ETH"   },
  { code:"US", flag:"🇺🇸", name:"United States", region:"North America", currency:"USD", rate:1.00,   fee:0.30, chain:"ETH"   },
  { code:"GB", flag:"🇬🇧", name:"UK",            region:"Europe",        currency:"GBP", rate:0.792,  fee:0.40, chain:"ETH"   },
  { code:"BD", flag:"🇧🇩", name:"Bangladesh",    region:"South Asia",    currency:"BDT", rate:110.0,  fee:0.45, chain:"MATIC" },
];

const REGIONS = ["All","Africa","South Asia","Southeast Asia","Latin America","Europe","North America"];

// Swap exchange rates relative to USDC
const SWAP_RATES = {
  USDC: 1.000, ETH: 3186.0, MATIC: 0.55, AVAX: 30.0, ARB: 0.62,
};

const STEPS = ["Swap","Destination","Send","Confirm"];

export default function SwapAndSend({ balances, sendTransfer, onComplete, connected, onConnect }) {
  const [step, setStep]           = useState(1);
  const [fromSymbol, setFromSymbol] = useState("USDC");
  const [fromAmount, setFromAmount] = useState("");
  const [toSymbol, setToSymbol]   = useState("USDC");
  const [region, setRegion]       = useState("All");
  const [corridor, setCorridor]   = useState(null);
  const [walletAddr, setWalletAddr] = useState("");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);

  const fromBal  = balances.find(b => b.symbol === fromSymbol);
  const toBal    = balances.find(b => b.symbol === toSymbol);
  const fromRate = SWAP_RATES[fromSymbol] || 1;
  const toRate   = SWAP_RATES[toSymbol]   || 1;
  const fromUSD  = fromAmount ? parseFloat(fromAmount) * fromRate : 0;
  const toAmount = fromUSD > 0 ? (fromUSD / toRate).toFixed(6) : "0.000000";
  const usdcOut  = toSymbol === "USDC" ? parseFloat(toAmount) : fromUSD;
  const fee      = corridor ? (usdcOut * 0.003).toFixed(4) : "0.0000";
  const localAmt = corridor && fromAmount ? (usdcOut * corridor.rate).toFixed(2) : "0.00";
  const total    = (usdcOut + parseFloat(fee || 0)).toFixed(4);

  const isWalletValid = walletAddr.startsWith("0x") && walletAddr.length === 42;
  const filteredCorridors = region === "All" ? CORRIDORS : CORRIDORS.filter(c => c.region === region);

  function swapTokens() {
    const tmp = fromSymbol;
    setFromSymbol(toSymbol);
    setToSymbol(tmp);
    setFromAmount("");
  }

  async function handleSend() {
    setLoading(true); setError(null);
    try {
      const res = await sendTransfer({
        amount:       usdcOut,
        recipientName:`wallet:${walletAddr}`,
        countryCode:  corridor.code,
        walletAddress: walletAddr,
        fromSymbol,
      });
      setResult(res);
      setStep(5);
    } catch (err) {
      setError(err.message || "Transaction failed.");
    } finally {
      setLoading(false);
    }
  }

  if (step === 5) {
    return (
      <div className="success-wrap">
        <div className="success-icon-ring">✓</div>
        <div className="success-title">Transfer Successful</div>
        <div className="success-sub">
          {fromAmount} {fromSymbol} swapped and sent · {corridor?.flag} {corridor?.name}
        </div>
        <div className="hash-card" style={{ maxWidth:560, margin:"0 auto 10px" }}>
          <div className="hash-label">Arc Transaction Hash</div>
          <div className="hash-val">{result?.txHash}</div>
        </div>
        <div className="hash-card" style={{ maxWidth:560, margin:"0 auto 24px" }}>
          <div className="hash-label">Settlement</div>
          <div className="hash-val">USDC on Arc · Deterministic finality · CCTP to {corridor?.chain}</div>
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
        <div style={{ fontSize:14, color:"var(--text-secondary)", marginBottom:24 }}>Connect to Arc Testnet to swap and send.</div>
        <button className="btn-primary" onClick={onConnect}>Connect Wallet</button>
      </div>
    );
  }

  return (
    <div>
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
          {/* Step 1: Swap */}
          {step === 1 && (
            <div className="card">
              <div className="card-title">Swap tokens</div>

              {/* From */}
              <div className="swap-box">
                <div className="swap-box-label">From</div>
                <div className="swap-row">
                  <select
                    className="swap-select"
                    value={fromSymbol}
                    onChange={e => setFromSymbol(e.target.value)}
                    style={{ background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text-primary)", padding:"8px 10px", borderRadius:"var(--radius-md)", fontFamily:"var(--font-sans)", fontSize:13, fontWeight:600, cursor:"pointer" }}
                  >
                    {balances.map(b => <option key={b.symbol} value={b.symbol}>{b.symbol}</option>)}
                  </select>
                  <input
                    type="number"
                    className="swap-input-num"
                    placeholder="0.00"
                    value={fromAmount}
                    min={0}
                    max={fromBal?.amount}
                    onChange={e => setFromAmount(e.target.value)}
                  />
                </div>
                <div className="swap-balance-row">
                  Balance: {fromBal?.amount.toLocaleString("en-US", { maximumFractionDigits:4 })} {fromSymbol}
                  <button
                    onClick={() => setFromAmount(fromBal?.amount.toString())}
                    style={{ marginLeft:6, fontSize:10, color:"var(--accent)", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--font-sans)", fontWeight:700 }}
                  >MAX</button>
                </div>
              </div>

              {/* Swap arrow */}
              <button className="swap-arrow-btn" onClick={swapTokens}>⇅</button>

              {/* To */}
              <div className="swap-box">
                <div className="swap-box-label">To</div>
                <div className="swap-row">
                  <select
                    className="swap-select"
                    value={toSymbol}
                    onChange={e => setToSymbol(e.target.value)}
                    style={{ background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text-primary)", padding:"8px 10px", borderRadius:"var(--radius-md)", fontFamily:"var(--font-sans)", fontSize:13, fontWeight:600, cursor:"pointer" }}
                  >
                    {balances.map(b => <option key={b.symbol} value={b.symbol}>{b.symbol}</option>)}
                  </select>
                  <div className="swap-input-num" style={{ cursor:"default", color:"var(--text-secondary)" }}>
                    {toAmount}
                  </div>
                </div>
                <div className="swap-balance-row">
                  Balance: {toBal?.amount.toLocaleString("en-US", { maximumFractionDigits:4 })} {toSymbol}
                </div>
              </div>

              {/* Rate */}
              {fromAmount && parseFloat(fromAmount) > 0 && (
                <div className="rate-chip">
                  <span>Rate</span>
                  <span>1 {fromSymbol} = {(fromRate / toRate).toFixed(6)} {toSymbol}</span>
                  <span style={{ color:"var(--green)" }}>≈ ${fromUSD.toFixed(2)} USD</span>
                </div>
              )}

              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button className="btn-secondary" onClick={onComplete}>Cancel</button>
                <button
                  className="btn-primary"
                  disabled={!fromAmount || parseFloat(fromAmount) <= 0}
                  onClick={() => setStep(2)}
                >Continue</button>
              </div>
            </div>
          )}

          {/* Step 2: Destination */}
          {step === 2 && (
            <div className="card">
              <div className="card-title">Select destination · {CORRIDORS.length} corridors worldwide</div>
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
                    <div style={{ fontSize:9, color:"var(--text-muted)", marginBottom:3 }}>{c.region}</div>
                    <div className="corridor-rate">1 USDC = {c.rate} {c.currency}</div>
                    <div className="corridor-fee-chip">Fee ${c.fee.toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                <button className="btn-primary" disabled={!corridor} onClick={() => setStep(3)}>Continue</button>
              </div>
            </div>
          )}

          {/* Step 3: Recipient wallet */}
          {step === 3 && (
            <div className="card">
              <div className="card-title">Recipient wallet address</div>
              <label className="field-label">Wallet address</label>
              <input
                type="text"
                className="text-input"
                placeholder="0x..."
                value={walletAddr}
                onChange={e => setWalletAddr(e.target.value)}
                style={{ fontFamily:"var(--font-mono)", fontSize:13,
                  borderColor: walletAddr && !isWalletValid ? "var(--red)" : undefined }}
              />
              {walletAddr && !isWalletValid && (
                <div style={{ fontSize:11, color:"var(--red)", marginTop:-8, marginBottom:12 }}>
                  Invalid address -- must start with 0x and be 42 characters
                </div>
              )}
              {isWalletValid && (
                <div style={{ fontSize:11, color:"var(--green)", marginTop:-8, marginBottom:12 }}>
                  ✓ Valid wallet address
                </div>
              )}
              <div style={{ padding:"10px 13px", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", fontSize:12, color:"var(--text-secondary)", marginBottom:16, lineHeight:1.6 }}>
                USDC will be sent to this wallet on {corridor?.chain}. Make sure the address supports {corridor?.chain} network tokens.
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
                <button className="btn-primary" disabled={!isWalletValid} onClick={() => setStep(4)}>Review</button>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div className="card">
              <div className="card-title">Confirm swap and send</div>
              <div style={{ display:"flex", flexDirection:"column", gap:0, marginBottom:20 }}>
                {[
                  { icon:"◈", cls:"blue",  name:"Your Wallet",      desc:`${fromAmount} ${fromSymbol} · Arc Testnet`       },
                  { icon:"⇄", cls:"amber", name:"Swap",              desc:`${fromAmount} ${fromSymbol} → ${toAmount} ${toSymbol}` },
                  { icon:"$", cls:"green", name:"USDC Settlement",   desc:`${usdcOut.toFixed(4)} USDC · 30 bps fee`          },
                  { icon:"⬡", cls:"blue",  name:"CCTP Bridge",       desc:`Arc → ${corridor?.chain}`                         },
                  { icon:"✓", cls:"green", name:corridor?.name,      desc:`${walletAddr.slice(0,10)}...${walletAddr.slice(-6)}` },
                ].map((n, i, arr) => (
                  <div key={i}>
                    <div className="route-node">
                      <div className={`route-icon ${n.cls}`}>{n.icon}</div>
                      <div><div className="route-name">{n.name}</div><div className="route-desc">{n.desc}</div></div>
                    </div>
                    {i < arr.length-1 && <div className="route-arrow">↓</div>}
                  </div>
                ))}
              </div>
              {error && <div className="error-box">{error}</div>}
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button className="btn-secondary" onClick={() => setStep(3)}>Back</button>
                <button className="btn-primary" onClick={handleSend} disabled={loading}>
                  {loading ? <><span className="spinner" /> Processing...</> : "Confirm and Send"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Review panel */}
        <div className="review-panel">
          <div className="review-header">Swap + Send Summary</div>
          <div className="review-row"><span className="review-key">Swap from</span><span className="review-val">{fromAmount || "—"} {fromSymbol}</span></div>
          <div className="review-row"><span className="review-key">Swap to</span><span className="review-val review-accent">{toAmount} {toSymbol}</span></div>
          <div className="review-row"><span className="review-key">USD value</span><span className="review-val">${fromUSD.toFixed(2)}</span></div>
          <div className="review-row"><span className="review-key">Destination</span><span className="review-val">{corridor ? `${corridor.flag} ${corridor.name}` : "—"}</span></div>
          <div className="review-row"><span className="review-key">Local equiv</span><span className="review-val">{corridor ? `${corridor.currency} ${localAmt}` : "—"}</span></div>
          <div className="review-row"><span className="review-key">To wallet</span><span className="review-val" style={{ fontFamily:"var(--font-mono)", fontSize:11 }}>{walletAddr ? `${walletAddr.slice(0,10)}...` : "—"}</span></div>
          <div className="review-row"><span className="review-key">Network fee</span><span className="review-val">{fee} USDC</span></div>
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
