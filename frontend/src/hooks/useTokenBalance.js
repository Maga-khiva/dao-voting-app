import { useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { Web3Context } from "../context/Web3Provider";

export function useTokenBalance() {
  const { account, tokenContract } = useContext(Web3Context);
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account || !tokenContract) {
      setBalance("0");
      setLoading(false);
      return;
    }

    const getBalance = async () => {
      try {
        const balanceWei = await tokenContract.balanceOf(account);
        const balanceEth = ethers.formatEther(balanceWei);
        setBalance(balanceEth);
      } catch (error) {
        console.error("Error fetching token balance:", error);
        setBalance("0");
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    getBalance();
  }, [account, tokenContract]);

  return { balance, loading };
}
