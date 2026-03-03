import React, { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../hooks/useWeb3";
import { useTokenBalance } from "../hooks/useTokenBalance";
import { parseErrorMessage } from "../utils/helpers";
import { isVotingActive } from "../utils/daoService";
import { ethers } from "ethers";
import ProposalVotingABI from "../abi/ProposalVoting.json";
import contractConfig from "../config/contract.json";
import { CountdownTimer } from "./CountdownTimer";
import { ApprovalBox } from "./ApprovalBox";

export const VoteBox = ({ proposalId, onVoteSuccess }) => {
  const { contract, account, provider } = useWeb3();
  const { balance, loading: balanceLoading } = useTokenBalance();
  const [proposal, setProposal] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [userTokenWeight, setUserTokenWeight] = useState("0");
  const [effectiveVotingPower, setEffectiveVotingPower] = useState("0");

  const loadProposal = useCallback(async () => {
    if (proposalId === null || !provider) return;
  
    try {
      const readContract = new ethers.Contract(
        contractConfig.address,
        ProposalVotingABI,
        provider
      );
  
      const result = await readContract.getProposal(proposalId);
  
      setProposal({
        id: proposalId,
        title: result[0],
        description: result[1],
        yesVotes: Number(result[2]),
        noVotes: Number(result[3]),
        deadline: Number(result[4]),
        executed: result[5],
        creator: result[6],
        isVotingOpen: result[7],
        snapshotBlock: Number(result[8] || 0),
      });
  
      setIsVotingOpen(result[7]);
      setError(null);
  
      if (account) {
        const voted = await readContract.hasVoted(proposalId, account);
        setHasVoted(voted);

        if (voted) {
          const voteData = await readContract.getVote(proposalId, account);
          setUserVote(voteData[1]);
          setUserTokenWeight(ethers.formatEther(voteData[2]));
        }

        try {
          const effectivePower = await readContract.getEffectiveVotingPower(account);
          setEffectiveVotingPower(ethers.formatEther(effectivePower));
        } catch (err) {
          setEffectiveVotingPower(balance);
        }
      }
    } catch (err) {
      if (!err.message.includes("ProposalDoesNotExist")) {
        const errorMessage = parseErrorMessage(err);
        setError(errorMessage);
      }
    }
  }, [proposalId, provider, account, balance]);

  useEffect(() => {
    loadProposal();

    // Poll every 60 seconds instead of relying on state dependencies that cause loops
    const interval = setInterval(loadProposal, 60000);
    return () => clearInterval(interval);
  }, [loadProposal]);

  const handleVote = async (support) => {
    if (!contract || !account) {
      setError("Please connect your wallet");
      return;
    }

    if (!isVotingActive(proposal)) {
      setError("Voting period is over for this proposal");
      return;
    }

    if (hasVoted) {
      setError("You have already voted on this proposal");
      return;
    }

    if (parseFloat(balance) === 0) {
      setError("You need at least 1 token to vote");
      return;
    }

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

  if (!proposal) {
    return (
      <div className="card text-center py-12">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-gray-600">Loading proposal...</p>
      </div>
    );
  }

  const totalVotes = proposal.yesVotes + proposal.noVotes;
  const yesPercentage = totalVotes > 0 ? ((proposal.yesVotes / totalVotes) * 100).toFixed(1) : 0;
  const noPercentage = totalVotes > 0 ? ((proposal.noVotes / totalVotes) * 100).toFixed(1) : 0;

  return (
    <div className="max-w-3xl rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900 p-6 sm:p-10 fade-in">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">{proposal.title}</h2>
        <CountdownTimer deadline={proposal.deadline} />
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
        {proposal.description}
      </p>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 p-4 sm:p-6 rounded-2xl mb-8 border border-gray-100 dark:border-gray-700 shadow-sm">
        {account && (
          <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
              💰 Your Balance: <span className="font-bold text-lg text-blue-600">{parseFloat(balance).toFixed(2)} tokens</span>
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
              ⚡ Your Voting Power: <span className="font-bold text-lg text-purple-600">{parseFloat(effectiveVotingPower).toFixed(2)} votes</span>
            </p>
          </div>
        )}

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          📊 Total Votes: <span className="font-bold">{totalVotes}</span>
        </p>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="font-semibold text-green-700">👍 Yes: {proposal.yesVotes}</span>
              <span className="font-bold text-gray-700 dark:text-gray-300">{yesPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-green-400 to-cyan-400 h-full transition-all duration-500" style={{ width: `${yesPercentage}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="font-semibold text-red-700">👎 No: {proposal.noVotes}</span>
              <span className="font-bold text-gray-700 dark:text-gray-300">{noPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-red-400 to-pink-400 h-full transition-all duration-500" style={{ width: `${noPercentage}%` }} />
            </div>
          </div>
        </div>
      </div>

      {error && <div className="mb-6 p-4 bg-red-100 text-red-700 rounded border-l-4 border-red-500">⚠️ {error}</div>}
      {success && <div className="mb-6 p-4 bg-green-100 text-green-700 rounded border-l-4 border-green-500">✅ Vote recorded!</div>}

      {hasVoted && (
        <div className="mb-6 p-4 bg-blue-100 text-blue-700 rounded border-l-4 border-blue-500">
          ✓ You voted <strong>{userVote ? "YES 👍" : "NO 👎"}</strong> with <strong>{parseFloat(userTokenWeight).toFixed(2)} power</strong>
        </div>
      )}

      {!isVotingOpen ? (
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl mb-6 border-2 border-gray-300 dark:border-gray-700 text-center font-bold text-gray-600">
          🔴 Voting has ended
        </div>
      ) : !account ? (
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl mb-6 border-2 border-gray-300 dark:border-gray-700 text-center font-semibold text-gray-600">
          🔗 Connect wallet to vote
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button onClick={() => handleVote(true)} disabled={isLoading || hasVoted} className="btn-success hover:scale-105 transition-all">
            {isLoading ? "⏳ Voting..." : "👍 Vote Yes"}
          </button>
          <button onClick={() => handleVote(false)} disabled={isLoading || hasVoted} className="btn-secondary hover:scale-105 transition-all">
            {isLoading ? "⏳ Voting..." : "👎 Vote No"}
          </button>
        </div>
      )}

      {proposal && !proposal.executed && !isVotingOpen && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
          <ApprovalBox proposalId={proposalId} proposal={proposal} status={proposal.executed ? "Executed" : "Closed"} />
        </div>
      )}
    </div>
  );
};