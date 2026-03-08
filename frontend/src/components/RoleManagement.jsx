import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../hooks/useWeb3";

export const RoleManagement = () => {
  const { contract, account, signer } = useWeb3();
  const [userRole, setUserRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [targetAddress, setTargetAddress] = useState("");
  const [selectedRole, setSelectedRole] = useState("1");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const ROLES = { 0: "NONE", 1: "MEMBER", 2: "MODERATOR", 3: "ADMIN" };

  useEffect(() => {
    if (!contract || !account) return;
    const loadUserRole = async () => {
      try {
        const role = await contract.getUserRole(account);
        setUserRole(Number(role));
        setIsAdmin(Number(role) === 3);
      } catch (err) { console.error(err); }
    };
    loadUserRole();
  }, [contract, account]);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!isAdmin || !signer) return;
    setError(null); setSuccess(null); setIsProcessing(true);
    try {
      const tx = await contract.connect(signer).assignRole(targetAddress.trim(), Number(selectedRole));
      await tx.wait();
      setSuccess("ROLE ASSIGNED SUCCESSFULLY");
      setTargetAddress("");
    } catch (err) { setError(err.message); }
    finally { setIsProcessing(false); }
  };

  return (
    <div className="space-y-8">
      <div className="p-6 bg-purple-500/5 dark:bg-purple-500/10 rounded-3xl border border-purple-500/20 text-center">
        <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Your Protocol Role</p>
        <p className="text-3xl font-black text-slate-800 dark:text-white">{ROLES[userRole || 0]}</p>
      </div>

      {!isAdmin ? (
        <div className="p-8 text-center bg-slate-100 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">ADMINISTRATIVE ACCESS REQUIRED</p>
        </div>
      ) : (
        <form onSubmit={handleAssign} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-widest">Target Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={targetAddress}
              onChange={(e) => setTargetAddress(e.target.value)}
              className="glacier-input"
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-widest">Assign Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="glacier-input appearance-none"
              disabled={isProcessing}
            >
              <option value="1">MEMBER (VOTE & PROPOSE)</option>
              <option value="2">MODERATOR (MANAGE AMENDMENTS)</option>
              <option value="3">ADMIN (FULL CONTROL)</option>
            </select>
          </div>

          <button type="submit" disabled={isProcessing || !targetAddress} className="glacier-btn-primary w-full py-4">
            {isProcessing ? "SYNCING..." : "ASSIGN PROTOCOL ROLE"}
          </button>
        </form>
      )}

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-bold text-xs text-center uppercase">⚠️ {error}</div>}
      {success && <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl font-bold text-xs text-center uppercase">✅ {success}</div>}
    </div>
  );
};