import React, { useState } from "react";
import { ProposalList } from "../components/ProposalList";
import { ProposalFilter } from "../components/ProposalFilter";
import { DisconnectModal } from "../components/DisconnectModal";
import { useWeb3 } from "../hooks/useWeb3";
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

  // Determine network name
  const getNetworkName = () => {
    if (!chainId) return contractConfig.network || "Unknown";
    if (chainId === 11155111) return "Sepolia";
    if (chainId === 31337) return "Localhost";
    return `Chain ID: ${chainId}`;
  };

  return (
    <div className="min-h-screen py-6 px-2 sm:py-10 sm:px-4 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 fade-in border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm px-4 py-3 sm:px-8 sm:py-4 bg-white dark:bg-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-lg sm:text-2xl">🗳️</span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap dark:text-white">MAGA DAO</h1>
            </div>
            <div className="flex flex-col items-end sm:items-center gap-1 min-w-0">
              {isInitializing ? (
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Initializing...</span>
                </div>
              ) : !account ? (
                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="btn-success disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all px-4 py-2 text-sm"
                >
                  {isConnecting ? "⏳ Connecting..." : "🔗 Connect Wallet"}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-semibold text-green-700 dark:text-green-400 mr-2">Connected</span>
                  <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-gray-700 px-2 py-0.5 rounded-lg truncate max-w-[110px] sm:max-w-[160px]" title={account}>
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </span>
                  <button
                    onClick={handleDisconnectClick}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline transition-all ml-2"
                  >
                    🔌 Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-300 text-sm mt-2 ml-1 hidden sm:block">Decentralized governance for the community</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Proposals</h2>
              <button 
                onClick={handleRefresh}
                className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                🔄 Refresh List
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
          <div className="space-y-6">
            {/* Create Proposal Button */}
            <button
              onClick={() => onNavigate("create")}
              className="w-full btn-success text-lg py-4 fade-in hover:scale-105 transition-all"
            >
              ➕ Create Proposal
            </button>

            {/* Analytics Link */}
            <button
              onClick={() => onNavigate("analytics")}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-2xl transition-all fade-in hover:scale-105"
            >
              📊 View Analytics
            </button>

            {/* Tier 2 Features Link */}
            <button
              onClick={() => onNavigate("tier2")}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-4 rounded-2xl transition-all fade-in border border-blue-200 hover:scale-105"
            >
              ⭐ Advanced Features (Tier 2)
            </button>

            {/* Quick Stats Card */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 p-6 fade-in">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-6">
                📊 Quick Stats
              </h3>
              <div className="space-y-4">
                <div className="border-b dark:border-gray-700 pb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Wallet Status</p>
                  <p className="font-semibold text-lg dark:text-white">
                    {account ? (
                      <span className="text-green-600">✓ Connected</span>
                    ) : (
                      <span className="text-gray-600">Not Connected</span>
                    )}
                  </p>
                </div>
                <div className="border-b dark:border-gray-700 pb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Voting Rights</p>
                  <p className="font-semibold text-lg dark:text-white">
                    {account ? (
                      <span className="text-green-600">✓ Enabled</span>
                    ) : (
                      <span className="text-orange-600">Connect Wallet</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Network</p>
                  <p className="font-semibold text-lg text-blue-600">
                    🔗 {getNetworkName()}
                  </p>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm bg-blue-50 dark:bg-blue-900/20 p-6 fade-in">
              <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-3">ℹ️ How It Works</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-2">
                <li>✓ Create proposals (owner)</li>
                <li>✓ Vote yes or no</li>
                <li>✓ 7-day voting period</li>
                <li>✓ Execute if yes votes exceed no votes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Disconnect Modal */}
      <DisconnectModal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        onReconnect={handleReconnect}
      />
    </div>
  );
};