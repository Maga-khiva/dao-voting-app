import React, { useState, useEffect } from "react";
import { useWeb3 } from "../hooks/useWeb3";
import { useTokenBalance } from "../hooks/useTokenBalance";
import { parseErrorMessage } from "../utils/helpers";
import contractConfig from "../config/contract.json";

export const CreateProposal = ({ onSuccess }) => {
  const { contract, account, isConnecting } = useWeb3();
  const { balance } = useTokenBalance();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "604800",
    category: "Governance",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const durationOptions = [
    { label: "1 Hour", value: "3600" },
    { label: "1 Day", value: "86400" },
    { label: "1 Week", value: "604800" },
    { label: "30 Days", value: "2592000" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (!account) {
      setIsOwner(false);
      return;
    }
    const hasTokens = balance && parseFloat(balance) > 0;
    setIsOwner(hasTokens);
  }, [account, balance]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!contract || !account) {
      setError("Please connect your wallet first");
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      setError("Title and description are required");
      return;
    }

    setIsLoading(true);

    try {
      const tx = await contract.createProposal(
        formData.title,
        formData.description,
        BigInt(formData.duration),
        formData.category
      );

      await tx.wait();
      setSuccess(true);
      setFormData({ title: "", description: "", duration: "604800", category: "Governance" });

      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }
    } catch (err) {
      setError(parseErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-bold text-sm">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl font-bold text-sm">
          ✅ PROPOSAL CRYSTALLIZED
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-2">
          <label className="block text-xs font-black text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-widest">Proposal Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Expand Treasury Reserves"
            className="glacier-input"
            disabled={isLoading}
            maxLength="200"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-black text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-widest">Detailed Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide the full context of your proposal..."
            rows="6"
            className="glacier-input resize-none"
            disabled={isLoading}
            maxLength="1000"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-widest">Voting Duration</label>
            <select
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="glacier-input appearance-none"
              disabled={isLoading}
            >
              {durationOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-widest">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="glacier-input appearance-none"
              disabled={isLoading}
            >
              <option value="Treasury">💰 Treasury</option>
              <option value="Governance">🏛️ Governance</option>
              <option value="Operations">⚙️ Operations</option>
              <option value="Other">📌 Other</option>
            </select>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || isConnecting || !account || !isOwner}
        className="glacier-btn-primary w-full py-5 text-lg disabled:opacity-50"
      >
        {isLoading ? "CRYSTALLIZING..." : "INITIATE PROPOSAL"}
      </button>

      {!isOwner && account && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl text-xs font-bold text-center">
          INSUFFICIENT GOV TOKENS TO INITIATE PROPOSALS
        </div>
      )}
    </form>
  );
};