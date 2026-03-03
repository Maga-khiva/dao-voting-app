import React, { useEffect, useState, useCallback } from "react";
import { useWeb3 } from "../hooks/useWeb3";
import { parseErrorMessage } from "../utils/helpers";
import { isVotingActive } from "../utils/daoService";
import { ethers } from "ethers";
import ProposalVotingABI from "../abi/ProposalVoting.json";
import contractConfig from "../config/contract.json";
import { CountdownTimer } from "./CountdownTimer";

export const ProposalList = ({ onSelectProposal, refreshTrigger, onCreateClick, filters = {} }) => {
  const { contract, provider } = useWeb3();
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadProposals = useCallback(async () => {
    if (!provider) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const readContract = new ethers.Contract(
        contractConfig.address,
        ProposalVotingABI.abi || ProposalVotingABI,
        provider
      );

      const result = await readContract.getProposals();

      const [
        titles,
        descriptions,
        yesVotes,
        noVotes,
        deadlines,
        statuses,
        creators,
        categories,
      ] = result;

      const proposalList = titles.map((title, index) => ({
        id: index.toString(),
        title: title || "Untitled",
        description: descriptions[index] || "No description",
        yesVotes: Number(yesVotes[index]) || 0,
        noVotes: Number(noVotes[index]) || 0,
        deadline: Number(deadlines[index]) || 0,
        executed: statuses[index] === "Executed",
        status: statuses[index] || "Active",
        creator: creators[index] || "Unknown",
        category: categories[index] || "Governance",
      }));

      setProposals(proposalList);
    } catch (err) {
      console.error("❌ Error loading proposals:", err);
      setError(parseErrorMessage(err) || "Failed to load proposals");
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals, refreshTrigger]);

  useEffect(() => {
    if (!provider) return;

    const eventContract = new ethers.Contract(
      contractConfig.address,
      ProposalVotingABI.abi || ProposalVotingABI,
      provider
    );

    const onProposalCreated = () => {
      loadProposals();
    };

    eventContract.on("ProposalCreated", onProposalCreated);

    return () => {
      try {
        eventContract.removeAllListeners("ProposalCreated");
      } catch (err) {}
    };
  }, [provider, loadProposals]);

  const getProposalStatus = (proposal) => {
    if (proposal.status && proposal.status !== "Active") {
      return proposal.status;
    }
    return isVotingActive(proposal) ? "Active" : "Closed";
  };

  const filteredProposals = proposals.filter((proposal) => {
    const searchTerm = (filters.search || "").toLowerCase();
    const titleMatches = proposal.title.toLowerCase().includes(searchTerm);
    const descMatches = proposal.description.toLowerCase().includes(searchTerm);

    const categoryMatches =
      filters.category === "All" || proposal.category === filters.category;

    const status = getProposalStatus(proposal);
    const statusMatches =
      filters.status === "All" || status === filters.status;

    return (titleMatches || descMatches) && categoryMatches && statusMatches;
  });

  if (isLoading && proposals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">Fetching proposals from blockchain...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-0">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-3">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      <div className="grid gap-6">
        {filteredProposals.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <div className="text-6xl mb-4">🗳️</div>
            <p className="text-2xl font-bold text-gray-700 dark:text-white mb-2">
              {proposals.length === 0 ? "No Proposals Yet" : "No Matching Proposals"}
            </p>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              {proposals.length === 0
                ? "Be the first to create a proposal and start the conversation"
                : "Try adjusting your filters or search terms"}
            </p>
            {onCreateClick && proposals.length === 0 && (
              <button
                onClick={onCreateClick}
                className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg hover:scale-105 transition-all"
              >
                ➕ Create First Proposal
              </button>
            )}
          </div>
        ) : (
          filteredProposals.map((proposal) => (
            <div
              key={proposal.id}
              className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1 block">
                    {proposal.category}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                    {proposal.title}
                  </h3>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <CountdownTimer deadline={proposal.deadline} />
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      proposal.status === "Executed"
                        ? "bg-purple-100 text-purple-600"
                        : proposal.status === "Active"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {proposal.status || "Active"}
                  </span>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-2">
                {proposal.description}
              </p>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Voting Progress</p>
                  {proposal.yesVotes + proposal.noVotes > 0 ? (
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {Math.round(
                        (proposal.yesVotes / (proposal.yesVotes + proposal.noVotes)) * 100
                      )}
                      % Yes
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-gray-400">No votes yet</p>
                  )}
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  {proposal.yesVotes + proposal.noVotes > 0 ? (
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          (proposal.yesVotes /
                            (proposal.yesVotes + proposal.noVotes)) *
                          100
                        }%`,
                      }}
                    />
                  ) : (
                    <div className="bg-gray-300 dark:bg-gray-600 h-full w-full rounded-full" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50 dark:border-gray-700">
                <div className="flex gap-6">
                  <div className="text-sm">
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      👍 {proposal.yesVotes}
                    </span>{" "}
                    <span className="text-gray-600 dark:text-gray-400">Yes</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-bold text-gray-500 dark:text-gray-400">
                      👎 {proposal.noVotes}
                    </span>{" "}
                    <span className="text-gray-600 dark:text-gray-400">No</span>
                  </div>
                </div>
                <button
                  onClick={() => onSelectProposal(proposal.id)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 hover:scale-105 transition-all active:scale-95 shadow-sm"
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};