import React, { useState, useEffect } from "react";
// Tooltip import for button hover
// You may need to install @headlessui/react or use a custom Tooltip
// import { Tooltip } from "@headlessui/react";
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
  // userTokenWeight is the weight used for the user's vote (from getVote)
  const [userTokenWeight, setUserTokenWeight] = useState("0");
  const [effectiveVotingPower, setEffectiveVotingPower] = useState("0");
  // Voting power at snapshot block
  const [snapshotVotingPower, setSnapshotVotingPower] = useState("0");

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
          snapshotBlock: Number(result[8] || 0),
        });
  
        setIsVotingOpen(result[7]);
        setError(null);
  
        if (account) {
          const voted = await readContract.hasVoted(proposalId, account);
          setHasVoted(voted);

          if (voted) {
            const voteData = await readContract.getVote(proposalId, account);
            setUserVote(voteData[1]); // support field
            setUserTokenWeight(ethers.formatEther(voteData[2])); // voting power used at vote time
          } else {
            setUserTokenWeight("0");
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
      loadProposal();

      // Only poll if voting is open and user hasn't voted
      if (
        proposalId === null ||
        !provider ||
        error === "Proposal not found or has been deleted" ||
        !proposal ||
        !isVotingActive(proposal) ||
        hasVoted
      ) {
        return;
      }

      // Poll every 60 seconds
      const interval = setInterval(loadProposal, 60000);
      return () => clearInterval(interval);
    }, [provider, proposalId, account, error, proposal, hasVoted]);

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

    // Prevent voting with 0 tokens
    if (parseFloat(balance) === 0) {
      setError("You need at least 1 token to vote");
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
        <div className="text-4xl mb-4 sm:text-3xl xs:text-2xl">⏳</div>
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
    <div className="max-w-3xl rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900 p-6 sm:p-10 fade-in">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">{proposal.title}</h2>
        <CountdownTimer deadline={proposal.deadline} />
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
        {proposal.description}
      </p>

      {/* Vote Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 p-4 sm:p-6 rounded-2xl mb-8 border border-gray-100 dark:border-gray-700 shadow-sm">
        {/* Token Balance and Voting Power */}
        {account && (
          <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
              💰 Your Balance: <span className="font-bold text-lg text-blue-600 sm:text-base xs:text-sm">{parseFloat(balance).toFixed(2)} tokens</span>
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
              ⚡ Your Voting Power: <span className="font-bold text-lg text-purple-600 sm:text-base xs:text-sm">{parseFloat(effectiveVotingPower).toFixed(2)} votes</span>
            </p>
            {effectiveVotingPower !== balance && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                ✅ Includes {(parseFloat(effectiveVotingPower) - parseFloat(balance)).toFixed(2)} delegated tokens
              </p>
            )}
            {balanceLoading && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Loading...</p>}
            {parseFloat(effectiveVotingPower) === 0 && !balanceLoading && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">⚠️ You need at least 1 token to vote</p>
            )}
          </div>
        )}

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
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
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-400 to-cyan-400 h-full rounded-full transition-all duration-500"
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
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-red-400 to-pink-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${noPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-300 rounded fade-in">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 border-l-4 border-green-500 dark:border-green-400 text-green-700 dark:text-green-300 rounded fade-in">
          ✅ Vote recorded successfully!
        </div>
      )}

      {hasVoted && (
        <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300 rounded fade-in">
          {parseFloat(userTokenWeight) < 0.01 ? (
            <>
              ✓ You voted <strong>{userVote ? "YES 👍" : "NO 👎"}</strong> but had <strong>no voting power at the snapshot</strong>.<br />
              <span className="text-xs text-red-600">
                Your tokens were likely acquired after the proposal started, or your voting power was not delegated at the snapshot block.<br />
                <span className="font-semibold">To vote in future proposals, make sure your tokens are delegated <u>before</u> the proposal is created.</span>
              </span>
            </>
          ) : (
            <>
              ✓ You voted <strong>{userVote ? "YES 👍" : "NO 👎"}</strong> with <strong>{parseFloat(userTokenWeight).toFixed(2)} voting power</strong>
            </>
          )}
        </div>
      )}

      {/* Voting Section */}
      {!isVotingActive(proposal) && proposal.executed ? (
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 p-6 rounded-xl mb-6 border-2 border-purple-300 dark:border-purple-700">
          <p className="text-center text-lg font-bold text-purple-700 sm:text-base xs:text-sm">✅ Proposal Executed</p>
        </div>
      ) : !isVotingActive(proposal) ? (
        <div className="bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900 dark:to-orange-900 p-6 rounded-xl mb-6 border-2 border-red-300 dark:border-red-700">
          <p className="text-center text-lg font-bold text-red-700 sm:text-base xs:text-sm">🔴 Voting has ended for this proposal</p>
        </div>
      ) : !account ? (
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl mb-6 border-2 border-gray-300 dark:border-gray-700">
          <p className="text-center text-lg font-semibold text-gray-600 sm:text-base xs:text-sm">🔗 Connect your wallet to vote</p>
        </div>
      ) : parseFloat(balance) === 0 ? (
        <div className="bg-red-100 dark:bg-red-900 p-6 rounded-xl mb-6 border-2 border-red-300 dark:border-red-700">
          <p className="text-center text-lg font-bold text-red-700 sm:text-base xs:text-sm">❌ You need at least 1 token to vote</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => handleVote(true)}
            disabled={isLoading || hasVoted}
            className="btn-success disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all"
          >
            {isLoading ? "⏳ Voting..." : "👍 Vote In Favor"}
          </button>
          <button
            onClick={() => handleVote(false)}
            disabled={isLoading || hasVoted}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all"
          >
            {isLoading ? "⏳ Voting..." : "👎 Vote Against"}
          </button>
        </div>
      )}

      {/* Status Info */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-2">
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
      {proposal && !proposal.executed && !isVotingOpen && proposal.deadline > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6 opacity-50 pointer-events-none select-none">
          <ApprovalBox proposalId={proposalId} proposalStatus={proposal.executed ? "Executed" : "Closed"} />
          <div className="text-center text-xs text-gray-500 mt-2">Amendments are disabled after voting ends.</div>
        </div>
      )}
    </div>
  );
};
