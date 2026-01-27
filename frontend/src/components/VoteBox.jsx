import React, { useState, useEffect } from "react";
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

   const loadProposal = async () => {
    if (proposalId === null) return;
  
    try {
      if (!provider) {
        throw new Error("Provider not initialized");
      }
  
      const readContract = new ethers.Contract(
        contractConfig.address,
        ProposalVotingABI,
        provider
      );
  
      try {
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
        });
  
        setIsVotingOpen(result[7]);
        setError(null);
  
        if (account) {
          const voted = await readContract.hasVoted(proposalId, account);
          setHasVoted(voted);

          if (voted) {
            const voteData = await readContract.getVote(proposalId, account);
            setUserVote(voteData[1]); // support field
            setUserTokenWeight(ethers.formatEther(voteData[2])); // tokenWeight field
          } else {
            // Set token weight even if not voted yet
            setUserTokenWeight(balance);
          }

          // Fetch effective voting power (includes delegated tokens)
          try {
            const effectivePower = await readContract.getEffectiveVotingPower(account);
            setEffectiveVotingPower(ethers.formatEther(effectivePower));
          } catch (err) {
            console.warn("Could not fetch effective voting power:", err);
            setEffectiveVotingPower(balance);
          }
        }
      } catch (contractErr) {
        // Silently handle proposal not found errors
        if (contractErr.message.includes("ProposalDoesNotExist")) {
          console.log("⚠️ Proposal not found");
          setError("Proposal not found or has been deleted");
        } else {
          throw contractErr;
        }
      }
    } catch (err) {
      const errorMessage = parseErrorMessage(err);
      setError(errorMessage);
      console.error("Error loading proposal:", err);
    }
  };

    useEffect(() => {
    // Only load initially
    loadProposal();
    
    // Stop polling if proposal doesn't exist or provider not ready
    if (proposalId === null || !provider || error === "Proposal not found or has been deleted") {
      return;
    }

    // Poll every 5 seconds only if still valid
    const interval = setInterval(loadProposal, 5000);
    return () => clearInterval(interval);
  }, [provider, proposalId, account, error]);

  const handleVote = async (support) => {
    if (!contract || !account) {
      setError("Please connect your wallet");
      return;
    }

    // Check if voting period has ended
    if (!isVotingActive(proposal)) {
      setError("Voting period is over for this proposal");
      return;
    }

    if (hasVoted) {
      setError("You have already voted on this proposal");
      return;
    }

    // Save previous state for rollback
    const previousProposal = { ...proposal };
    const previousHasVoted = hasVoted;

    // Optimistically update UI
    setProposal((prev) => ({
      ...prev,
      yesVotes: support ? prev.yesVotes + 1 : prev.yesVotes,
      noVotes: !support ? prev.noVotes + 1 : prev.noVotes,
    }));
    setHasVoted(true);
    setUserVote(support);
    setSuccess(true);
    setIsLoading(true);
    setError(null);

    try {
      const tx = await contract.vote(proposalId, support);
      // Show transaction pending
      setSuccess(false);
      setIsLoading(true);

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setSuccess(true);
        setIsLoading(false);

        setTimeout(() => {
          setSuccess(false);
          loadProposal(); // Sync with real blockchain data
          if (onVoteSuccess) {
            onVoteSuccess();
          }
        }, 2000);
      }
    } catch (err) {
      // Rollback on failure
      setProposal(previousProposal);
      setHasVoted(previousHasVoted);
      setUserVote(null);
      setSuccess(false);

      const errorMessage = parseErrorMessage(err);
      setError(errorMessage);
      console.error("Error voting:", err);
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
  const yesPercentage =
    totalVotes > 0 ? ((proposal.yesVotes / totalVotes) * 100).toFixed(1) : 0;
  const noPercentage =
    totalVotes > 0 ? ((proposal.noVotes / totalVotes) * 100).toFixed(1) : 0;

  return (
    <div className="card max-w-3xl fade-in">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-3xl font-bold text-gray-800">{proposal.title}</h2>
        <CountdownTimer deadline={proposal.deadline} />
      </div>
      <p className="text-gray-600 mb-8 leading-relaxed">
        {proposal.description}
      </p>

      {/* Vote Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl mb-8">
        {/* Token Balance and Voting Power */}
        {account && (
          <div className="mb-4 pb-4 border-b">
            <p className="text-sm text-gray-700 mb-2">
              💰 Your Balance: <span className="font-bold text-lg text-blue-600">{parseFloat(balance).toFixed(2)} tokens</span>
            </p>
            <p className="text-sm text-gray-700 mb-2">
              ⚡ Your Voting Power: <span className="font-bold text-lg text-purple-600">{parseFloat(effectiveVotingPower).toFixed(2)} votes</span>
            </p>
            {effectiveVotingPower !== balance && (
              <p className="text-xs text-green-600 mt-1">
                ✅ Includes {(parseFloat(effectiveVotingPower) - parseFloat(balance)).toFixed(2)} delegated tokens
              </p>
            )}
            {balanceLoading && <p className="text-xs text-gray-500 mt-1">Loading...</p>}
            {parseFloat(effectiveVotingPower) === 0 && !balanceLoading && (
              <p className="text-xs text-red-600 mt-1">⚠️ You need at least 1 token to vote</p>
            )}
          </div>
        )}

        <p className="text-sm text-gray-600 mb-4">
          📊 Total Votes: <span className="font-bold">{totalVotes}</span>
        </p>

        <div className="space-y-4">
          {/* Yes Votes */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="font-semibold text-green-700">
                👍 Yes: {proposal.yesVotes}
              </span>
              <span className="font-bold text-gray-700">{yesPercentage}%</span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${yesPercentage}%` }}
              />
            </div>
          </div>

          {/* No Votes */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="font-semibold text-red-700">
                👎 No: {proposal.noVotes}
              </span>
              <span className="font-bold text-gray-700">{noPercentage}%</span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-red-500 to-red-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${noPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded fade-in">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded fade-in">
          ✅ Vote recorded successfully!
        </div>
      )}

      {hasVoted && (
        <div className="mb-6 p-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 rounded fade-in">
          ✓ You voted <strong>{userVote ? "YES 👍" : "NO 👎"}</strong> with <strong>{parseFloat(userTokenWeight).toFixed(2)} tokens</strong>
        </div>
      )}

      {/* Voting Section */}
      {!isVotingActive(proposal) && proposal.executed ? (
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-xl mb-6 border-2 border-purple-300">
          <p className="text-center text-lg font-bold text-purple-700">✅ Proposal Executed</p>
        </div>
      ) : !isVotingActive(proposal) ? (
        <div className="bg-gradient-to-r from-red-100 to-orange-100 p-6 rounded-xl mb-6 border-2 border-red-300">
          <p className="text-center text-lg font-bold text-red-700">🔴 Voting has ended for this proposal</p>
        </div>
      ) : !account ? (
        <div className="bg-gray-100 p-6 rounded-xl mb-6 border-2 border-gray-300">
          <p className="text-center text-lg font-semibold text-gray-600">🔗 Connect your wallet to vote</p>
        </div>
      ) : parseFloat(balance) === 0 ? (
        <div className="bg-red-100 p-6 rounded-xl mb-6 border-2 border-red-300">
          <p className="text-center text-lg font-bold text-red-700">❌ You need at least 1 token to vote</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => handleVote(true)}
            disabled={
              isLoading || hasVoted
            }
            className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "⏳ Voting..." : "👍 Vote In Favor"}
          </button>
          <button
            onClick={() => handleVote(false)}
            disabled={
              isLoading || hasVoted
            }
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "⏳ Voting..." : "👎 Vote Against"}
          </button>
        </div>
      )}

      {/* Status Info */}
      <div className="border-t pt-6 space-y-2">
        {!isVotingOpen && (
          <p className="text-orange-600 font-semibold">
            ⏱️ Voting period has ended
          </p>
        )}
        {!account && (
          <p className="text-orange-600 font-semibold">
            🔗 Connect your wallet to vote
          </p>
        )}
        {isVotingOpen && !hasVoted && account && !proposal.executed && (
          <p className="text-blue-600 font-semibold">
            ✓ You can vote on this proposal
          </p>
        )}
      </div>

      {/* Multi-Sig Approval Section */}
      {proposal && !proposal.executed && !isVotingOpen && (
        <div className="border-t pt-6 mt-6">
          <ApprovalBox proposalId={proposalId} proposalStatus={proposal.executed ? "Executed" : "Closed"} />
        </div>
      )}
    </div>
  );
};
