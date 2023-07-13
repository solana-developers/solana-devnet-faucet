"use client";
import React, { useState, ChangeEvent, useCallback, use } from "react";
import { PublicKey } from "@solana/web3.js";
import Turnstile from "react-turnstile";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";

const amountOptions = [0.5, 1, 2, 5];

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [amount, setAmount] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ wallet: string; amount: string }>({
    wallet: "",
    amount: "",
  });
  const [cloudflareCallback, setCloudflareCallback] = useState<string>("");

  const validateWallet = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch (err) {
      return false;
    }
  };

  const handleWalletChange = (event: ChangeEvent<HTMLInputElement>) => {
    const address = event.target.value;
    setWalletAddress(address);

    if (!validateWallet(address)) {
      setErrors((errors) => ({
        ...errors,
        wallet: "Invalid wallet address",
      }));
    } else {
      setErrors((errors) => ({
        ...errors,
        wallet: "",
      }));
    }
  };

  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const amount = Number(event.target.value);
    setAmount(amount);

    if (amount > 5) {
      setErrors((errors) => ({
        ...errors,
        amount: "Amount cannot be more than 5",
      }));
    } else {
      setErrors((errors) => ({
        ...errors,
        amount: "",
      }));
    }
  };

  const isFormValid = (): boolean => {
    return (
      walletAddress !== "" &&
      amount !== null &&
      amount <= 5 &&
      cloudflareCallback !== "" &&
      errors.wallet === "" &&
      errors.amount === ""
    );
  };

  const requestAirdrop = async () => {
    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress, amount, cloudflareCallback }),
      });

      if (res.ok) {
        toast("Airdrop successful", {
          hideProgressBar: true,
          autoClose: 4000,
          type: "success",
        });
      } else {
        const data = await res.json();

        toast(`${data.error}`, {
          hideProgressBar: true,
          autoClose: 4000,
          type: "error",
        });
      }
    } catch (err) {
      toast(`Failed to request airdrop, error: ${err}`, {
        hideProgressBar: true,
        autoClose: 2000,
        type: "error",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#360568] to-[#5B2A86]">
      <ToastContainer />
      <div
        className="bg-[#23F0C7] text-white rounded-lg p-8 m-4 w-4/5 max-w-lg transition-all duration-500 ease-in-out transform hover:translate-y-[-2px]  drop-shadow-2xl opacity-100 hover:opacity-90"
        style={{
          boxShadow: "20px 20px 60px #1f9fa6, -20px -20px 60px #27ffb2",
        }}
      >
        <div className="mb-4">
          <label
            className="block text-[#5B2A86] text-sm font-bold mb-2"
            htmlFor="wallet"
          >
            Wallet Address
          </label>
          <input
            className="shadow-md appearance-none rounded py-2 px-3 w-full text-[#FFB2E6] bg-[#D972FF] mb-3 leading-tight focus:outline-none focus:shadow-outline shadow-[#FFB2E6] h-14 placeholder:text-[#FFB2E6]"
            id="wallet"
            type="text"
            value={walletAddress}
            onChange={handleWalletChange}
            placeholder="Enter your wallet address"
          />
          {errors.wallet && (
            <p className="text-red-500 text-xs italic">{errors.wallet}</p>
          )}
        </div>
        <div className="mb-6">
          <label
            className="block text-[#5B2A86] text-sm font-bold mb-2"
            htmlFor="amount"
          >
            Amount
          </label>
          <input
            className="shadow-md appearance-none rounded py-2 px-3 text-[#FFB2E6] bg-[#D972FF] mb-3 leading-tight focus:outline-none focus:shadow-outline shadow-[#FFB2E6] h-14 placeholder:text-[#FFB2E6]"
            id="amount"
            type="number"
            value={amount || ""}
            onChange={handleAmountChange}
            max={5}
            placeholder="Enter the amount"
          />
          {errors.amount && (
            <p className="text-red-500 text-xs italic">{errors.amount}</p>
          )}
          <div className="flex w-40">
            {amountOptions.map((option) => (
              <button
                key={option}
                onClick={() => setAmount(option)}
                className="mr-2 bg-[#5B2A86] hover:bg-[#360568] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline shadow-2xl transition-all duration-500 ease-in-out transform hover:translate-y-[-2px]"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <Turnstile
            sitekey="0x4AAAAAAAHKo-ZE1jhM2pyN"
            onVerify={(token) => setCloudflareCallback(token)}
            refreshExpired="auto"
            theme="dark"
            className="max-w-fit rounded-lg"
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            className={`bg-[#5B2A86] hover:bg-[#360568] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline shadow-2xl transition-all duration-500 ease-in-out transform hover:translate-y-[-2px] ${
              !isFormValid() ? "opacity-60 cursor-not-allowed" : "opacity-100"
            }`}
            type="button"
            disabled={!isFormValid()}
            style={{
              boxShadow:
                "inset 5px 5px 10px #1b4b8a, inset -5px -5px 10px #360568",
            }}
            onClick={requestAirdrop}
          >
            Request
          </button>
        </div>
        <p className="text-xs mt-3 text-[#5B2A86]">
          Maximum of two requests per hour.
        </p>
      </div>
    </div>
  );
}
