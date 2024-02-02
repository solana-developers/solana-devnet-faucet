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
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";

import Image from "next/image";
import svgLoader from "@/public/svgLoader.svg";
import { AirdropRateLimit } from "@/lib/constants";

type AirdropFormProps = {
  className?: string;
  rateLimit: AirdropRateLimit;
};

export const AirdropForm = ({ className, rateLimit }: AirdropFormProps) => {
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

        await fetch("/api/request", {
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
        })
          .then(async res => {
            if (res.ok) {
              return toaster.toast({
                title: "Success!",
                description: "Airdrop was successful.",
              });
            } else throw await res.text();
          })
          .catch(err => {
            console.error(err);

            let errorMessage = "Airdrop request failed";

            if (typeof err == "string") errorMessage = err;
            else if (err instanceof Error) errorMessage = err.message;

            toaster.toast({
              title: "Error!",
              description: errorMessage,
            });
          });
      } catch (err) {
        console.error(err);

        toaster.toast({
          title: "Error!",
          description: `Failed to request airdrop, error: ${err instanceof Error ? err.message : err}`,
        });
      }

      setLoading(false);
    },
    [toaster, network, walletAddress, amount],
  );

  useEffect(() => {
    // console.log({
    //   walletAddress,
    //   amount,
    //   errorsWallet: errors.wallet,
    //   errorsAmount: errors.amount,
    // });
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
    <form onSubmit={submitHandler} className={className}>
      <Toaster />

      <Card className="w-full mx-auto md:max-w-lg">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-between gap-3">
              <span>Request Airdrop</span>

              <select
                value={network}
                onChange={handleDropdownChange}
                className="w-min"
                disabled={loading}
              >
                <option value="devnet">devnet</option>
                <option value="testnet">testnet</option>
              </select>
            </div>
          </CardTitle>
          <CardDescription>
            Maximum of {rateLimit.allowedRequests} requests{" "}
            {rateLimit.coveredHours == 1
              ? "per hour"
              : `every ${rateLimit.coveredHours} hours`}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-row space-x-2">
          <input
            type="text"
            placeholder="Wallet Address"
            onChange={handleWalletChange}
            value={walletAddress}
            required={true}
            disabled={loading}
          />

          <Popover>
            <PopoverTrigger disabled={loading} asChild>
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
            <section className="grid w-full gap-3">
              <Button
                type="submit"
                className="w-full"
                variant="default"
                disabled={!isFormValid || loading}
              >
                {loading ? (
                  <Image src={svgLoader} alt="Loading..." className="h-10" />
                ) : (
                  <>
                    <Coins className="w-4 h-4 mr-2" /> Confirm Airdrop
                  </>
                )}
              </Button>
            </section>

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
                    setShowVerifyDialog(false);
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
    </form>
  );
};
