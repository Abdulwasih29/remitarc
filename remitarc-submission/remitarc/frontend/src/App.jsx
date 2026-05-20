// frontend/src/App.jsx
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Dashboard from "./components/Dashboard";
import SendFlow from "./components/SendFlow";
import History from "./components/History";
import Architecture from "./components/Architecture";
import "./App.css";

const CONTRACT_ABI = [
  "function initiateTransfer(string calldata recipientName, string calldata destinationCountry, uint256 usdcAmount) external returns (uint256)",
  "function getTransfer(uint256 id) external view returns (tuple(address sender, string recipientName, string destinationCountry, uint256 usdcAmount, uint256 feeAmount, uint256 timestamp, bytes32 cctpMessageHash, bool settled))",
  "function getSenderTransfers(address sender) external view returns (uint256[])",
  "function transferCount() external view returns (uint256)",
  "function totalVolume() external view returns (uint256)",
  "function feeBps() external view returns (uint256)",
];

const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
];

export default function App() {
  const [screen, setScreen] = useState("dashboard");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner]     = useState(null);
  const [account, setAccount]   = useState(null);
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [txHistory, setTxHistory] = useState([]);
  const [stats, setStats] = useState({ count: 0, volume: "0.00" });

  const CONTRACT_ADDR = import.meta.env.VITE_CONTRACT_ADDRESS;
  const USDC_ADDR     = import.meta.env.VITE_USDC_ADDRESS;
  const BACKEND_URL   = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  // Connect wallet (MetaMask / any EIP-1193 provider)
  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please install MetaMask or a Web3 wallet.");
      return;
    }
    const p = new ethers.BrowserProvider(window.ethereum);
    await p.send("eth_requestAccounts", []);
    const s = await p.getSigner();
    const addr = await s.getAddress();
    setProvider(p);
    setSigner(s);
    setAccount(addr);

    // Switch to Arc testnet
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xB5F" }], // 2911 in hex
      });
    } catch {
      // Add Arc testnet if not present
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId:         "0xB5F",
          chainName:       "Arc Testnet",
          rpcUrls:         [import.meta.env.VITE_ARC_RPC_URL],
          nativeCurrency:  { name: "ARC", symbol: "ARC", decimals: 18 },
          blockExplorerUrls: ["https://explorer.arc-testnet.circle.com"],
        }],
      });
    }

    await refreshBalance(p, addr);
    await refreshHistory(p, addr);
    await refreshStats(p);
  }

  async function refreshBalance(p, addr) {
    if (!p || !addr) return;
    const usdc = new ethers.Contract(USDC_ADDR, USDC_ABI, p);
    const bal  = await usdc.balanceOf(addr);
    setUsdcBalance(Number(bal) / 1e6);
  }

  async function refreshHistory(p, addr) {
    if (!p || !addr) return;
    const c = new ethers.Contract(CONTRACT_ADDR, CONTRACT_ABI, p);
    const ids = await c.getSenderTransfers(addr);
    const txs = await Promise.all(ids.map(id => c.getTransfer(id)));
    setTxHistory(
      txs.map((t, i) => ({
        id:       Number(ids[i]),
        recipient: t.recipientName,
        country:   t.destinationCountry,
        usdc:      (Number(t.usdcAmount) / 1e6).toFixed(2),
        fee:       (Number(t.feeAmount)  / 1e6).toFixed(2),
        settled:   t.settled,
        hash:      t.cctpMessageHash,
        timestamp: new Date(Number(t.timestamp) * 1000).toLocaleString(),
      })).reverse()
    );
  }

  async function refreshStats(p) {
    if (!p) return;
    const c = new ethers.Contract(CONTRACT_ADDR, CONTRACT_ABI, p);
    const [count, vol] = await Promise.all([
      c.transferCount(),
      c.totalVolume(),
    ]);
    setStats({
      count:  Number(count),
      volume: (Number(vol) / 1e6).toFixed(2),
    });
  }

  /**
   * Core remittance function.
   * 1. Approve USDC spend
   * 2. Call initiateTransfer on-chain
   * 3. Backend picks up the event and handles CCTP + Gateway
   */
  async function sendTransfer({ aedAmount, recipientName, countryCode }) {
    if (!signer) throw new Error("Wallet not connected");

    const usdc     = new ethers.Contract(USDC_ADDR, USDC_ABI, signer);
    const c        = new ethers.Contract(CONTRACT_ADDR, CONTRACT_ABI, signer);
    const feeBps   = await c.feeBps();
    const usdcAmt  = BigInt(Math.round(aedAmount * 0.272 * 1e6)); // AED -> USDC (6 dec)
    const feeAmt   = (usdcAmt * feeBps) / 10_000n;
    const total    = usdcAmt + feeAmt;

    // 1. Approve
    const approveTx = await usdc.approve(CONTRACT_ADDR, total);
    await approveTx.wait();

    // 2. Initiate on-chain
    const tx = await c.initiateTransfer(recipientName, countryCode, usdcAmt);
    const receipt = await tx.wait();

    // 3. Refresh UI
    await Promise.all([
      refreshBalance(provider, account),
      refreshHistory(provider, account),
      refreshStats(provider),
    ]);

    return { txHash: receipt.hash, usdcAmt: Number(usdcAmt) / 1e6 };
  }

  return (
    <div className="app-shell">
      <div className="top-bar">
        <div className="logo">Remit<span className="logo-accent">Arc</span></div>
        <div className="header-right">
          {account ? (
            <div className="wallet-chip">
              <div className="dot-green" />
              {account.slice(0, 6)}...{account.slice(-4)}
            </div>
          ) : (
            <button className="connect-btn" onClick={connectWallet}>
              Connect wallet
            </button>
          )}
        </div>
      </div>

      <main className="main-content">
        {screen === "dashboard" && (
          <Dashboard
            usdcBalance={usdcBalance}
            stats={stats}
            recentTxs={txHistory.slice(0, 4)}
            onSend={() => setScreen("send")}
            onHistory={() => setScreen("history")}
            connected={!!account}
            onConnect={connectWallet}
          />
        )}
        {screen === "send" && (
          <SendFlow
            onBack={() => setScreen("dashboard")}
            onComplete={() => setScreen("dashboard")}
            usdcBalance={usdcBalance}
            sendTransfer={sendTransfer}
          />
        )}
        {screen === "history" && (
          <History
            txs={txHistory}
            onBack={() => setScreen("dashboard")}
          />
        )}
        {screen === "arch" && (
          <Architecture onBack={() => setScreen("dashboard")} />
        )}
      </main>

      <nav className="bottom-nav">
        {[
          { id: "dashboard", icon: "home",            label: "Home"         },
          { id: "send",      icon: "send",             label: "Send"         },
          { id: "history",   icon: "clock",            label: "History"      },
          { id: "arch",      icon: "topology-star",    label: "Architecture" },
        ].map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${screen === tab.id ? "active" : ""}`}
            onClick={() => setScreen(tab.id)}
          >
            <i className={`ti ti-${tab.icon}`} />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
