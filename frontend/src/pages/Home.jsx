import React, { useState } from "react";
import { ProposalList } from "../components/ProposalList";
import { ProposalFilter } from "../components/ProposalFilter";
import { GuideSection } from "../components/GuideSection";
import { DisconnectModal } from "../components/DisconnectModal";
import { useWeb3 } from "../hooks/useWeb3";
import { Logo } from "../components/Logo";
import contractConfig from "../config/contract.json";

export const Home = ({ onNavigate }) => {
  const { account, connectWallet, disconnectWallet, isInitializing, isConnecting, chainId } = useWeb3();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    category: "All",
    status: "All",
  });

  const handleSelectProposal = (proposalId) => {
    onNavigate("vote", { proposalId });
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDisconnectClick = () => {
    disconnectWallet();
    setShowDisconnectModal(true);
  };

  const handleReconnect = () => {
    connectWallet();
  };

  const getNetworkName = () => {
    if (!chainId) return contractConfig.network || "Unknown";
    if (chainId === 11155111) return "Sepolia";
    if (chainId === 31337) return "Localhost";
    return `Chain ID: ${chainId}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Glacier Header */}
      <header className="glacier-card mb-10 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Logo className="w-12 h-12 drop-shadow-lg" />
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold glacier-gradient-text tracking-tight">
                MAGA ORBIT MARKET
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Decentralized Governance Protocol
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {isInitializing ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-slate-500">INITIALIZING</span>
              </div>
            ) : !account ? (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="glacier-btn-primary px-8"
              >
                {isConnecting ? "CONNECTING..." : "CONNECT WALLET"}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">Connected Network</span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{getNetworkName()}</span>
                </div>
                <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block mx-2"></div>
                <div className="flex items-center gap-3 bg-slate-100/50 dark:bg-slate-800/50 p-2 pr-4 rounded-2xl border border-white/20">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-xs">
                    {account.slice(2, 4).toUpperCase()}
                  </div>
                  <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </span>
                  <button
                    onClick={handleDisconnectClick}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                    title="Disconnect"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Guide Section */}
      <GuideSection />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="text-cyan-500">❄️</span> Active Proposals
            </h2>
            <button 
              onClick={handleRefresh}
              className="text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              REFRESH
            </button>
          </div>
          
          <ProposalFilter onFilterChange={setFilters} />
          
          <ProposalList
            onSelectProposal={handleSelectProposal}
            refreshTrigger={refreshTrigger}
            onCreateClick={() => onNavigate("create")}
            filters={filters}
          />
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          <button
            onClick={() => onNavigate("create")}
            className="glacier-btn-primary w-full py-5 text-lg shadow-cyan-500/20"
          >
            + CREATE PROPOSAL
          </button>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onNavigate("analytics")}
              className="glacier-btn-secondary flex flex-col items-center gap-2 py-6"
            >
              <span className="text-2xl">📊</span>
              <span className="text-xs font-bold tracking-widest">ANALYTICS</span>
            </button>
            <button
              onClick={() => onNavigate("tier2")}
              className="glacier-btn-secondary flex flex-col items-center gap-2 py-6 border-cyan-400/20"
            >
              <span className="text-2xl">⚡</span>
              <span className="text-xs font-bold tracking-widest">ADVANCED</span>
            </button>
          </div>

          <div className="glacier-card p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <span className="text-cyan-500">💎</span> DAO Insights
            </h3>
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Wallet Status</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${account ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                  {account ? "CONNECTED" : "DISCONNECTED"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Voting Power</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {account ? "ENABLED" : "CONNECT WALLET"}
                </span>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Governance Rules</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="w-1 h-1 bg-cyan-500 rounded-full"></div>
                    7-day voting duration
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="w-1 h-1 bg-cyan-500 rounded-full"></div>
                    Token-weighted consensus
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="w-1 h-1 bg-cyan-500 rounded-full"></div>
                    Multi-sig execution safety
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <DisconnectModal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        onReconnect={handleReconnect}
      />
    </div>
  );
};