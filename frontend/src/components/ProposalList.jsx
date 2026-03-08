import React, { useEffect, useState, useCallback } from "react";
import { useWeb3 } from "../hooks/useWeb3";
import { parseErrorMessage } from "../utils/helpers";
import { isVotingActive } from "../utils/daoService";
import { ethers } from "ethers";
import ProposalVotingABI from "../abi/ProposalVoting.json";
import contractConfig from "../config/contract.json";
import { CountdownTimer } from "./CountdownTimer";

export const ProposalList = ({ onSelectProposal, refreshTrigger, onCreateClick, filters = {} }) => {
  const { provider } = useWeb3();
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadProposals = useCallback(async () => {
    if (!provider) return;
    setIsLoading(true);
    setError(null);

    try {
      const readContract = new ethers.Contract(
        contractConfig.address,
        ProposalVotingABI.abi || ProposalVotingABI,
        provider
      );

      const result = await readContract.getProposals();
      const [titles, descriptions, yesVotes, noVotes, deadlines, statuses, creators, categories] = result;

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

  const getProposalStatus = (proposal) => {
    if (proposal.status && proposal.status !== "Active") return proposal.status;
    return isVotingActive(proposal) ? "Active" : "Closed";
  };

  const filteredProposals = proposals.filter((proposal) => {
    const searchTerm = (filters.search || "").toLowerCase();
    const titleMatches = proposal.title.toLowerCase().includes(searchTerm);
    const descMatches = proposal.description.toLowerCase().includes(searchTerm);
    const categoryMatches = filters.category === "All" || proposal.category === filters.category;
    const status = getProposalStatus(proposal);
    const statusMatches = filters.status === "All" || status === filters.status;
    return (titleMatches || descMatches) && categoryMatches && statusMatches;
  });

  if (isLoading && proposals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-xl">❄️</div>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-bold tracking-widest text-xs">SYNCING WITH BLOCKCHAIN</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center gap-3 font-semibold">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {filteredProposals.length === 0 ? (
        <div className="glacier-card p-20 text-center border-dashed border-2">
          <div className="text-6xl mb-6 opacity-50">🧊</div>
          <h3 className="text-2xl font-bold text-slate-700 dark:text-white mb-2">No Proposals Found</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8">The governance crystal is currently empty.</p>
          {onCreateClick && proposals.length === 0 && (
            <button onClick={onCreateClick} className="glacier-btn-primary">
              INITIATE FIRST PROPOSAL
            </button>
          )}
        </div>
      ) : (
        filteredProposals.map((proposal) => (
          <div
            key={proposal.id}
            className="glacier-card p-6 sm:p-8 hover:border-cyan-400/50 group cursor-pointer"
            onClick={() => onSelectProposal(proposal.id)}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-cyan-500/20">
                    {proposal.category}
                  </span>
                  <span className="text-slate-400 text-xs font-mono">#{proposal.id.padStart(3, '0')}</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-800 dark:text-white group-hover:glacier-gradient-text transition-all">
                  {proposal.title}
                </h3>
              </div>
              <div className="flex flex-col items-end gap-2">
                <CountdownTimer deadline={proposal.deadline} />
                <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${
                  proposal.status === "Executed" ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
                  proposal.status === "Active" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                  "bg-slate-500/10 text-slate-500 border-slate-500/20"
                }`}>
                  {proposal.status.toUpperCase()}
                </span>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8 line-clamp-2">
              {proposal.description}
            </p>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="flex gap-8">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Yes Votes</span>
                    <span className="text-lg font-black text-cyan-600 dark:text-cyan-400">{proposal.yesVotes}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Votes</span>
                    <span className="text-lg font-black text-slate-500 dark:text-slate-300">{proposal.noVotes}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Consensus</span>
                  <span className="text-lg font-black text-slate-800 dark:text-white">
                    {proposal.yesVotes + proposal.noVotes > 0 
                      ? Math.round((proposal.yesVotes / (proposal.yesVotes + proposal.noVotes)) * 100) 
                      : 0}%
                  </span>
                </div>
              </div>
              
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-1000"
                  style={{ width: `${proposal.yesVotes + proposal.noVotes > 0 ? (proposal.yesVotes / (proposal.yesVotes + proposal.noVotes)) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};