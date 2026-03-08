import React, { useEffect, useState, useCallback } from "react";
import { useWeb3 } from "../hooks/useWeb3";
import { parseErrorMessage } from "../utils/helpers";
import { isVotingActive } from "../utils/daoService";
import { ethers } from "ethers";
import ProposalVotingABI from "../abi/ProposalVoting.json";
import contractConfig from "../config/contract.json";
import { CountdownTimer } from "./CountdownTimer";
import { CopyButton } from "./CopyButton";

export const ProposalList = ({ onSelectProposal, refreshTrigger, onCreateClick, filters = {} }) => {
  const { provider } = useWeb3();
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadProposals = useCallback(async () => {
    if (!provider) return;
    setIsLoading(true);
    try {
      const readContract = new ethers.Contract(contractConfig.address, ProposalVotingABI.abi || ProposalVotingABI, provider);
      const result = await readContract.getProposals();
      const [titles, descriptions, yesVotes, noVotes, deadlines, statuses, creators, categories] = result;

      setProposals(titles.map((title, index) => ({
        id: index.toString(),
        title: title || "Untitled",
        description: descriptions[index] || "No description",
        yesVotes: Number(yesVotes[index]) || 0,
        noVotes: Number(noVotes[index]) || 0,
        deadline: Number(deadlines[index]) || 0,
        status: statuses[index] || "Active",
        creator: creators[index] || "Unknown",
        category: categories[index] || "Governance",
      })));
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally { setIsLoading(false); }
  }, [provider]);

  useEffect(() => { loadProposals(); }, [loadProposals, refreshTrigger]);

  const filteredProposals = proposals.filter((p) => {
    const search = (filters.search || "").toLowerCase();
    const matchesSearch = p.title.toLowerCase().includes(search) || p.description.toLowerCase().includes(search);
    const matchesCategory = filters.category === "All" || p.category === filters.category;
    const matchesStatus = filters.status === "All" || p.status === filters.status;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (isLoading && proposals.length === 0) return <div className="text-center py-20 animate-pulse">SYNCING BLOCKCHAIN...</div>;

  return (
    <div className="space-y-6">
      {filteredProposals.map((proposal) => (
        <div
          key={proposal.id}
          className="glacier-card p-6 sm:p-8 hover:border-cyan-400/50 group cursor-pointer transition-all"
          onClick={() => onSelectProposal(proposal.id)}
        >
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-600 text-[10px] font-black uppercase rounded border border-cyan-500/20">{proposal.category}</span>
                <span className="text-slate-400 text-xs font-mono">#{proposal.id.padStart(3, '0')}</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white group-hover:glacier-gradient-text">{proposal.title}</h3>
              <div onClick={(e) => e.stopPropagation()}>
                <CopyButton text={proposal.creator} label="Creator" />
              </div>
            </div>
            <div className="text-right space-y-2">
              <CountdownTimer deadline={proposal.deadline} />
              <div className={`text-[10px] font-black px-2 py-1 rounded border uppercase ${
                proposal.status === "Executed" ? "bg-purple-500/10 text-purple-500 border-purple-500/20" : "bg-green-500/10 text-green-500 border-green-500/20"
              }`}>
                {proposal.status}
              </div>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-6">{proposal.description}</p>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-1000"
              style={{ width: `${proposal.yesVotes + proposal.noVotes > 0 ? (proposal.yesVotes / (proposal.yesVotes + proposal.noVotes)) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};