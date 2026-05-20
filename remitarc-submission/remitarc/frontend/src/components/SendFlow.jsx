// frontend/src/components/SendFlow.jsx
import { useState } from "react";

const CORRIDORS = [
  { code: "IN", flag: "🇮🇳", name: "India",         currency: "INR", rate: 83.12, fee: 0.50 },
  { code: "PH", flag: "🇵🇭", name: "Philippines",   currency: "PHP", rate: 58.20, fee: 0.40 },
  { code: "PK", flag: "🇵🇰", name: "Pakistan",      currency: "PKR", rate: 278.50, fee: 0.45 },
  { code: "EG", flag: "🇪🇬", name: "Egypt",         currency: "EGP", rate: 48.70, fee: 0.60 },
  { code: "US", flag: "🇺🇸", name: "United States", currency: "USD", rate: 1.00,  fee: 0.30 },
  { code: "GB", flag: "🇬🇧", name: "UK",            currency: "GBP", rate: 0.792, fee: 0.40 },
];

export default function SendFlow({ onBack, onComplete, usdcBalance, sendTransfer }) {
  const [step, setStep]           = useState(1);
  const [corridor, setCorridor]   = useState(null);
  const [aedAmount, setAedAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);

  const usdcAmount  = aedAmount ? (parseFloat(aedAmount) * 0.272).toFixed(2) : "0.00";
  const fee         = corridor ? corridor.fee.toFixed(2) : "0.00";
  const localAmount = corridor && aedAmount
    ? (parseFloat(usdcAmount) * corridor.rate).toFixed(2)
    : "0.00";
  const total = (parseFloat(usdcAmount) + parseFloat(fee)).toFixed(2);

  async function handleSend() {
    setLoading(true);
    setError(null);
    try {
      const res = await sendTransfer({
        aedAmount:    parseFloat(aedAmount),
        recipientName: recipient,
        countryCode:  corridor.code,
      });
      setResult(res);
      setStep(4);
    } catch (err) {
      setError(err.message || "Transaction failed. Check wallet and try again.");
    } finally {
      setLoading(false);
    }
  }

  // Step 4 - success
  if (step === 4) {
    return (
      <div className="screen success-screen">
        <div className="success-icon-wrap">
          <i className="ti ti-circle-check" style={{ fontSize: 36, color: "var(--color-text-success)" }} />
        </div>
        <h2>Transfer sent</h2>
        <p className="muted">{result?.usdcAmt} USDC settled to {recipient} in {corridor.flag} {corridor.name}</p>
        <div className="hash-box">
          <div className="hash-label">Arc transaction hash</div>
          <div className="hash-val">{result?.txHash || "Confirmed on Arc testnet"}</div>
        </div>
        <div className="hash-box">
          <div className="hash-label">Settlement rail</div>
          <div className="hash-val">USDC on Arc · Deterministic finality · Circle CCTP cross-chain</div>
        </div>
        <button className="btn-primary" onClick={onComplete} style={{ marginTop: 16 }}>Done</button>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="back-btn" onClick={step === 1 ? onBack : () => setStep(s => s - 1)}>
          <i className="ti ti-arrow-left" />
        </button>
        <div>
          <div className="screen-title">Send money</div>
          <div className="screen-sub">Step {step} of 3</div>
        </div>
      </div>

      <div className="step-bar">
        {[1, 2, 3].map(n => (
          <div key={n} className={`step-seg ${n <= step ? "done" : ""}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="step-content">
          <div className="field-label">Choose destination</div>
          <div className="corridor-grid">
            {CORRIDORS.map(c => (
              <div
                key={c.code}
                className={`corridor-card ${corridor?.code === c.code ? "selected" : ""}`}
                onClick={() => setCorridor(c)}
              >
                <div className="corridor-flag">{c.flag}</div>
                <div className="corridor-name">{c.name}</div>
                <div className="corridor-rate">1 USDC = {c.rate} {c.currency}</div>
                <div className="corridor-fee">Fee ${c.fee.toFixed(2)}</div>
              </div>
            ))}
          </div>
          <button
            className="btn-primary"
            disabled={!corridor}
            onClick={() => setStep(2)}
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="step-content">
          <div className="field-label">Amount (AED)</div>
          <div className="amount-wrap">
            <span className="amount-prefix">AED</span>
            <input
              type="number"
              className="amount-input"
              placeholder="0"
              value={aedAmount}
              min={10}
              onChange={e => setAedAmount(e.target.value)}
            />
          </div>
          {aedAmount && (
            <div className="conversion-chip">
              <i className="ti ti-arrow-right" style={{ fontSize: 13 }} />
              {usdcAmount} USDC &asymp; {corridor.currency} {localAmount}
            </div>
          )}
          <div className="field-label" style={{ marginTop: 14 }}>Recipient name</div>
          <input
            type="text"
            className="text-input"
            placeholder="e.g. Priya Sharma"
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
          />
          <div className="fee-note">
            <i className="ti ti-shield-check" style={{ fontSize: 13 }} />
            Settled via USDC on Arc · Powered by Circle
          </div>
          <button
            className="btn-primary"
            disabled={!aedAmount || parseFloat(aedAmount) < 10 || recipient.length < 2}
            onClick={() => setStep(3)}
          >
            Review transfer
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="step-content">
          <div className="review-card">
            {[
              ["To",          recipient],
              ["Destination", `${corridor.flag} ${corridor.name}`],
              ["AED amount",  `AED ${parseFloat(aedAmount).toFixed(2)}`],
              ["USDC settled",`${usdcAmount} USDC`],
              ["Network fee", `$${fee}`],
              ["Settlement",  "Instant finality"],
              ["Rail",        "USDC on Arc"],
            ].map(([k, v]) => (
              <div key={k} className="review-row">
                <span className="review-key">{k}</span>
                <span className="review-val">{v}</span>
              </div>
            ))}
          </div>
          <div className="total-row">
            <span>Total deducted</span>
            <span className="total-amount">{total} USDC</span>
          </div>
          {error && <div className="error-box">{error}</div>}
          <button
            className="btn-primary"
            disabled={loading}
            onClick={handleSend}
          >
            {loading
              ? <><span className="spinner" />Processing on Arc...</>
              : "Confirm and send"
            }
          </button>
        </div>
      )}
    </div>
  );
}
