import React, { useState, useEffect } from "react";
import { useWeb3 } from "../hooks/useWeb3";

export const SnapshotDisplay = ({ proposalId }) => {
  const { contract } = useWeb3();
  const [snapshotBlock, setSnapshotBlock] = useState(null);
  const [voterSnapshotBalances, setVoterSnapshotBalances] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contract || proposalId === null || proposalId === undefined) return;

    const loadSnapshotData = async () => {
      try {
        setLoading(true);

        // Get snapshot block
        const block = await contract.getProposalSnapshotBlock(proposalId);
        setSnapshotBlock(Number(block));

        // Note: Voter snapshot balances are fetched when needed (when displaying votes)
      } catch (err) {
        console.error("Error loading snapshot data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSnapshotData();
  }, [contract, proposalId]);

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-gray-600">Loading snapshot information...</p>
      </div>
    );
  }

  if (snapshotBlock === null) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-gray-800 mb-2">Snapshot Information</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Snapshot Block</p>
          <p className="font-mono text-gray-800">#{snapshotBlock}</p>
        </div>
        <div>
          <p className="text-gray-600">Voting Mechanism</p>
          <p className="text-gray-800">Snapshot-based voting</p>
        </div>
      </div>
      <p className="text-xs text-gray-600 mt-3 bg-white p-2 rounded border border-blue-100">
        ℹ️ Voting power was locked at block {snapshotBlock}. Token transfers after this block do not affect voting weight.
      </p>
    </div>
  );
};
