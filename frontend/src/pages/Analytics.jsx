import { useContext, useEffect, useState } from "react";
import { Web3Context } from "../context/Web3Provider";
import contractConfig from "../config/contract.json";
import ProposalVotingABI from "../abi/ProposalVoting.json";
import { ethers } from "ethers";
import { Logo } from "../components/Logo";

function StatCard({ icon, label, value, subtitle }) {
  return (
    <div className="glacier-card p-6 flex flex-col items-center text-center">
      <div className="text-4xl mb-4 drop-shadow-md">{icon}</div>
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-800 dark:text-white">{value}</p>
      {subtitle && <p className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 mt-2 uppercase tracking-tighter">{subtitle}</p>}
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
        if (!provider) return;
        const readContract = new ethers.Contract(contractConfig.address, ProposalVotingABI, provider);
        const proposals = await readContract.getProposals();
        const totalCount = proposals.titles.length;

        const activeCount = proposals.statuses.filter((s) => s === "Active").length;
        const executedCount = proposals.statuses.filter((s) => s === "Executed").length;
        const closedCount = proposals.statuses.filter((s) => s === "Closed").length;
        const rejectedCount = proposals.statuses.filter((s) => s === "Rejected").length;

        let userVoteCount = 0;
        if (account) {
          for (let i = 0; i < totalCount; i++) {
            const hasVoted = await readContract.hasVoted(i, account);
            if (hasVoted) userVoteCount++;
          }
        }

        setStats({
          totalProposals: totalCount,
          activeProposals: activeCount,
          executedProposals: executedCount,
          closedProposals: closedCount,
          rejectedProposals: rejectedCount,
          userVotes: userVoteCount,
          participationRate: totalCount > 0 ? ((userVoteCount / totalCount) * 100).toFixed(1) : "0",
        });
      } catch (err) {
        console.error(err);
        setError("Failed to sync analytics");
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [account, provider]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <Logo className="w-10 h-10" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold glacier-gradient-text tracking-tight">
              GOVERNANCE ANALYTICS
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">
              Real-time insights into protocol health and community participation.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate("home")}
          className="glacier-btn-secondary py-2 px-4 text-sm"
        >
          ← BACK HOME
        </button>
      </div>

      {!account ? (
        <div className="glacier-card p-20 text-center">
          <p className="text-slate-500 dark:text-slate-400 font-black tracking-widest">CONNECT WALLET TO VIEW ANALYTICS</p>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-6">
          <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">Syncing Analytics</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon="📝" label="Total Proposals" value={stats.totalProposals} subtitle="All-time history" />
            <StatCard icon="🟢" label="Active" value={stats.activeProposals} subtitle="Currently voting" />
            <StatCard icon="✅" label="Executed" value={stats.executedProposals} subtitle="Passed & finalized" />
            <StatCard icon="❌" label="Rejected" value={stats.rejectedProposals} subtitle="Failed consensus" />
          </div>

          <div className="glacier-card p-8 sm:p-12">
            <h2 className="text-xl font-black text-slate-800 dark:text-white mb-10 flex items-center gap-3 uppercase tracking-widest">
              <span className="text-cyan-500">👤</span> Your Participation
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Voting Power Utilization</p>
                  <p className="text-5xl font-black glacier-gradient-text">{stats.participationRate}%</p>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-2">
                    You participated in {stats.userVotes} of {stats.totalProposals} proposals
                  </p>
                </div>
                <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-1000"
                    style={{ width: `${stats.participationRate}%` }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-white/20">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">ACTIVE PROPOSALS</span>
                  <span className="text-lg font-black text-green-500">{stats.activeProposals}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-white/20">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">EXECUTED PROPOSALS</span>
                  <span className="text-lg font-black text-blue-500">{stats.executedProposals}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-white/20">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">CLOSED PROPOSALS</span>
                  <span className="text-lg font-black text-slate-500">{stats.closedProposals}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}