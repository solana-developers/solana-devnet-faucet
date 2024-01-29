"use client";

import { useState, ChangeEvent, useEffect, useCallback } from "react";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Header } from "@/components/header";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { Footer } from "@/components/ui/footer";
import { Dropdown } from "@/components/ui/dropdown";

import Image from "next/image";
import svgLoader from "@/public/svgLoader.svg";

export default function Home() {
  const toaster = useToast();
  const amountOptions = [0.5, 1, 2.5, 5];
  const [loading, setLoading] = useState<boolean>(false);

  const [walletAddress, setWalletAddress] = useState<string>("");
  const [amount, setAmount] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ wallet: string; amount: string }>({
    wallet: "",
    amount: "",
  });
  const [showVerifyDialog, setShowVerifyDialog] = useState<boolean>(false);
  const [network, setSelectedNetwork] = useState("devnet");
  const [isFormValid, setIsFormValid] = useState(false);

  const validateWallet = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleWalletChange = (event: ChangeEvent<HTMLInputElement>) => {
    const address = event.target.value;
    setWalletAddress(address);

    if (!validateWallet(address)) {
      setErrors(errors => ({
        ...errors,
        wallet: "Invalid wallet address",
      }));
    } else {
      setErrors(errors => ({
        ...errors,
        wallet: "",
      }));
    }
  };

  const handleDropdownChange = (event: any) => {
    setSelectedNetwork(event.target.value);
  };

  const requestAirdrop = useCallback(
    async (cloudflareCallback: string | null = null) => {
      try {
        if (
          cloudflareCallback === null &&
          process.env.NODE_ENV != "development"
        ) {
          return toaster.toast({
            title: "Error!",
            description: "Please complete the captcha.",
          });
        }

        setLoading(true);

        const res = await fetch("/api/request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            walletAddress,
            cloudflareCallback,
            network,
          }),
        });

        if (res.ok) {
          toaster.toast({
            title: "Success!",
            description: "Airdrop was successful.",
          });
        } else {
          const data = await res.json();

          toaster.toast({
            title: "Error!",
            description: `${data.error}`,
          });
        }
      } catch (error) {
        toaster.toast({
          title: "Error!",
          description: `Failed to request airdrop, error: ${error}`,
        });
      }

      setLoading(false);
    },
    [toaster, network, walletAddress, amount],
  );

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
        errors.amount === "",
    );
  }, [errors.amount, errors.wallet, amount, walletAddress]);

  //
  const submitHandler = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (loading) return;

      if (process.env.NODE_ENV == "development") requestAirdrop();
      else setShowVerifyDialog(true);
    },
    [loading, requestAirdrop, setShowVerifyDialog],
  );

  return (
    <form
      onSubmit={submitHandler}
      className="relative flex items-center justify-center min-h-screen"
    >
      <Toaster />
      <Header />
      <Footer />

      <Card className="w-full mx-4 md:max-w-lg">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-between gap-3">
              <span>Request Airdrop</span>

              <Dropdown
                value={network}
                onChange={handleDropdownChange}
                className="w-min"
                disabled={loading}
              />
            </div>
          </CardTitle>
          <CardDescription>Maximum of 2 requests per hour.</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-row space-x-2">
          <Input
            placeholder="Wallet Address"
            onChange={handleWalletChange}
            value={walletAddress}
            required={true}
            disabled={loading}
          />

          <Popover>
            <PopoverTrigger disabled={loading}>
              <Button
                type="button"
                className="w-24"
                variant="outline"
                disabled={loading}
              >
                {!!amount ? amount + " SOL" : "Amount"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="grid w-32 grid-cols-2 gap-2">
              {amountOptions.map(option => (
                <Button
                  key={option}
                  type="button"
                  variant="outline"
                  onClick={() => setAmount(option)}
                  disabled={loading}
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
              type="submit"
              className="w-full"
              variant="default"
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <Image src={svgLoader} alt="Loading..." className="h-10" />
              ) : (
                <>
                  <Coins className="w-4 h-4 mr-2" /> Confirm Airdrop
                </>
              )}
            </Button>

            <DialogContent className="max-w-[450px]">
              <DialogHeader>
                <DialogTitle>Cloudflare Verification</DialogTitle>
                <DialogDescription>
                  Please complete the captcha to confirm your airdrop request.
                </DialogDescription>
              </DialogHeader>

              <div className="relative flex items-center justify-center w-full p-5 py-10">
                <Skeleton className="absolute w-[298px] h-[62px]" />
                <Turnstile
                  sitekey="0x4AAAAAAAH-Xpks-1nBLn95"
                  onVerify={token => {
                    requestAirdrop(token);
                  }}
                  refreshExpired="auto"
                  theme="dark"
                  className="absolute z-10 rounded-lg max-w-fit"
                />
              </div>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>

      <div className="pointer-events-none absolute top-1/2 mb-20 ml-32 left-1/2 -translate-x-1/2 translate-y-1/2 w-52 h-28 bg-fuchsia-500/80 blur-[120px]"></div>
    </form>
  );
}
