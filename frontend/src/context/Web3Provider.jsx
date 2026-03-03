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

  const tokenABI = [
    "function balanceOf(address owner) public view returns (uint256)",
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function transfer(address to, uint256 amount) public returns (bool)",
  ];

  useEffect(() => {
    const initializeDefaultProvider = async () => {
      try {
        const sepoliaRpc = import.meta.env.VITE_SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/bd97f8b57cb442d687ab6db50aefe2df";
        const defaultProvider = new ethers.JsonRpcProvider(sepoliaRpc);
        await defaultProvider.getNetwork();
        setProvider(defaultProvider);
      } catch (err) {
        console.log("Could not connect to Sepolia RPC, will use wallet provider when available");
      }
    };
    initializeDefaultProvider();
  }, []);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (!window.ethereum) {
          setIsInitializing(false);
          return;
        }

        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts.length > 0 && localStorage.getItem("walletConnected") === "true") {
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          const web3Signer = await web3Provider.getSigner();
          const network = await web3Provider.getNetwork();

          setProvider(web3Provider);
          setSigner(web3Signer);
          setAccount(accounts[0]);
          setChainId(Number(network.chainId));

          if (contractAddress) {
            const contractInstance = new ethers.Contract(
              contractAddress,
              ProposalVotingABI.abi || ProposalVotingABI,
              web3Signer
            );
            setContract(contractInstance);

            if (contractConfig.tokenAddress) {
              const tokenInstance = new ethers.Contract(
                contractConfig.tokenAddress,
                tokenABI,
                web3Signer
              );
              setTokenContract(tokenInstance);
            }
          }
        }
      } catch (err) {
        console.error("Error checking connection:", err);
      } finally {
        setIsInitializing(false);
      }
    };

    checkConnection();
  }, [contractAddress]);

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

      localStorage.setItem("walletConnected", "true");

      if (contractAddress) {
        const contractInstance = new ethers.Contract(
          contractAddress,
          ProposalVotingABI.abi || ProposalVotingABI,
          web3Signer
        );
        setContract(contractInstance);

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
      const errorMessage = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  }, [contractAddress]);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setContract(null);
    setTokenContract(null);
    setChainId(null);
    localStorage.removeItem("walletConnected");
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        window.location.reload();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [account, disconnectWallet]);

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