import React, { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../hooks/useWeb3";
import { useTokenBalance } from "../hooks/useTokenBalance";
import { parseErrorMessage, formatAddress } from "../utils/helpers";
import { isVotingActive } from "../utils/daoService";
import { ethers } from "ethers";
import ProposalVotingABI from "../abi/ProposalVoting.json";
import contractConfig from "../config/contract.json";
import { CountdownTimer } from "./CountdownTimer";
import { ApprovalBox } from "./ApprovalBox";

export const VoteBox = ({ proposalId, onVoteSuccess }) => {
  const { contract, account, provider } = useWeb3();
  const { balance } = useTokenBalance();
  const [proposal, setProposal] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [userTokenWeight, setUserTokenWeight] = useState("0");
  const [effectiveVotingPower, setEffectiveVotingPower] = useState("0");

  const loadProposal = useCallback(async () => {
    if (proposalId === null || !provider) return;
    try {
      const readContract = new ethers.Contract(contractConfig.address, ProposalVotingABI, provider);
      const result = await readContract.getProposal(proposalId);
      
      setProposal({
        id: proposalId,
        title: result[0],
        description: result[1],
        yesVotes: Number(result[2]),
        noVotes: Number(result[3]),
        deadline: Number(result[4]),
        status: result[5],
        creator: result[6],
        isVotingOpen: result[7],
        category: result[8],
      });

      if (account) {
        const voted = await readContract.hasVoted(proposalId, account);
        setHasVoted(voted);
        if (voted) {
          const voteData = await readContract.getVote(proposalId, account);
          setUserVote(voteData[1]);
          setUserTokenWeight(ethers.formatEther(voteData[2]));
        }
        const power = await readContract.getEffectiveVotingPower(account);
        setEffectiveVotingPower(ethers.formatEther(power));
      }
    } catch (err) {
      console.error(err);
    }
  }, [proposalId, provider, account]);

  useEffect(() => {
    loadProposal();
  }, [loadProposal]);

  const handleVote = async (support) => {
    if (!contract || !account) return;
    setIsLoading(true);
    setError(null);
    try {
      const tx = await contract.vote(proposalId, support);
      await tx.wait();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        loadProposal();
        if (onVoteSuccess) onVoteSuccess();
      }, 2000);
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (!proposal) return (
    <div className="glacier-card p-20 text-center">
      <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-500 font-bold text-xs tracking-widest">CRYSTALLIZING DATA</p>
    </div>
  );

  const totalVotes = proposal.yesVotes + proposal.noVotes;
  const yesPercentage = totalVotes > 0 ? (proposal.yesVotes / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (proposal.noVotes / totalVotes) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="glacier-card p-8 sm:p-12">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-10">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-4 py-1 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-black uppercase tracking-widest rounded-xl border border-cyan-500/20">
                {proposal.category}
              </span>
              <span className="text-slate-400 font-mono text-sm">PROPOSAL #{proposal.id}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white leading-tight">
              {proposal.title}
            </h2>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
              <span>Proposed by</span>
              <span className="font-mono text-cyan-600 dark:text-cyan-400">{formatAddress(proposal.creator)}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <CountdownTimer deadline={proposal.deadline} />
            <div className="px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 tracking-widest">
              {proposal.status.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none mb-12">
          <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">
            {proposal.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="glacier-card bg-green-500/5 dark:bg-green-500/10 p-6 border-green-500/20">
            <div className="flex justify-between items-end mb-4">
              <span className="text-xs font-black text-green-600 dark:text-green-400 tracking-widest">YES VOTES</span>
              <span className="text-2xl font-black text-green-600 dark:text-green-400">{proposal.yesVotes}</span>
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${yesPercentage}%` }} />
            </div>
            <p className="text-right text-[10px] font-bold text-slate-400 mt-2">{yesPercentage.toFixed(1)}% CONSENSUS</p>
          </div>

          <div className="glacier-card bg-red-500/5 dark:bg-red-500/10 p-6 border-red-500/20">
            <div className="flex justify-between items-end mb-4">
              <span className="text-xs font-black text-red-600 dark:text-red-400 tracking-widest">NO VOTES</span>
              <span className="text-2xl font-black text-red-600 dark:text-red-400">{proposal.noVotes}</span>
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${noPercentage}%` }} />
            </div>
            <p className="text-right text-[10px] font-bold text-slate-400 mt-2">{noPercentage.toFixed(1)}% DISSENT</p>
          </div>
        </div>

        {account && (
          <div className="glacier-card bg-cyan-500/5 dark:bg-cyan-500/10 p-6 border-cyan-500/20 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500 flex items-center justify-center text-white text-xl shadow-lg shadow-cyan-500/20">⚡</div>
              <div>
                <p className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 tracking-widest uppercase">Your Voting Power</p>
                <p className="text-xl font-black text-slate-800 dark:text-white">{parseFloat(effectiveVotingPower).toFixed(2)} GOV</p>
              </div>
            </div>
            {hasVoted && (
              <div className="px-6 py-2 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-white/20 text-sm font-bold text-slate-700 dark:text-slate-200">
                You voted <span className={userVote ? "text-green-500" : "text-red-500"}>{userVote ? "YES" : "NO"}</span> with {parseFloat(userTokenWeight).toFixed(2)} power
              </div>
            )}
          </div>
        )}

        {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-bold text-sm">⚠️ {error}</div>}
        {success && <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl font-bold text-sm">✅ VOTE CRYSTALLIZED ON-CHAIN</div>}

        {!proposal.isVotingOpen ? (
          <div className="glacier-card p-8 text-center bg-slate-100 dark:bg-slate-800/50 border-dashed">
            <p className="text-slate-500 dark:text-slate-400 font-black tracking-widest">VOTING PERIOD HAS CONCLUDED</p>
          </div>
        ) : !account ? (
          <button onClick={() => connectWallet()} className="glacier-btn-primary w-full py-5">CONNECT WALLET TO VOTE</button>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={() => handleVote(true)} 
              disabled={isLoading || hasVoted} 
              className="glacier-btn-primary bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/20 disabled:opacity-50"
            >
              {isLoading ? "PROCESSING..." : "VOTE YES"}
            </button>
            <button 
              onClick={() => handleVote(false)} 
              disabled={isLoading || hasVoted} 
              className="glacier-btn-primary bg-gradient-to-br from-slate-400 to-slate-600 shadow-slate-500/20 disabled:opacity-50"
            >
              {isLoading ? "PROCESSING..." : "VOTE NO"}
            </button>
          </div>
        )}

        {proposal && !proposal.executed && !proposal.isVotingOpen && (
          <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800">
            <ApprovalBox proposalId={proposalId} proposal={proposal} status={proposal.status} />
          </div>
        )}
      </div>
    </div>
  );
};