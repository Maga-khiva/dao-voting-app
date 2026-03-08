import React, { useState, useEffect } from "react";
import { useWeb3 } from "../hooks/useWeb3";

export const SnapshotDisplay = ({ proposalId }) => {
  const { contract } = useWeb3();
  const [snapshotBlock, setSnapshotBlock] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contract || proposalId === null || proposalId === undefined) return;
    const loadSnapshotData = async () => {
      try {
        setLoading(true);
        const block = await contract.getProposalSnapshotBlock(proposalId);
        setSnapshotBlock(Number(block));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    loadSnapshotData();
  }, [contract, proposalId]);

  if (loading) return (
    <div className="p-4 bg-cyan-500/5 rounded-2xl border border-cyan-500/10 animate-pulse">
      <div className="h-4 bg-cyan-500/10 rounded w-1/3 mb-2"></div>
      <div className="h-3 bg-cyan-500/5 rounded w-1/2"></div>
    </div>
  );

  if (snapshotBlock === null) return null;

  return (
    <div className="p-6 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-3xl border border-cyan-500/20">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center text-white text-lg shadow-lg shadow-cyan-500/20">📸</div>
        <div>
          <h4 className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">Snapshot Integrity</h4>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Block #{snapshotBlock}</p>
        </div>
      </div>
      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
        Voting power was locked at block <span className="font-mono font-bold text-cyan-600">{snapshotBlock}</span>. 
        Token transfers after this point do not affect voting weight for this proposal.
      </p>
    </div>
  );
};