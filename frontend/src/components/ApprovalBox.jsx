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
    setApproving(true); setError(null); setSuccess(false);
    try {
      const tx = await contract.approveExecution(proposalId);
      await tx.wait();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to approve execution");
    } finally {
      setApproving(false);
    }
  };

  if (!isApprover || !isReadyForApproval) return null;

  return (
    <div className="glacier-card p-8 border-blue-500/20 bg-blue-500/5">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white text-xl shadow-lg shadow-blue-500/20">🔐</div>
        <div>
          <h3 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Multi-Sig Approval</h3>
          <p className="text-xl font-black text-slate-800 dark:text-white">
            {Number(proposal.approvalsGiven || 0)} / {contractConfig.requiredApprovals} SIGNED
          </p>
        </div>
      </div>

      {error && <p className="text-xs font-bold text-red-500 mb-4 uppercase tracking-tight">⚠️ {error}</p>}
      {success && <p className="text-xs font-bold text-green-500 mb-4 uppercase tracking-tight">✅ APPROVAL CRYSTALLIZED</p>}

      <button
        onClick={handleApprove}
        disabled={!canApprove}
        className="glacier-btn-primary w-full py-4 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20 disabled:opacity-50"
      >
        {approving ? "SIGNING..." : "SIGN FOR EXECUTION"}
      </button>

      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-4 text-center uppercase tracking-widest">
        You are a designated protocol approver
      </p>
    </div>
  );
}