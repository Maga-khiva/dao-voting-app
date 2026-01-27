import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../hooks/useWeb3";

export const VoteDelegation = ({ proposalId }) => {
  const { contract, account, signer } = useWeb3();
  const [delegate, setDelegate] = useState("");
  const [currentDelegate, setCurrentDelegate] = useState(null);
  const [effectivePower, setEffectivePower] = useState("0");
  const [isDelegating, setIsDelegating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load current delegation and voting power
  useEffect(() => {
    if (!contract || !account) return;

    const loadDelegationData = async () => {
      try {
        const delegateAddr = await contract.getDelegate(account);
        setCurrentDelegate(delegateAddr === ethers.ZeroAddress ? null : delegateAddr);

        const power = await contract.getEffectiveVotingPower(account);
        setEffectivePower(ethers.formatEther(power));
      } catch (err) {
        console.error("Error loading delegation data:", err);
      }
    };

    loadDelegationData();
    const interval = setInterval(loadDelegationData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [contract, account]);

  const handleDelegate = async (e) => {
    e.preventDefault();
    if (!delegate || !contract || !signer) return;

    setError(null);
    setSuccess(null);
    setIsDelegating(true);

    try {
      // Validate address
      if (!ethers.isAddress(delegate)) {
        throw new Error("Invalid delegate address");
      }

      const tx = await contract.connect(signer).delegateVote(delegate);
      await tx.wait();

      setSuccess("Vote delegation successful!");
      setDelegate("");

      // Refresh delegation data
      const delegateAddr = await contract.getDelegate(account);
      setCurrentDelegate(delegateAddr === ethers.ZeroAddress ? null : delegateAddr);
    } catch (err) {
      setError(err.message || "Failed to delegate vote");
    } finally {
      setIsDelegating(false);
    }
  };

  const handleRevokeDelegation = async () => {
    if (!contract || !signer) return;

    setError(null);
    setSuccess(null);
    setIsDelegating(true);

    try {
      const tx = await contract.connect(signer).revokeDelegation();
      await tx.wait();

      setSuccess("Delegation revoked successfully!");
      setCurrentDelegate(null);
    } catch (err) {
      setError(err.message || "Failed to revoke delegation");
    } finally {
      setIsDelegating(false);
    }
  };

  if (!account) {
    return (
      <div className="bg-gray-100 p-4 rounded-lg">
        <p className="text-gray-600">Connect wallet to manage vote delegation</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Vote Delegation</h3>

      {/* Current Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Current Delegate</p>
            <p className="text-lg font-semibold text-gray-800">
              {currentDelegate ? `${currentDelegate.slice(0, 6)}...${currentDelegate.slice(-4)}` : "None"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Effective Voting Power</p>
            <p className="text-lg font-semibold text-blue-600">{parseFloat(effectivePower).toFixed(2)} GOV</p>
          </div>
        </div>
      </div>

      {/* Delegation Form */}
      <form onSubmit={handleDelegate} className="mb-4">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Enter delegate address (0x...)"
            value={delegate}
            onChange={(e) => setDelegate(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isDelegating}
          />
          <button
            type="submit"
            disabled={isDelegating || !delegate}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {isDelegating ? "Delegating..." : "Delegate"}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          ℹ️ Delegated voting power cannot be used directly. Revoke to regain control.
        </p>
      </form>

      {/* Revoke Button */}
      {currentDelegate && (
        <button
          onClick={handleRevokeDelegation}
          disabled={isDelegating}
          className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition mb-4"
        >
          {isDelegating ? "Revoking..." : "Revoke Delegation"}
        </button>
      )}

      {/* Feedback Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-3">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4 text-sm text-yellow-800">
        <p className="font-semibold mb-1">How Vote Delegation Works:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Delegate your voting power to another address</li>
          <li>The delegate receives your tokens' voting weight</li>
          <li>You cannot vote while delegation is active</li>
          <li>Revoke anytime to regain voting control</li>
        </ul>
      </div>
    </div>
  );
};
