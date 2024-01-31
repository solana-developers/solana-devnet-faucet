import type { Metadata } from "next";
import { GradientBlob } from "@/components/GradientBlob";
import { AirdropForm } from "@/components/AirdropForm";

/**
 * Set the custom metadata for this specific page
 */
export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default async function Page() {
  return (
    <main className="items-center justify-center w-full md:flex md:py-20">
      <AirdropForm className="items-center justify-center w-full md:flex md:py-20" />

      <GradientBlob />
    </main>
  );
}
