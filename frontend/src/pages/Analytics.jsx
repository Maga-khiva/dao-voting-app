import { useContext, useEffect, useState } from "react";
import { Web3Context } from "../context/Web3Provider";
import contractConfig from "../config/contract.json";
import ProposalVotingABI from "../abi/ProposalVoting.json";
import { ethers } from "ethers";

function StatCard({ icon, label, value, subtitle }) {
  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-4xl mb-3 sm:text-3xl xs:text-2xl">{icon}</div>
      <p className="text-sm text-gray-600 mb-1 xs:text-xs">{label}</p>
      <p className="text-3xl font-bold text-gray-800 sm:text-2xl xs:text-xl">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-2 xs:text-[0.7rem]">{subtitle}</p>}
    </div>
  );
}

export function Analytics({ onNavigate }) {
  const { account, provider } = useContext(Web3Context);
  const [stats, setStats] = useState({
    totalProposals: 0,
    activeProposals: 0,
    executedProposals: 0,
    closedProposals: 0,
    rejectedProposals: 0,
    userVotes: 0,
    participationRate: "0",
    totalVoters: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        if (!provider) {
          setError("Provider not initialized");
          setLoading(false);
          return;
        }

        const readContract = new ethers.Contract(
          contractConfig.address,
          ProposalVotingABI,
          provider
        );

        // Get all proposals
        const proposals = await readContract.getProposals();
        const totalCount = proposals.titles.length;

        // Count by status
        const activeCount = proposals.statuses.filter(
          (s) => s === "Active"
        ).length;
        const executedCount = proposals.statuses.filter(
          (s) => s === "Executed"
        ).length;
        const closedCount = proposals.statuses.filter(
          (s) => s === "Closed"
        ).length;
        const rejectedCount = proposals.statuses.filter(
          (s) => s === "Rejected"
        ).length;

        // Count user votes if account exists
        let userVoteCount = 0;
        let uniqueVoters = new Set();

        if (account) {
          for (let i = 0; i < totalCount; i++) {
            const hasVoted = await readContract.hasVoted(i, account);
            if (hasVoted) {
              userVoteCount++;
            }

            // Collect unique voters (approximate by checking if proposal has votes)
            if (proposals.yesVotes[i] > 0 || proposals.noVotes[i] > 0) {
              // This is a rough estimate - in production, you'd track this on-chain
              uniqueVoters.add(i);
            }
          }
        }

        setStats({
          totalProposals: totalCount,
          activeProposals: activeCount,
          executedProposals: executedCount,
          closedProposals: closedCount,
          rejectedProposals: rejectedCount,
          userVotes: userVoteCount,
          participationRate:
            totalCount > 0 ? ((userVoteCount / totalCount) * 100).toFixed(1) : "0",
          totalVoters: uniqueVoters.size,
        });

        setError(null);
      } catch (err) {
        console.error("Error loading analytics:", err);
        setError("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    if (account) {
      loadAnalytics();
    } else {
      setLoading(false);
    }
  }, [account, provider]);

  if (!account) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center p-12 bg-gray-50 rounded-lg">
          <p className="text-xl text-gray-600 mb-4 sm:text-lg xs:text-base">
            🔗 Connect your wallet to view analytics
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center p-12">
          <p className="text-lg text-gray-600 sm:text-base xs:text-sm">⏳ Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center p-12 bg-red-50 rounded-lg">
          <p className="text-red-600">⚠️ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <button
        onClick={() => onNavigate("home")}
        className="mb-6 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
      >
        ← Back to Home
      </button>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">📊 Governance Analytics</h1>
      <p className="text-gray-600 mb-12">
        DAO voting statistics and your participation
      </p>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon="📝"
          label="Total Proposals"
          value={stats.totalProposals}
          subtitle="All proposals created"
        />
        <StatCard
          icon="🟢"
          label="Active"
          value={stats.activeProposals}
          subtitle="Currently voting"
        />
        <StatCard
          icon="✅"
          label="Executed"
          value={stats.executedProposals}
          subtitle="Passed & executed"
        />
        <StatCard
          icon="❌"
          label="Rejected"
          value={stats.rejectedProposals}
          subtitle="Did not pass"
        />
      </div>

      {/* User Participation */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-8 mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">👤 Your Participation</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Participation Rate */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Voting Participation Rate</p>
            <div className="mb-3">
              <p className="text-4xl font-bold text-blue-600 sm:text-3xl xs:text-2xl">
                {stats.participationRate}%
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {stats.userVotes} of {stats.totalProposals} proposals
              </p>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${stats.participationRate}%` }}
              />
            </div>
          </div>

          {/* Proposal Breakdown */}
          <div>
            <p className="text-sm text-gray-600 mb-4">Proposal Status Breakdown</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Active</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-600 sm:text-xl xs:text-lg">
                    {stats.activeProposals}
                  </span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${
                          stats.totalProposals > 0
                            ? (stats.activeProposals / stats.totalProposals) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Executed</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-600 sm:text-xl xs:text-lg">
                    {stats.executedProposals}
                  </span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${
                          stats.totalProposals > 0
                            ? (stats.executedProposals / stats.totalProposals) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Closed</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-orange-600 sm:text-xl xs:text-lg">
                    {stats.closedProposals}
                  </span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{
                        width: `${
                          stats.totalProposals > 0
                            ? (stats.closedProposals / stats.totalProposals) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 sm:text-lg xs:text-base">✨ Enabled Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-xl xs:text-lg">🪙</span>
            <div>
              <p className="font-semibold text-gray-800">Token Voting</p>
              <p className="text-sm text-gray-600">Vote weighted by token balance</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-xl xs:text-lg">🔐</span>
            <div>
              <p className="font-semibold text-gray-800">Multi-Sig</p>
              <p className="text-sm text-gray-600">{contractConfig.requiredApprovals}-of-{contractConfig.approvers.length} execution</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-xl xs:text-lg">🏷️</span>
            <div>
              <p className="font-semibold text-gray-800">Filtering</p>
              <p className="text-sm text-gray-600">By category and status</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-xl xs:text-lg">📊</span>
            <div>
              <p className="font-semibold text-gray-800">Analytics</p>
              <p className="text-sm text-gray-600">Participation tracking</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-xl xs:text-lg">📝</span>
            <div>
              <p className="font-semibold text-gray-800">Status Tracking</p>
              <p className="text-sm text-gray-600">Active/Closed/Executed</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-xl xs:text-lg">🔄</span>
            <div>
              <p className="font-semibold text-gray-800">Amendments Ready</p>
              <p className="text-sm text-gray-600">Framework for amendments</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
