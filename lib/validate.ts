import { PublicKey } from "@solana/web3.js";

const MAX_SOL_AMOUNT = 5;

export const validate = (walletAddress: string, amount: number): void => {
  if (!walletAddress) {
    throw new Error("Missing wallet address.");
  }

  if (!amount) {
    throw new Error("Missing SOL amount.");
  }

  if (amount > MAX_SOL_AMOUNT) {
    throw new Error("Requested SOL amount too large.");
  }

  try {
    let pubkey = new PublicKey(walletAddress);
    let isOnCurve = PublicKey.isOnCurve(pubkey.toBuffer());
    if (!isOnCurve) {
      throw new Error("Address can't be a PDA.");
    }
  } catch (error) {
    throw new Error("Please enter valid wallet address.");
  }
};
