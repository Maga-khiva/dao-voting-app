import { useMemo } from "react";
import { ethers } from "ethers";

export const useContract = (abi, address, signer) => {
  return useMemo(() => {
    if (!address || !abi || !signer) {
      return null;
    }

    try {
      return new ethers.Contract(address, abi, signer);
    } catch (error) {
      console.error("Error creating contract instance:", error);
      return null;
    }
  }, [abi, address, signer]);
};
