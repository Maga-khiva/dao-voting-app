import React, { useState, useContext, useCallback } from "react";
import { ethers } from "ethers";
import { Web3Context } from "../context/Web3Provider";
import { useTokenBalance } from "../hooks/useTokenBalance";

export const TokenTransfer = () => {
  const { account, signer, tokenContract, provider } = useContext(Web3Context);
  const { balance } = useTokenBalance();
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [displayBalance, setDisplayBalance] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Trigger balance refresh by manual fetch
  const manualRefreshBalance = useCallback(async () => {
    if (!provider || !account || !tokenContract) {
      console.warn("Missing provider, account, or tokenContract");
      return;
    }
    try {
      console.log("Manual refresh: fetching balance for", account);
      const bal = await tokenContract.balanceOf(account);
      const formatted = ethers.formatEther(bal);
      console.log("Manual refresh result:", formatted);
      setDisplayBalance(formatted);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Error in manual refresh:", err);
    }
  }, [provider, account, tokenContract]);


  // Update display balance when balance from hook changes
  React.useEffect(() => {
    setDisplayBalance(balance);
  }, [balance]);

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!recipientAddress || !amount || !signer || !tokenContract) return;

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // Validate recipient address
      if (!ethers.isAddress(recipientAddress)) {
        throw new Error("Invalid recipient address");
      }

      // Prevent sending to yourself
      if (recipientAddress.toLowerCase() === account.toLowerCase()) {
        throw new Error("Cannot transfer to yourself");
      }

      // Check balance
      if (parseFloat(amount) > parseFloat(displayBalance)) {
        throw new Error("Insufficient balance");
      }

      // Convert amount to wei and send
      const amountInWei = ethers.parseEther(amount);
      const tx = await tokenContract.connect(signer).transfer(recipientAddress, amountInWei);
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setSuccess(`✅ Successfully transferred ${amount} tokens to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`);
        setRecipientAddress("");
        setAmount("");
        
        // Refetch balance immediately and also after 2 seconds
        console.log("Transfer successful, refetching balance...");
        await manualRefreshBalance();
        setTimeout(() => {
          manualRefreshBalance();
        }, 2000);
      }
    } catch (err) {
      console.error("Transfer error:", err);
      
      // Extract user-friendly error message
      let errorMessage = "Failed to transfer tokens";
      
      if (err.message) {
        // Handle user rejection
        if (err.message.includes("rejected") || err.message.includes("denied")) {
          errorMessage = "❌ Transaction rejected. Please confirm in MetaMask to proceed.";
        }
        // Handle insufficient balance
        else if (err.message.includes("Insufficient balance")) {
          errorMessage = "❌ Insufficient balance";
        }
        // Handle invalid recipient
        else if (err.message.includes("Invalid recipient")) {
          errorMessage = "❌ Invalid recipient address";
        }
        // Handle self-transfer
        else if (err.message.includes("Cannot transfer to yourself")) {
          errorMessage = "❌ Cannot transfer to yourself";
        }
        // Handle other errors - extract just the key part
        else {
          const match = err.message.match(/Error: ([^({]*)/);
          if (match && match[1]) {
            errorMessage = `❌ ${match[1].trim()}`;
          }
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
      <h3 className="text-xl font-bold text-gray-800 mb-4">💰 Transfer Tokens</h3>

      {/* Balance Info */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-gray-600">Your Balance:</p>
        <p className="text-2xl font-bold text-purple-700">{parseFloat(displayBalance).toFixed(2)} GOV</p>
      </div>

      {/* Transfer Form */}
      <form onSubmit={handleTransfer} className="space-y-4">
        {/* Recipient Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Address
          </label>
          <input
            type="text"
            placeholder="0x..."
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Paste the address you want to send tokens to
          </p>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (GOV tokens)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0"
              max={displayBalance}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
            {/* Quick amount buttons */}
            <button
              type="button"
              onClick={() => setAmount((parseFloat(displayBalance) * 0.25).toString())}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 disabled:opacity-50"
              disabled={isLoading}
            >
              25%
            </button>
            <button
              type="button"
              onClick={() => setAmount((parseFloat(displayBalance) * 0.5).toString())}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 disabled:opacity-50"
              disabled={isLoading}
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => setAmount(displayBalance)}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 disabled:opacity-50"
              disabled={isLoading}
            >
              MAX
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <p className="font-semibold">{success}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !recipientAddress || !amount}
          className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition font-medium"
        >
          {isLoading ? "⏳ Transferring..." : "📤 Transfer Tokens"}
        </button>
      </form>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs font-semibold text-blue-900 mb-2">💡 How to get addresses:</p>
        <ol className="text-xs text-blue-800 space-y-1">
          <li>1. Open MetaMask</li>
          <li>2. Click the account you want to send to</li>
          <li>3. Click "Copy address"</li>
          <li>4. Paste here and enter amount</li>
          <li>5. Click "Transfer Tokens"</li>
        </ol>
      </div>
    </div>
  );
};
