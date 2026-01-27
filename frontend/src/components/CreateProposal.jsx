import React, { useState, useEffect } from "react";
import { useWeb3 } from "../hooks/useWeb3";
import { useTokenBalance } from "../hooks/useTokenBalance";
import { parseErrorMessage } from "../utils/helpers";
import { ethers } from "ethers";
import ProposalVotingABI from "../abi/ProposalVoting.json";
import contractConfig from "../config/contract.json";

export const CreateProposal = ({ onSuccess }) => {
  const { contract, account, isConnecting, provider } = useWeb3();
  const { balance } = useTokenBalance();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "604800", // Default: 1 week in seconds
    category: "Governance", // NEW: Default category
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [checkingOwner, setCheckingOwner] = useState(false);

  // Duration options in seconds
  const durationOptions = [
    { label: "1 Hour", value: "3600" },
    { label: "1 Day", value: "86400" },
    { label: "1 Week", value: "604800" },
    { label: "30 Days", value: "2592000" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Check if current account has governance tokens to create proposal
  useEffect(() => {
    if (!account) {
      setIsOwner(false);
      return;
    }

    // User can create proposal if they have tokens
    const hasTokens = balance && parseFloat(balance) > 0;
    setIsOwner(hasTokens);
    setCheckingOwner(false);
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
        formData.category // NEW: Pass category
      );

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setSuccess(true);
        setFormData({ title: "", description: "", duration: "604800", category: "Governance" });

        setTimeout(() => {
          setSuccess(false);
          if (onSuccess) {
            onSuccess();
          }
        }, 3000);
      }
    } catch (err) {
      const errorMessage = parseErrorMessage(err);
      setError(errorMessage);
      console.error("Error creating proposal:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card max-w-md mx-auto fade-in">
      <h2 className="text-3xl font-bold mb-2 text-gray-800">
        ✏️ Create Proposal
      </h2>
      <p className="text-gray-600 mb-6">
        Submit a new proposal for the DAO to vote on
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded fade-in">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded fade-in">
          ✅ Proposal created successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Proposal Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Increase Marketing Budget"
            className="input-field"
            disabled={isLoading}
            maxLength="200"
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.title.length}/200 characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your proposal in detail..."
            rows="5"
            className="input-field resize-none"
            disabled={isLoading}
            maxLength="1000"
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.description.length}/1000 characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Voting Duration *
          </label>
          <select
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className="input-field"
            disabled={isLoading}
          >
            {durationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Choose how long voting will be open for this proposal
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="input-field"
            disabled={isLoading}
          >
            <option value="Treasury">💰 Treasury</option>
            <option value="Governance">🏛️ Governance</option>
            <option value="Operations">⚙️ Operations</option>
            <option value="Other">📌 Other</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Select a category to help organize proposals
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || isConnecting || !account || !isOwner}
          className="w-full btn-success py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              ⏳ Creating...
            </>
          ) : (
            <>
              📝 Create Proposal
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200">
        {!account && (
          <p className="text-sm text-orange-600 font-semibold">
            🔗 Connect your wallet to create a proposal
          </p>
        )}
        {account && checkingOwner && (
          <p className="text-sm text-gray-600 font-semibold">
            🔍 Checking permissions...
          </p>
        )}
        {account && !checkingOwner && isOwner && (
          <div className="text-sm">
            <p className="text-green-600 font-semibold mb-2">✓ Token Holder</p>
            <p className="text-gray-600 mb-1">Connected as:</p>
            <p className="font-mono text-blue-600 break-all">
              {account.substring(0, 10)}...{account.substring(-8)}
            </p>
            <p className="text-gray-600 mt-2 text-xs">💰 Balance: {balance} GOV</p>
          </div>
        )}
        {account && !checkingOwner && !isOwner && (
          <div className="text-sm">
            <p className="text-red-600 font-semibold mb-2">✗ No Tokens</p>
            <p className="text-gray-600 mb-1">
              You need at least 1 GOV token to create proposals.
            </p>
            <p className="font-mono text-blue-600 break-all text-xs mt-2">
              {account.substring(0, 10)}...{account.substring(-8)}
            </p>
            <button
              onClick={() => {
                // Force re-check of token balance
                setCheckingOwner(true);
                setTimeout(() => setCheckingOwner(false), 500);
              }}
              className="mt-3 px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
            >
              🔄 Refresh Balance
            </button>
          </div>
        )}
      </div>

      {account && !checkingOwner && !isOwner && (
        <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <p className="text-sm text-yellow-800 font-semibold mb-2">📌 How to Get GOV Tokens</p>
          <ol className="text-xs text-yellow-700 space-y-2 ml-4 list-decimal">
            <li>Contact the DAO owner or token admin</li>
            <li>Request GOV tokens to be transferred to your address</li>
            <li>Once received, click "Refresh Balance" above to verify</li>
            <li>You can then create proposals</li>
          </ol>
          <p className="text-xs text-yellow-700 mt-3">
            <strong>Token Contract:</strong>
            <br />
            <span className="font-mono bg-yellow-100 px-2 py-1 rounded mt-1 inline-block">
              {contractConfig.tokenAddress}
            </span>
          </p>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
        <p className="text-xs text-blue-700">
          <strong>ℹ️ Note:</strong> Any GOV token holder can create proposals.
          You need at least 1 token to participate in governance.
        </p>
      </div>
    </div>
  );
};
