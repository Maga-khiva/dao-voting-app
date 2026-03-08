import React, { useState, useContext, useCallback } from "react";
import { ethers } from "ethers";
import { Web3Context } from "../context/Web3Provider";
import { useTokenBalance } from "../hooks/useTokenBalance";

export const TokenTransfer = () => {
  const { account, signer, tokenContract, provider } = useContext(Web3Context);
  const { balance } = useTokenBalance();
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!recipientAddress || !amount || !signer || !tokenContract) return;
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (!ethers.isAddress(recipientAddress)) throw new Error("Invalid address");
      const amountInWei = ethers.parseEther(amount);
      const tx = await tokenContract.connect(signer).transfer(recipientAddress, amountInWei);
      await tx.wait();
      setSuccess(`SUCCESSFULLY TRANSFERRED ${amount} GOV`);
      setRecipientAddress("");
      setAmount("");
    } catch (err) {
      setError(err.message || "Transfer failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center p-6 bg-purple-500/5 dark:bg-purple-500/10 rounded-3xl border border-purple-500/20">
        <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Available Balance</p>
        <p className="text-4xl font-black text-slate-800 dark:text-white">{parseFloat(balance).toFixed(2)} GOV</p>
      </div>

      <form onSubmit={handleTransfer} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-widest">Recipient</label>
          <input
            type="text"
            placeholder="0x..."
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className="glacier-input"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-widest">Amount</label>
          <div className="relative">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="glacier-input pr-20"
              disabled={isLoading}
            />
            <button 
              type="button"
              onClick={() => setAmount(balance)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              MAX
            </button>
          </div>
        </div>

        <button type="submit" disabled={isLoading || !amount} className="glacier-btn-primary w-full py-4 bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-500/20">
          {isLoading ? "TRANSFERRING..." : "SEND TOKENS"}
        </button>
      </form>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-bold text-xs text-center uppercase">⚠️ {error}</div>}
      {success && <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl font-bold text-xs text-center uppercase">✅ {success}</div>}
    </div>
  );
};