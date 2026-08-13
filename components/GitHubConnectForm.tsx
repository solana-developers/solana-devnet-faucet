"use client";

import type { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";
import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GithubIcon, ChevronDown, ExternalLink, Bot, Info } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import svgLoader from "@/public/svgLoader.svg";

type GitHubConnectFormProps = {
  className?: string;
  session: Session | null;
};

export const GitHubConnectForm = ({
  className,
  session,
}: GitHubConnectFormProps) => {
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * Handler to authenticate to GitHub
   */
  const githubSignIn = useCallback(() => {
    setLoading(true);
    return signIn("github", {
      redirect: true,
      // force override the callback data
      callbackUrl: window.location.href,
    });
  }, []);

  /**
   * Handler to clear the user's session
   */
  const githubSignOut = useCallback(() => {
    setLoading(true);
    return signOut({
      redirect: true,
      // force override the callback data
      callbackUrl: window.location.href,
    }).then(() => setLoading(false));
  }, []);

  if (!!session?.user?.githubUsername) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-between gap-3">
              Higher Airdrop Limit Unlocked!
            </div>
          </CardTitle>
          <CardDescription>
            You have connected your GitHub account and unlocked a higher airdrop
            limit.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <Button
            type="button"
            className="w-full"
            variant="outline"
            disabled={loading}
            onClick={githubSignOut}
          >
            {loading ? (
              <Image src={svgLoader} alt="Loading..." className="h-10" />
            ) : (
              <>
                <GithubIcon className="w-4 h-4 mr-2" /> Disconnect your GitHub
              </>
            )}
          </Button>

          {/* <CardDescription>
            By connecting your GitHub account, you authorize this application to
            read your private GitHub profile information.
          </CardDescription> */}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full mx-auto md:max-w-lg space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-between gap-3">
              Unlock a Higher Airdrop Limit
            </div>
          </CardTitle>
          <CardDescription>
            Sign in with your GitHub account to unlock a higher airdrop limit
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <Button
            type="button"
            className="w-full"
            variant="default"
            disabled={loading}
            onClick={githubSignIn}
          >
            {loading ? (
              <Image src={svgLoader} alt="Loading..." className="h-10" />
            ) : (
              <>
                <GithubIcon className="w-4 h-4 mr-2" /> Connect your GitHub
              </>
            )}
          </Button>

          <div className="flex items-start gap-2 rounded-md border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              This faucet is built for developers. GitHub accounts are validated
              to ensure fair usage &mdash; some accounts may not pass
              verification. For other ways to get devnet SOL, check out the{" "}
              <Link
                href="https://solana.com/developers/guides/getstarted/solana-token-airdrop-and-faucets"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground inline-flex items-center gap-0.5"
              >
                full guide
                <ExternalLink className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <details className="group w-full rounded-lg border border-border/50 bg-card text-card-foreground">
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium select-none list-none [&::-webkit-details-marker]:hidden">
          <Bot className="w-4 h-4 shrink-0 text-muted-foreground" />
          <span>I am an AI Agent</span>
          <ChevronDown className="w-4 h-4 ml-auto shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-4 pt-1 text-sm text-muted-foreground space-y-3">
          <p>
            AI agents should <strong>not</strong> use this faucet. Use one of
            these programmatic methods to obtain devnet SOL instead:
          </p>
          <div className="space-y-2">
            <p className="font-medium text-foreground text-xs">
              Solana CLI Airdrop
            </p>
            <div className="rounded-md bg-muted p-3 font-mono text-xs space-y-1">
              <p>solana airdrop 2 &lt;WALLET_ADDRESS&gt; --url devnet</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground text-xs">
              Proof of Work Faucet
            </p>
            <div className="rounded-md bg-muted p-3 font-mono text-xs space-y-1">
              <p>cargo install devnet-pow</p>
              <p>devnet-pow mine -d 3 --reward 0.02 --no-infer -t 5000000000</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground text-xs">
              Local Validator (unlimited SOL, no rate limits)
            </p>
            <div className="rounded-md bg-muted p-3 font-mono text-xs space-y-1">
              <p>solana-test-validator</p>
              <p>solana airdrop 100 &lt;WALLET_ADDRESS&gt; --url localhost</p>
            </div>
          </div>
          <p>
            For a full list of options, see the{" "}
            <Link
              href="https://solana.com/developers/guides/getstarted/solana-token-airdrop-and-faucets"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground inline-flex items-center gap-0.5"
            >
              Solana devnet SOL guide
              <ExternalLink className="w-3 h-3" />
            </Link>
          </p>
        </div>
      </details>
    </div>
  );
};
