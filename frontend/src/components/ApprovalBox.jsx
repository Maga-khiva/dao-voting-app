import { useState, useContext } from "react";
import { Web3Context } from "../context/Web3Provider";
import contractConfig from "../config/contract.json";

export function ApprovalBox({ proposal, proposalId, status }) {
  const { account, contract } = useContext(Web3Context);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const isApprover = account && contractConfig.approvers.includes(account);
  const isReadyForApproval = status === "Closed";
  const canApprove = isApprover && isReadyForApproval && !approving;

  const handleApprove = async () => {
    if (!canApprove || !contract) return;

    setApproving(true);
    setError(null);
    setSuccess(false);

    try {
      const tx = await contract.approveExecution(proposalId);
      await tx.wait();

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        window.location.reload(); // Refresh to get updated approval count
      }, 2000);
    } catch (err) {
      console.error("Approval error:", err);
      setError(err.message || "Failed to approve execution");
    } finally {
      setApproving(false);
    }
  };

  if (!isApprover || !isReadyForApproval) {
    return null;
  }

  return (
    <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
      <p className="text-sm font-semibold text-blue-900 mb-2">🔐 Multi-Sig Approval Required</p>
      <p className="text-sm text-blue-800 mb-4">
        Approvals: <strong>{proposal.approvalsGiven || 0}/{contractConfig.requiredApprovals}</strong>
      </p>

      {error && (
        <p className="text-sm text-red-600 mb-3">⚠️ {error}</p>
      )}

      {success && (
        <p className="text-sm text-green-600 mb-3">✅ Approval recorded!</p>
      )}

      <button
        onClick={handleApprove}
        disabled={!canApprove}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 rounded-lg font-semibold transition-colors"
      >
        {approving ? "⏳ Approving..." : "✅ Approve Execution"}
      </button>

      <p className="text-xs text-gray-600 mt-2">
        ℹ️ You are a multi-sig approver for this proposal
      </p>
    </div>
  );
}
