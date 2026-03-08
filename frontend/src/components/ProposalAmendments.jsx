import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../hooks/useWeb3";
import { formatAddress } from "../utils/helpers";

export const ProposalAmendments = ({ proposalId }) => {
  const { contract, account, signer } = useWeb3();
  const [amendments, setAmendments] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [isProposing, setIsProposing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loadingAmendments, setLoadingAmendments] = useState(true);
  
  const isMember = userRole >= 1;
  const isModerator = userRole >= 2;

  const loadAmendments = async () => {
    if (!contract || proposalId === null || proposalId === undefined) return;
    
    setLoadingAmendments(true);
    try {
      const amendmentIds = await contract.getProposalAmendments(proposalId);
      const amendmentData = [];

      for (const amendId of amendmentIds) {
        const amendment = await contract.getAmendment(Number(amendId));
        const amendmentObj = Array.isArray(amendment)
          ? {
              proposalId: amendment[0],
              title: amendment[1],
              description: amendment[2],
              proposedBy: amendment[3],
              timestamp: amendment[4],
              approved: amendment[5],
              status: amendment[6],
            }
          : amendment;
        
        amendmentData.push({
          id: Number(amendId),
          ...amendmentObj,
        });
      }
      setAmendments(amendmentData);
    } catch (err) {
      console.error("Error loading amendments:", err);
    } finally {
      setLoadingAmendments(false);
    }
  };

  useEffect(() => {
    if (!contract || !account) return;
    const loadUserRole = async () => {
      try {
        const role = await contract.getUserRole(account);
        setUserRole(Number(role));
      } catch (err) { console.error(err); }
    };
    loadUserRole();
    loadAmendments();
  }, [contract, account, proposalId]);

  const handleProposeAmendment = async (e) => {
    e.preventDefault();
    if (!title || !description || !contract || !signer || proposalId === null) return;
    setError(null); setSuccess(null); setIsProposing(true);
    try {
      const tx = await contract.connect(signer).proposeAmendment(proposalId, title, description);
      await tx.wait();
      setSuccess("AMENDMENT PROPOSED SUCCESSFULLY");
      setTitle(""); setDescription("");
      await loadAmendments();
    } catch (err) { setError(err.message); }
    finally { setIsProposing(false); }
  };

  const handleApproveAmendment = async (amendmentId) => {
    if (!contract || !signer) return;
    try {
      const tx = await contract.connect(signer).approveAmendment(amendmentId);
      await tx.wait();
      setSuccess("AMENDMENT APPROVED");
      await loadAmendments();
    } catch (err) { setError(err.message); }
  };

  const handleRejectAmendment = async (amendmentId) => {
    if (!contract || !signer) return;
    try {
      const tx = await contract.connect(signer).rejectAmendment(amendmentId);
      await tx.wait();
      setSuccess("AMENDMENT REJECTED");
      await loadAmendments();
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-widest">Proposal Amendments</h3>
        <div className="px-3 py-1 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
          <p className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">
            Role: {userRole === 1 ? "Member" : userRole === 2 ? "Moderator" : userRole === 3 ? "Admin" : "None"}
          </p>
        </div>
      </div>

      {isMember && (
        <form onSubmit={handleProposeAmendment} className="glacier-card p-6 border-green-500/20 bg-green-500/5">
          <h4 className="text-xs font-black text-green-600 dark:text-green-400 uppercase tracking-widest mb-6">Propose Modification</h4>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="New Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glacier-input"
              disabled={isProposing}
            />
            <textarea
              placeholder="New Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="glacier-input resize-none"
              disabled={isProposing}
            />
            <button
              type="submit"
              disabled={isProposing || !title || !description}
              className="glacier-btn-primary w-full py-3 bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/20"
            >
              {isProposing ? "SYNCING..." : "SUBMIT AMENDMENT"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {loadingAmendments ? (
          <div className="text-center py-10">
            <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Amendments</p>
          </div>
        ) : amendments.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No amendments proposed yet</p>
          </div>
        ) : (
          amendments.map((amendment) => (
            <div key={amendment.id} className="glacier-card p-6 hover:border-cyan-400/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-black text-slate-800 dark:text-white">{amendment.title}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    By {formatAddress(amendment.proposedBy)}
                  </p>
                </div>
                <span className={`px-3 py-1 text-[10px] font-black rounded-lg border uppercase tracking-widest ${
                  amendment.status === "Approved" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                  amendment.status === "Rejected" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                  "bg-amber-500/10 text-amber-500 border-amber-500/20"
                }`}>
                  {amendment.status}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">{amendment.description}</p>
              {isModerator && amendment.status === "Pending" && (
                <div className="flex gap-3">
                  <button onClick={() => handleApproveAmendment(amendment.id)} className="flex-1 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 text-[10px] font-black rounded-xl border border-green-500/20 transition-all">APPROVE</button>
                  <button onClick={() => handleRejectAmendment(amendment.id)} className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-black rounded-xl border border-red-500/20 transition-all">REJECT</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-bold text-xs text-center">⚠️ {error}</div>}
      {success && <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl font-bold text-xs text-center">✅ {success}</div>}
    </div>
  );
};