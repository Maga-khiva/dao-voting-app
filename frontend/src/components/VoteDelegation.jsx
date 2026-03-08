import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../hooks/useWeb3";

export const VoteDelegation = () => {
  const { contract, account, signer } = useWeb3();
  const [delegate, setDelegate] = useState("");
  const [currentDelegate, setCurrentDelegate] = useState(null);
  const [effectivePower, setEffectivePower] = useState("0");
  const [isDelegating, setIsDelegating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadDelegationData = useCallback(async () => {
    if (!contract || !account) return;
    try {
      const delegateAddr = await contract.getDelegate(account);
      setCurrentDelegate(delegateAddr === ethers.ZeroAddress ? null : delegateAddr);
      const power = await contract.getEffectiveVotingPower(account);
      setEffectivePower(ethers.formatEther(power));
    } catch (err) {
      console.error(err);
    }
  }, [contract, account]);

  useEffect(() => {
    loadDelegationData();
  }, [loadDelegationData]);

  const handleDelegate = async (e) => {
    e.preventDefault();
    if (!delegate || !contract || !signer) return;
    setError(null);
    setSuccess(null);
    setIsDelegating(true);
    try {
      if (!ethers.isAddress(delegate)) throw new Error("Invalid address");
      const tx = await contract.connect(signer).delegateVote(delegate);
      await tx.wait();
      setSuccess("DELEGATION CRYSTALLIZED");
      setDelegate("");
      loadDelegationData();
    } catch (err) {
      setError(err.message || "Failed to delegate");
    } finally {
      setIsDelegating(false);
    }
  };

  const handleRevoke = async () => {
    if (!contract || !signer) return;
    setIsDelegating(true);
    try {
      const tx = await contract.connect(signer).revokeDelegation();
      await tx.wait();
      setSuccess("DELEGATION REVOKED");
      setCurrentDelegate(null);
      loadDelegationData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDelegating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6 p-6 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-3xl border border-cyan-500/20">
        <div className="text-center sm:text-left">
          <p className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-1">Effective Power</p>
          <p className="text-3xl font-black text-slate-800 dark:text-white">{parseFloat(effectivePower).toFixed(2)} GOV</p>
        </div>
        <div className="h-10 w-[1px] bg-cyan-500/20 hidden sm:block"></div>
        <div className="text-center sm:text-right">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Current Delegate</p>
          <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200">
            {currentDelegate ? `${currentDelegate.slice(0, 6)}...${currentDelegate.slice(-4)}` : "NONE"}
          </p>
        </div>
      </div>

      <form onSubmit={handleDelegate} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-widest">Delegate Address</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="0x..."
              value={delegate}
              onChange={(e) => setDelegate(e.target.value)}
              className="glacier-input flex-1"
              disabled={isDelegating}
            />
            <button type="submit" disabled={isDelegating || !delegate} className="glacier-btn-primary whitespace-nowrap">
              {isDelegating ? "SYNCING..." : "DELEGATE POWER"}
            </button>
          </div>
        </div>
      </form>

      {currentDelegate && (
        <button onClick={handleRevoke} disabled={isDelegating} className="w-full py-4 rounded-2xl border border-red-500/20 text-red-500 font-black text-xs tracking-widest hover:bg-red-500/10 transition-all">
          REVOKE DELEGATION
        </button>
      )}

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-bold text-xs">⚠️ {error}</div>}
      {success && <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl font-bold text-xs">✅ {success}</div>}
    </div>
  );
};