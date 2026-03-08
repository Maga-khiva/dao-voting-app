import React, { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../hooks/useWeb3";
import { useTokenBalance } from "../hooks/useTokenBalance";
import { parseErrorMessage, formatAddress } from "../utils/helpers";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import ProposalVotingABI from "../abi/ProposalVoting.json";
import contractConfig from "../config/contract.json";
import { CountdownTimer } from "./CountdownTimer";
import { ApprovalBox } from "./ApprovalBox";
import { CopyButton } from "./CopyButton";

export const VoteBox = ({ proposalId, onVoteSuccess }) => {
  const { contract, account, provider, signer } = useWeb3();
  const [proposal, setProposal] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userTokenWeight, setUserTokenWeight] = useState("0");
  const [effectiveVotingPower, setEffectiveVotingPower] = useState("0");
  const [recentVotes, setRecentVotes] = useState([]);

  const loadProposal = useCallback(async () => {
    if (proposalId === null || !provider) return;
    try {
      const readContract = new ethers.Contract(contractConfig.address, ProposalVotingABI.abi || ProposalVotingABI, provider);
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
        approvalsGiven: result[9],
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

      const filter = readContract.filters.VoteCasted(proposalId);
      const events = await readContract.queryFilter(filter, -1000);
      setRecentVotes(events.map(e => ({
        voter: e.args[1],
        support: e.args[2],
        weight: ethers.formatEther(e.args[3]),
      })).reverse().slice(0, 5));

    } catch (err) { console.error(err); }
  }, [proposalId, provider, account]);

  useEffect(() => { loadProposal(); }, [loadProposal]);

  const handleVote = async (support) => {
    if (!contract || !signer) return;
    const tid = toast.loading("Crystallizing your vote...");
    setIsLoading(true);
    try {
      const tx = await contract.connect(signer).vote(proposalId, support);
      await tx.wait();
      toast.success("Vote recorded on-chain!", { id: tid });
      loadProposal();
      if (onVoteSuccess) onVoteSuccess();
    } catch (err) {
      toast.error(parseErrorMessage(err), { id: tid });
    } finally { setIsLoading(false); }
  };

  const handleExecute = async () => {
    if (!contract || !signer) return;
    const tid = toast.loading("Executing proposal...");
    try {
      const tx = await contract.connect(signer).executeProposal(proposalId);
      await tx.wait();
      toast.success("Proposal executed successfully!", { id: tid });
      loadProposal();
    } catch (err) {
      toast.error(parseErrorMessage(err), { id: tid });
    }
  };

  if (!proposal) return <div className="glacier-card p-20 text-center animate-pulse">SYNCING...</div>;

  const totalVotes = proposal.yesVotes + proposal.noVotes;
  const yesPercentage = totalVotes > 0 ? (proposal.yesVotes / totalVotes) * 100 : 0;
  const canExecute = proposal.status === "Closed" && Number(proposal.approvalsGiven) >= contractConfig.requiredApprovals;

  return (
    <div className="space-y-8">
      <div className="glacier-card p-8 sm:p-12">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-10">
          <div className="space-y-3">
            <span className="px-4 py-1 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-black uppercase tracking-widest rounded-xl border border-cyan-500/20">
              {proposal.category}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white leading-tight">{proposal.title}</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Proposed by</span>
              <CopyButton text={proposal.creator} label="Creator" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <CountdownTimer deadline={proposal.deadline} />
            <div className="px-4 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 tracking-widest uppercase">
              {proposal.status}
            </div>
          </div>
        </div>

        <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mb-12 whitespace-pre-wrap">{proposal.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="glacier-card bg-green-500/5 p-6 border-green-500/20">
            <div className="flex justify-between items-end mb-4">
              <span className="text-xs font-black text-green-600 tracking-widest uppercase">Yes Votes</span>
              <span className="text-2xl font-black text-green-600">{proposal.yesVotes}</span>
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${yesPercentage}%` }} />
            </div>
          </div>
          <div className="glacier-card bg-red-500/5 p-6 border-red-500/20">
            <div className="flex justify-between items-end mb-4">
              <span className="text-xs font-black text-red-600 tracking-widest uppercase">No Votes</span>
              <span className="text-2xl font-black text-red-600">{proposal.noVotes}</span>
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${100 - yesPercentage}%` }} />
            </div>
          </div>
        </div>

        {proposal.isVotingOpen ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={() => handleVote(true)} disabled={isLoading || hasVoted} className="glacier-btn-primary bg-gradient-to-br from-green-500 to-emerald-600">VOTE YES</button>
            <button onClick={() => handleVote(false)} disabled={isLoading || hasVoted} className="glacier-btn-primary bg-gradient-to-br from-slate-500 to-slate-700">VOTE NO</button>
          </div>
        ) : canExecute && proposal.status !== "Executed" ? (
          <button onClick={handleExecute} className="glacier-btn-primary w-full py-5 bg-gradient-to-br from-purple-500 to-indigo-600">FINAL EXECUTION</button>
        ) : null}

        <div className="mt-12 pt-12 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Recent Activity</h3>
          <div className="space-y-3">
            {recentVotes.map((v, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-white/10">
                <CopyButton text={v.voter} label="Voter" />
                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${v.support ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {v.support ? 'YES' : 'NO'} ({parseFloat(v.weight).toFixed(2)} GOV)
                </span>
              </div>
            ))}
          </div>
        </div>

        {proposal.status === "Closed" && (
          <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800">
            <ApprovalBox proposalId={proposalId} proposal={proposal} status={proposal.status} />
          </div>
        )}
      </div>
    </div>
  );
};