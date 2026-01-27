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
      return; // Silently wait for provider
    }

    setIsLoading(true);
    setError(null);

    try {
      const readContract = new ethers.Contract(
        contractConfig.address,
        ProposalVotingABI.abi || ProposalVotingABI,
        provider
      );

      // Get proposals - returns separate arrays
      const result = await readContract.getProposals();

      // Destructure the arrays returned by the smart contract
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

      // Map arrays into proposal objects
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

  // Load proposals when the provider or refreshTrigger changes
  useEffect(() => {
    loadProposals();
  }, [loadProposals, refreshTrigger]);

  // Event listener for real-time updates
  useEffect(() => {
    if (!provider) return;

    const eventContract = new ethers.Contract(
      contractConfig.address,
      ProposalVotingABI.abi || ProposalVotingABI,
      provider
    );

    const onProposalCreated = () => {
      console.log("📢 New proposal detected, refreshing list...");
      loadProposals();
    };

    eventContract.on("ProposalCreated", onProposalCreated);

    return () => {
      try {
        eventContract.removeAllListeners("ProposalCreated");
      } catch (err) {
        // Silently ignore cleanup errors
      }
    };
  }, [provider, loadProposals]);

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getProposalStatus = (proposal) => {
    // Use the status from the contract first
    if (proposal.status && proposal.status !== "Active") {
      return proposal.status;
    }
    // Fallback to checking if voting is active
    return isVotingActive(proposal) ? "Active" : "Closed";
  };

  const getProposalCategory = (proposal) => {
    return proposal.category || "Governance";
  };

  // Filter proposals based on search, category, and status
  const filteredProposals = proposals.filter((proposal) => {
    const searchTerm = (filters.search || "").toLowerCase();
    const titleMatches = proposal.title.toLowerCase().includes(searchTerm);
    const descMatches = proposal.description.toLowerCase().includes(searchTerm);

    const categoryMatches =
      filters.category === "All" || getProposalCategory(proposal) === filters.category;

    const status = getProposalStatus(proposal);
    const statusMatches =
      filters.status === "All" || status === filters.status;

    return (titleMatches || descMatches) && categoryMatches && statusMatches;
  });

  if (isLoading && proposals.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">Loading proposals...</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">
          ⚠️ {error}
        </div>
      )}

      <div className="grid gap-6">
        {filteredProposals.length === 0 ? (
          <div className="text-center py-20 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl border-2 border-dashed border-gray-200">
            <div className="text-6xl mb-4">🗳️</div>
            <p className="text-2xl font-bold text-gray-700 mb-2">
              {proposals.length === 0 ? "No Proposals Yet" : "No Matching Proposals"}
            </p>
            <p className="text-gray-500 mb-8">
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
              className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {proposal.title}
                </h3>
                <div className="flex gap-2">
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

              <p className="text-gray-600 mb-6 line-clamp-2">
                {proposal.description}
              </p>

              {/* Vote Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-gray-700">Voting Progress</p>
                  {proposal.yesVotes + proposal.noVotes > 0 ? (
                    <p className="text-sm font-bold text-blue-600">
                      {Math.round(
                        (proposal.yesVotes / (proposal.yesVotes + proposal.noVotes)) * 100
                      )}
                      % Yes
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-gray-400">No votes yet</p>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  {proposal.yesVotes + proposal.noVotes > 0 ? (
                    <div
                      className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-300 hover:shadow-md"
                      style={{
                        width: `${
                          (proposal.yesVotes /
                            (proposal.yesVotes + proposal.noVotes)) *
                          100
                        }%`,
                      }}
                    />
                  ) : (
                    <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-full w-full rounded-full" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50">
                <div className="flex gap-6">
                  <div className="text-sm">
                    <span className="font-bold text-blue-600">
                      👍 {proposal.yesVotes}
                    </span>{" "}
                    <span className="text-gray-600">Yes</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-bold text-gray-500">
                      👎 {proposal.noVotes}
                    </span>{" "}
                    <span className="text-gray-600">No</span>
                  </div>
                </div>
                <button
                  onClick={() => onSelectProposal(proposal.id)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all active:scale-95"
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