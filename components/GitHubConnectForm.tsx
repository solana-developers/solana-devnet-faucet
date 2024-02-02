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
import { GithubIcon } from "lucide-react";
import Image from "next/image";
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
    <Card className="w-full mx-auto md:max-w-lg">
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

        {/* <CardDescription>
          By connecting your GitHub account, you authorize this application to
          read your private GitHub profile information.
        </CardDescription> */}
      </CardContent>
    </Card>
  );
};
