import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Dashboard from "./components/Dashboard";
import SendFlow from "./components/SendFlow";
import History from "./components/History";
import Architecture from "./components/Architecture";
import "./App.css";

const ARC_CHAIN_ID = 5042002;
const ARC_CHAIN_HEX = "0x" + ARC_CHAIN_ID.toString(16);

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
  "function balanceOf(address account) external view returns (uint256)",
];

const CONTRACT_ADDR = import.meta.env.VITE_CONTRACT_ADDRESS;
const USDC_ADDR     = import.meta.env.VITE_USDC_ADDRESS || "0x3600000000000000000000000000000000000000";
const BACKEND_URL   = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export default function App() {
  const [screen, setScreen]         = useState("dashboard");
  const [provider, setProvider]     = useState(null);
  const [signer, setSigner]         = useState(null);
  const [account, setAccount]       = useState(null);
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [txHistory, setTxHistory]   = useState([]);
  const [stats, setStats]           = useState({ count: 0, volume: "0.00" });
  const [connecting, setConnecting] = useState(false);
  const [networkOk, setNetworkOk]   = useState(false);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please install MetaMask.");
      return;
    }
    setConnecting(true);
    try {
      const p = new ethers.BrowserProvider(window.ethereum);
      await p.send("eth_requestAccounts", []);

      // Check current chain
      const network = await p.getNetwork();
      const currentChainId = Number(network.chainId);

      if (currentChainId !== ARC_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: ARC_CHAIN_HEX }],
          });
        } catch (switchErr) {
          if (switchErr.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId:           ARC_CHAIN_HEX,
                chainName:         "Arc Testnet",
                rpcUrls:           ["https://rpc.testnet.arc.network"],
                nativeCurrency:    { name: "USDC", symbol: "USDC", decimals: 18 },
                blockExplorerUrls: ["https://explorer.testnet.arc.network"],
              }],
            });
          }
        }
      }

      // Re-init provider after chain switch
      const p2 = new ethers.BrowserProvider(window.ethereum);
      const s  = await p2.getSigner();
      const addr = await s.getAddress();
      setProvider(p2);
      setSigner(s);
      setAccount(addr);
      setNetworkOk(true);
      await refreshBalance(p2, addr);
      await refreshHistory(p2, addr);
      await refreshStats(p2);
    } catch (err) {
      console.error("Connect error:", err);
    } finally {
      setConnecting(false);
    }
  }

  async function refreshBalance(p, addr) {
    if (!p || !addr) return;
    try {
      const usdc = new ethers.Contract(USDC_ADDR, USDC_ABI, p);
      const bal  = await usdc.balanceOf(addr);
      setUsdcBalance(Number(bal) / 1e6);
    } catch (e) {
      console.error("Balance error:", e);
    }
  }

  async function refreshHistory(p, addr) {
    if (!p || !addr || !CONTRACT_ADDR) return;
    try {
      const c   = new ethers.Contract(CONTRACT_ADDR, CONTRACT_ABI, p);
      const ids = await c.getSenderTransfers(addr);
      const txs = await Promise.all(ids.map(id => c.getTransfer(id)));
      setTxHistory(
        txs.map((t, i) => ({
          id:        Number(ids[i]),
          recipient: t.recipientName,
          country:   t.destinationCountry,
          usdc:      (Number(t.usdcAmount) / 1e6).toFixed(2),
          fee:       (Number(t.feeAmount)  / 1e6).toFixed(2),
          settled:   t.settled,
          hash:      t.cctpMessageHash,
          timestamp: new Date(Number(t.timestamp) * 1000).toLocaleString(),
        })).reverse()
      );
    } catch (e) {
      console.error("History error:", e);
    }
  }

  async function refreshStats(p) {
    if (!p || !CONTRACT_ADDR) return;
    try {
      const c = new ethers.Contract(CONTRACT_ADDR, CONTRACT_ABI, p);
      const [count, vol] = await Promise.all([c.transferCount(), c.totalVolume()]);
      setStats({ count: Number(count), volume: (Number(vol) / 1e6).toFixed(2) });
    } catch (e) {
      console.error("Stats error:", e);
    }
  }

  async function sendTransfer({ aedAmount, recipientName, countryCode }) {
    if (!signer) throw new Error("Wallet not connected");
    const usdc    = new ethers.Contract(USDC_ADDR, USDC_ABI, signer);
    const c       = new ethers.Contract(CONTRACT_ADDR, CONTRACT_ABI, signer);
    const feeBps  = await c.feeBps();
    const usdcAmt = BigInt(Math.round(aedAmount * 0.272 * 1e6));
    const feeAmt  = (usdcAmt * feeBps) / 10_000n;
    const total   = usdcAmt + feeAmt;

    const approveTx = await usdc.approve(CONTRACT_ADDR, total);
    await approveTx.wait();

    const tx      = await c.initiateTransfer(recipientName, countryCode, usdcAmt);
    const receipt = await tx.wait();

    await Promise.all([
      refreshBalance(provider, account),
      refreshHistory(provider, account),
      refreshStats(provider),
    ]);

    return { txHash: receipt.hash, usdcAmt: Number(usdcAmt) / 1e6 };
  }

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;
    const handleChange = () => { setAccount(null); setSigner(null); setNetworkOk(false); };
    window.ethereum.on("accountsChanged", handleChange);
    window.ethereum.on("chainChanged", handleChange);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleChange);
      window.ethereum.removeListener("chainChanged", handleChange);
    };
  }, []);

  const navItems = [
    { id: "dashboard", label: "Dashboard",    icon: "⬡" },
    { id: "send",      label: "Send",          icon: "↗" },
    { id: "history",   label: "Transactions",  icon: "≡" },
    { id: "arch",      label: "Architecture",  icon: "◈" },
  ];

  return (
    <div className="app-root">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">Remit<span className="logo-accent">Arc</span></span>
        </div>
        <div className="sidebar-tagline">"Global dollars,<br/>local access."</div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${screen === item.id ? "active" : ""}`}
              onClick={() => setScreen(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {account ? (
            <div className="wallet-info">
              <div className="wallet-dot" />
              <div>
                <div className="wallet-label">Connected</div>
                <div className="wallet-addr">{account.slice(0,6)}...{account.slice(-4)}</div>
              </div>
            </div>
          ) : (
            <button className="connect-btn" onClick={connectWallet} disabled={connecting}>
              {connecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
          <div className="network-badge">
            <span className={`net-dot ${networkOk ? "ok" : ""}`} />
            Arc Testnet
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-area">
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-title">
            {navItems.find(n => n.id === screen)?.label}
          </div>
          <div className="topbar-right">
            <div className="balance-chip">
              <span className="balance-label">USDC</span>
              <span className="balance-val">{usdcBalance.toFixed(2)}</span>
            </div>
            <div className="stats-chip">
              <span>{stats.count} transfers</span>
              <span className="chip-sep">·</span>
              <span>${stats.volume} vol</span>
            </div>
          </div>
        </header>

        {/* Screen content */}
        <div className="screen-content">
          {screen === "dashboard" && (
            <Dashboard
              usdcBalance={usdcBalance}
              stats={stats}
              recentTxs={txHistory.slice(0, 5)}
              onSend={() => setScreen("send")}
              onHistory={() => setScreen("history")}
              connected={!!account}
              onConnect={connectWallet}
              connecting={connecting}
            />
          )}
          {screen === "send" && (
            <SendFlow
              onBack={() => setScreen("dashboard")}
              onComplete={() => setScreen("dashboard")}
              usdcBalance={usdcBalance}
              sendTransfer={sendTransfer}
              connected={!!account}
              onConnect={connectWallet}
            />
          )}
          {screen === "history" && (
            <History txs={txHistory} />
          )}
          {screen === "arch" && (
            <Architecture />
          )}
        </div>
      </main>
    </div>
  );
}
