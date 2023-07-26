"use client";

import React, { useState, ChangeEvent, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Turnstile from "react-turnstile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Header } from "@/components/header";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";

export default function Home() {
  const amountOptions = [0.5, 1, 2.5, 5];
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [amount, setAmount] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ wallet: string; amount: string }>({
    wallet: "",
    amount: "",
  });
  const [showVerifyDialog, setShowVerifyDialog] = useState<boolean>(false);
  const toaster = useToast();

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

  const requestAirdrop = async (cloudflareCallback: string | null = null) => {
    try {
      if (cloudflareCallback === null) {
        toaster.toast({
          title: "Error!",
          description: "Please complete the captcha.",
        });
      }

      const res = await fetch("/api/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress, amount, cloudflareCallback }),
      });

      if (res.ok) {
        toaster.toast({
          title: "Success!",
          description: "Airdrop was successfull.",
        });
      } else {
        const data = await res.json();

        toaster.toast({
          title: "Error!",
          description: `${data.error}`,
        });
      }
    } catch (err) {
      toaster.toast({
        title: "Error!",
        description: `Failed to request airdrop, error: ${err}`,
      });
    }
  };

  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    console.log({
      walletAddress,
      amount,
      errorsWallet: errors.wallet,
      errorsAmount: errors.amount,
    });
    setIsFormValid(
      walletAddress !== "" &&
        amount !== null &&
        amount <= 5 &&
        errors.wallet === "" &&
        errors.amount === ""
    );
  }, [amount, walletAddress]);

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      <Toaster />

      <Header />

      <div className="absolute">
        <Card className="w-[450px]">
          <CardHeader>
            <CardTitle>Request Airdrop</CardTitle>
            <CardDescription>Maximum of 2 requests per hour.</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-row space-x-2">
            <Input
              placeholder="Wallet Address"
              onChange={handleWalletChange}
              value={walletAddress}
            />

            <Popover>
              <PopoverTrigger>
                <Button className="w-24" variant="outline">
                  {amount ? amount + " SOL" : "Amount"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-32 grid grid-cols-2 gap-2">
                {amountOptions.map((option) => (
                  <Button variant="outline" onClick={() => setAmount(option)}>
                    {option}
                  </Button>
                ))}
              </PopoverContent>
            </Popover>
          </CardContent>

          <CardFooter>
            <Dialog
              open={showVerifyDialog}
              onOpenChange={(open: boolean) => setShowVerifyDialog(open)}
            >
              <Button
                className="w-full"
                variant="default"
                disabled={!isFormValid}
                onClick={() => setShowVerifyDialog(true)}
              >
                <Coins className="mr-2 h-4 w-4" /> Confirm Airdrop
              </Button>

              <DialogContent className="max-w-[450px]">
                <DialogHeader>
                  <DialogTitle>Cloudflare Verification</DialogTitle>
                  <DialogDescription>
                    Please complete the captcha to confirm your airdrop request.
                  </DialogDescription>
                </DialogHeader>

                <div className="w-full relative flex items-center justify-center p-5 py-10">
                  <Skeleton className="absolute w-[298px] h-[62px]" />
                  <Turnstile
                    sitekey="0x4AAAAAAAHKo-ZE1jhM2pyN"
                    onVerify={(token) => {
                      requestAirdrop(token);
                    }}
                    refreshExpired="auto"
                    theme="dark"
                    className="max-w-fit rounded-lg absolute z-10"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      </div>

      <div className="pointer-events-none abolute top-1/2 mb-20 ml-32 left-1/2 -translate-x-1/2 translate-y-1/2 w-52 h-28 bg-rose-600/70 blur-[120px]"></div>

      {/*      <div
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
        <div>
          {hasRequested && (
            <button
              onClick={() => window.location.reload()}
              className="bg-[#5B2A86] hover:bg-[#360568] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline shadow-2xl transition-all duration-500 ease-in-out transform hover:translate-y-[-2px] mt-4"
            >
              Reload page
            </button>
          )}
          <p className="text-xs mt-3 text-[#5B2A86]">
            Maximum of two requests per hour.
          </p>
        </div>
          </div>*/}
    </div>
  );
}
