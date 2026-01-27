import React, { useState } from "react";
import { ProposalList } from "../components/ProposalList";
import { ProposalFilter } from "../components/ProposalFilter";
import { DisconnectModal } from "../components/DisconnectModal";
import { useWeb3 } from "../hooks/useWeb3";

export const Home = ({ onNavigate }) => {
  const { account, connectWallet, disconnectWallet, isInitializing, isConnecting } = useWeb3();
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

  const handleProposalCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDisconnectClick = () => {
    disconnectWallet();
    setShowDisconnectModal(true);
  };

  const handleReconnect = () => {
    connectWallet();
  };

  return (
    <div className="gradient-bg min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="card mb-8 fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                🗳️ DAO Voting DApp
              </h1>
              <p className="text-gray-600 text-lg">
                Decentralized governance for the community
              </p>
            </div>

            {isInitializing ? (
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-2">🔍 Checking wallet...</p>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                  <span className="text-gray-600">Initializing</span>
                </div>
              </div>
            ) : !account ? (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? "⏳ Connecting..." : "🔗 Connect Wallet"}
              </button>
            ) : (
              <div className="text-right flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-xs font-semibold text-green-600 uppercase">Connected</p>
                  </div>
                  <p className="font-mono text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg mb-2">
                    {account.substring(0, 6)}...{account.substring(-4)}
                  </p>
                  <button
                    onClick={handleDisconnectClick}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline transition-all"
                  >
                    🔌 Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
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
              className="w-full btn-success text-lg py-4 fade-in"
            >
              ➕ Create Proposal
            </button>

            {/* Analytics Link */}
            <button
              onClick={() => onNavigate("analytics")}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 fade-in"
            >
              📊 View Analytics
            </button>

            {/* Tier 2 Features Link */}
            <button
              onClick={() => onNavigate("tier2")}
              className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 fade-in border-2 border-pink-400"
            >
              ⭐ Advanced Features (Tier 2)
            </button>

            {/* Quick Stats Card */}
            <div className="card fade-in">
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                📊 Quick Stats
              </h3>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <p className="text-sm text-gray-600 mb-1">Wallet Status</p>
                  <p className="font-semibold text-lg">
                    {account ? (
                      <span className="text-green-600">✓ Connected</span>
                    ) : (
                      <span className="text-gray-600">Not Connected</span>
                    )}
                  </p>
                </div>
                <div className="border-b pb-4">
                  <p className="text-sm text-gray-600 mb-1">Voting Rights</p>
                  <p className="font-semibold text-lg">
                    {account ? (
                      <span className="text-green-600">✓ Enabled</span>
                    ) : (
                      <span className="text-orange-600">Connect Wallet</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Network</p>
                  <p className="font-semibold text-lg text-blue-600">
                    🔗 Localhost
                  </p>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="card bg-blue-50 border-2 border-blue-200 fade-in">
              <h4 className="font-bold text-blue-900 mb-3">ℹ️ How It Works</h4>
              <ul className="text-sm text-blue-800 space-y-2">
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
