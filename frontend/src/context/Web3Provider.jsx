import React, { createContext, useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import ProposalVotingABI from "../abi/ProposalVoting.json";
import contractConfig from "../config/contract.json";

export const Web3Context = createContext();

export const Web3Provider = ({ children, contractAddress }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [chainId, setChainId] = useState(null);

  // Token ABI (minimal for balance queries)
  const tokenABI = [
    "function balanceOf(address owner) public view returns (uint256)",
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function transfer(address to, uint256 amount) public returns (bool)",
  ];

  // Initialize default provider on mount (for read-only calls)
    useEffect(() => {
      const initializeDefaultProvider = async () => {
        try {
          // Always use Sepolia RPC for read-only calls
          const sepoliaRpc = import.meta.env.VITE_SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/bd97f8b57cb442d687ab6db50aefe2df";
          const defaultProvider = new ethers.JsonRpcProvider(sepoliaRpc);
          await defaultProvider.getNetwork();
          setProvider(defaultProvider);
          console.log("Connected to Sepolia provider:", sepoliaRpc);
        } catch (err) {
          console.log("Could not connect to Sepolia RPC, will use wallet provider when available");
        }
      };
      initializeDefaultProvider();
    }, []);

  // Check for auto-connection on mount using eth_accounts
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (!window.ethereum) {
          setIsInitializing(false);
          return;
        }

        // Silently check for connected accounts using eth_accounts
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        // Auto-connect if accounts exist and user previously connected
        if (accounts.length > 0 && localStorage.getItem("walletConnected") === "true") {
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          const web3Signer = await web3Provider.getSigner();
          const network = await web3Provider.getNetwork();

          setProvider(web3Provider);
          setSigner(web3Signer);
          setAccount(accounts[0]);
          setChainId(Number(network.chainId));

          // Initialize contracts
          if (contractAddress) {
            const contractInstance = new ethers.Contract(
              contractAddress,
              ProposalVotingABI,
              web3Signer
            );
            setContract(contractInstance);

            // Initialize token contract
            if (contractConfig.tokenAddress) {
              const tokenInstance = new ethers.Contract(
                contractConfig.tokenAddress,
                tokenABI,
                web3Signer
              );
              setTokenContract(tokenInstance);
            }
          }

          console.log("✅ Auto-connected to wallet:", accounts[0]);
        } else {
          // No auto-connect: clear state
          localStorage.removeItem("walletConnected");
          setAccount(null);
          setSigner(null);
          setContract(null);
          setTokenContract(null);
        }
      } catch (err) {
        console.error("Error checking connection:", err);
      } finally {
        setIsInitializing(false);
      }
    };

    checkConnection();
  }, [contractAddress]);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const network = await web3Provider.getNetwork();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));

      // Save connection state to localStorage
      localStorage.setItem("walletConnected", "true");
      localStorage.removeItem("userLoggedOut");

      // Initialize contract with signer for write operations
      if (contractAddress) {
        const contractInstance = new ethers.Contract(
          contractAddress,
          ProposalVotingABI,
          web3Signer
        );
        setContract(contractInstance);

        // Initialize token contract
        if (contractConfig.tokenAddress) {
          const tokenInstance = new ethers.Contract(
            contractConfig.tokenAddress,
            tokenABI,
            web3Signer
          );
          setTokenContract(tokenInstance);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to connect wallet";
      setError(errorMessage);
      console.error("Wallet connection error:", err);
    } finally {
      setIsConnecting(false);
    }
  }, [contractAddress]);

  // Disconnect wallet - clears all state and localStorage
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setContract(null);
    setTokenContract(null);
    setError(null);
    localStorage.removeItem("walletConnected");
    console.log("🔌 Wallet disconnected");
  }, []);

  // Handle account and chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        // User disconnected wallet - automatically disconnect
        console.log("👤 Accounts disconnected in MetaMask");
        disconnectWallet();
        return;
      }

      if (accounts[0] !== account) {
        // User switched to a different account
        console.log("🔄 Account changed, reconnecting...");
        
        try {
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          const web3Signer = await web3Provider.getSigner();
          const network = await web3Provider.getNetwork();

          setProvider(web3Provider);
          setSigner(web3Signer);
          setAccount(accounts[0]);
          setChainId(Number(network.chainId));

          // Update contract with new signer
          if (contractAddress) {
            const contractInstance = new ethers.Contract(
              contractAddress,
              ProposalVotingABI,
              web3Signer
            );
            setContract(contractInstance);

            // Update token contract
            if (contractConfig.tokenAddress) {
              const tokenInstance = new ethers.Contract(
                contractConfig.tokenAddress,
                tokenABI,
                web3Signer
              );
              setTokenContract(tokenInstance);
            }
          }

          localStorage.setItem("isWalletConnected", "true");
          console.log("✅ Account updated to:", accounts[0]);
        } catch (err) {
          console.error("Error updating account:", err);
          setError("Failed to update account");
        }
      }
    };

    const handleChainChanged = () => {
      console.log("🔄 Network changed, reloading...");
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [account, contractAddress, disconnectWallet]);

  const value = {
    account,
    provider,
    signer,
    contract,
    tokenContract,
    chainId,
    isInitializing,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
  };

  return (
    <Web3Context.Provider value={value}>{children}</Web3Context.Provider>
  );
};
