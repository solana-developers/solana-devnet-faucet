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
        <Card className="mx-2 sm:w-full md:w-[450px]">
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
                  <Button
                    key={option}
                    variant="outline"
                    onClick={() => setAmount(option)}
                  >
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

      <div className="pointer-events-none abolute top-1/2 mb-20 ml-32 left-1/2 -translate-x-1/2 translate-y-1/2 w-52 h-28 bg-fuchsia-500/80 blur-[120px]"></div>
    </div>
  );
}
