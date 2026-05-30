import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Dashboard from "./components/Dashboard";
import SwapAndSend from "./components/SwapAndSend";
import { History, Architecture } from "./components/HistoryAndArch";
import Agent from "./components/Agent";
import "./App.css";

const ARC_CHAIN_ID  = 5042002;
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

// Mock multi-currency balances (in production pull from on-chain)
const MOCK_BALANCES = [
  { symbol:"USDC", name:"USD Coin",      amount:1842.50, usdValue:1842.50,  icon:"$",  color:"#2775ca" },
  { symbol:"ETH",  name:"Ethereum",      amount:0.412,   usdValue:1312.84,  icon:"Ξ",  color:"#627eea" },
  { symbol:"MATIC",name:"Polygon",       amount:840.0,   usdValue:462.00,   icon:"⬡",  color:"#8247e5" },
  { symbol:"AVAX", name:"Avalanche",     amount:12.5,    usdValue:375.00,   icon:"▲",  color:"#e84142" },
  { symbol:"ARB",  name:"Arbitrum",      amount:320.0,   usdValue:198.40,   icon:"◈",  color:"#28a0f0" },
];

export default function App() {
  const [screen, setScreen]           = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [provider, setProvider]       = useState(null);
  const [signer, setSigner]           = useState(null);
  const [account, setAccount]         = useState(null);
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [txHistory, setTxHistory]     = useState([]);
  const [stats, setStats]             = useState({ count: 0, volume: "0.00" });
  const [connecting, setConnecting]   = useState(false);
  const [networkOk, setNetworkOk]     = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [balances, setBalances]       = useState(MOCK_BALANCES);

  async function connectWallet() {
    if (!window.ethereum) { alert("Please install MetaMask."); return; }
    setConnecting(true);
    try {
      const p = new ethers.BrowserProvider(window.ethereum);
      await p.send("eth_requestAccounts", []);
      const network = await p.getNetwork();
      if (Number(network.chainId) !== ARC_CHAIN_ID) {
        try {
          await window.ethereum.request({ method:"wallet_switchEthereumChain", params:[{ chainId:ARC_CHAIN_HEX }] });
        } catch (e) {
          if (e.code === 4902) {
            await window.ethereum.request({
              method:"wallet_addEthereumChain",
              params:[{
                chainId: ARC_CHAIN_HEX, chainName:"Arc Testnet",
                rpcUrls:["https://rpc.testnet.arc.network"],
                nativeCurrency:{ name:"USDC", symbol:"USDC", decimals:18 },
                blockExplorerUrls:["https://explorer.testnet.arc.network"],
              }],
            });
          }
        }
      }
      const p2   = new ethers.BrowserProvider(window.ethereum);
      const s    = await p2.getSigner();
      const addr = await s.getAddress();
      setProvider(p2); setSigner(s); setAccount(addr); setNetworkOk(true);
      await refreshBalance(p2, addr);
      await refreshHistory(p2, addr);
      await refreshStats(p2);
    } catch (err) { console.error(err); }
    finally { setConnecting(false); }
  }

  async function refreshBalance(p, addr) {
    if (!p || !addr) return;
    try {
      const usdc = new ethers.Contract(USDC_ADDR, USDC_ABI, p);
      const bal  = await usdc.balanceOf(addr);
      const amt  = Number(bal) / 1e6;
      setUsdcBalance(amt);
      setBalances(prev => prev.map(b => b.symbol === "USDC" ? { ...b, amount: amt, usdValue: amt } : b));
    } catch (e) { console.error(e); }
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
          settled:   true, // on-chain confirmed = successful
          hash:      t.cctpMessageHash,
          timestamp: new Date(Number(t.timestamp) * 1000).toLocaleString(),
        })).reverse()
      );
    } catch (e) { console.error(e); }
  }

  async function refreshStats(p) {
    if (!p || !CONTRACT_ADDR) return;
    try {
      const c = new ethers.Contract(CONTRACT_ADDR, CONTRACT_ABI, p);
      const [count, vol] = await Promise.all([c.transferCount(), c.totalVolume()]);
      setStats({ count: Number(count), volume: (Number(vol)/1e6).toFixed(2) });
    } catch (e) { console.error(e); }
  }

  async function sendTransfer({ amount, recipientName, countryCode, walletAddress, fromSymbol }) {
    if (!signer) throw new Error("Wallet not connected");
    const usdc    = new ethers.Contract(USDC_ADDR, USDC_ABI, signer);
    const c       = new ethers.Contract(CONTRACT_ADDR, CONTRACT_ABI, signer);
    const feeBps  = await c.feeBps();
    const usdcAmt = BigInt(Math.round(amount * 1e6));
    const feeAmt  = (usdcAmt * feeBps) / 10_000n;
    const total   = usdcAmt + feeAmt;
    const finalRecipient = walletAddress ? `wallet:${walletAddress}` : recipientName;
    const approveTx = await usdc.approve(CONTRACT_ADDR, total);
    await approveTx.wait();
    const tx      = await c.initiateTransfer(finalRecipient, countryCode, usdcAmt);
    const receipt = await tx.wait();
    await Promise.all([refreshBalance(provider, account), refreshHistory(provider, account), refreshStats(provider)]);
    return { txHash: receipt.hash, usdcAmt: Number(usdcAmt) / 1e6 };
  }

  useEffect(() => {
    if (!window.ethereum) return;
    const handle = () => { setAccount(null); setSigner(null); setNetworkOk(false); setUsdcBalance(0); };
    window.ethereum.on("accountsChanged", handle);
    window.ethereum.on("chainChanged", handle);
    return () => { window.ethereum.removeListener("accountsChanged", handle); window.ethereum.removeListener("chainChanged", handle); };
  }, []);

  // Close sidebar on screen change (mobile)
  function navigate(id) { setScreen(id); setSidebarOpen(false); }

  const navItems = [
    { id:"dashboard", label:"Dashboard",   icon:"⬡" },
    { id:"swap",      label:"Swap + Send", icon:"⇄" },
    { id:"history",   label:"Transactions",icon:"≡" },
    { id:"agent",     label:"AI Agent",    icon:"◈" },
    { id:"arch",      label:"Architecture",icon:"⊞" },
  ];

  const totalUSD = balances.reduce((s, b) => s + b.usdValue, 0);

  return (
    <div className="app-root">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">Remit<span className="logo-accent">Arc</span></span>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${screen === item.id ? "active" : ""}`}
              onClick={() => navigate(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === "agent" && <span className="nav-badge">AI</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          {account ? (
            <>
              <div className="wallet-info">
                <div className="wallet-dot" />
                <div>
                  <div className="wallet-label">Connected</div>
                  <div className="wallet-addr">{account.slice(0,6)}...{account.slice(-4)}</div>
                </div>
              </div>
              <button className="btn-receive" onClick={() => setShowReceive(true)}>
                Receive
              </button>
            </>
          ) : (
            <button className="connect-btn" onClick={connectWallet} disabled={connecting}>
              {connecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
          <div className="network-badge">
            <span className={`net-dot ${networkOk ? "ok" : ""}`} />
            Arc Testnet · {ARC_CHAIN_ID}
          </div>
        </div>
      </aside>

      {/* Main area */}
      <main className="main-area">
        <header className="topbar">
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button className="hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
            <div className="topbar-title">{navItems.find(n => n.id === screen)?.label}</div>
          </div>
          <div className="topbar-right">
            <div className="balance-chip">
              <span className="balance-label">Portfolio</span>
              <span className="balance-val">${totalUSD.toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 })}</span>
            </div>
            <div className="stats-chip">
              <span>{stats.count} transfers</span>
              <span className="chip-sep">·</span>
              <span>${stats.volume} vol</span>
            </div>
            {!account && (
              <button className="connect-btn-top" onClick={connectWallet} disabled={connecting}>
                {connecting ? "..." : "Connect"}
              </button>
            )}
          </div>
        </header>

        <div className="screen-content">
          {screen === "dashboard" && (
            <Dashboard
              balances={balances}
              totalUSD={totalUSD}
              stats={stats}
              recentTxs={txHistory.slice(0,5)}
              onSwap={() => navigate("swap")}
              connected={!!account}
              onConnect={connectWallet}
              connecting={connecting}
              onReceive={() => setShowReceive(true)}
            />
          )}
          {screen === "swap" && (
            <SwapAndSend
              balances={balances}
              sendTransfer={sendTransfer}
              onComplete={() => navigate("dashboard")}
              connected={!!account}
              onConnect={connectWallet}
            />
          )}
          {screen === "history" && <History txs={txHistory} />}
          {screen === "agent"   && <Agent balances={balances} account={account} />}
          {screen === "arch"    && <Architecture />}
        </div>
      </main>

      {/* Receive modal */}
      {showReceive && (
        <div className="modal-backdrop" onClick={() => setShowReceive(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>Your Wallet Address</span>
              <button className="modal-close" onClick={() => setShowReceive(false)}>✕</button>
            </div>
            {account ? (
              <>
                <div className="qr-placeholder">
                  <div className="qr-inner">
                    <div style={{ fontSize:32 }}>◈</div>
                    <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:8 }}>QR Code</div>
                  </div>
                </div>
                <div className="addr-display">{account}</div>
                <button
                  className="btn-primary"
                  style={{ width:"100%" }}
                  onClick={() => { navigator.clipboard.writeText(account); }}
                >
                  Copy Address
                </button>
                <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:10, textAlign:"center" }}>
                  Arc Testnet · Chain ID {ARC_CHAIN_ID}
                </div>
              </>
            ) : (
              <div style={{ textAlign:"center", padding:32, color:"var(--text-secondary)" }}>
                Connect your wallet to see your address.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
