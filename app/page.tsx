import type { Metadata } from "next";
import { GradientBlob } from "@/components/GradientBlob";
import { AirdropForm } from "@/components/AirdropForm";
// import { GitHubConnectForm } from "@/components/GitHubConnectForm";
// import { getUserSession } from "@/lib/auth";
// import { getAirdropRateLimitForSession } from "@/lib/utils";

/**
 * Set the custom metadata for this specific page
 */
export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

// export default async function Page() {
//   const session = await getUserSession();
//   const rateLimit = await getAirdropRateLimitForSession(session);
export default function Page() {
  return (
    <main className="items-center justify-center w-full space-y-8 md:py-20">
      <AirdropForm className="items-center justify-center w-full md:flex" />
      <GradientBlob />
    </main>
  );
}
