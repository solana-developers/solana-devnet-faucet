import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/ui/footer";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { SITE } from "@/lib/constants";

// const inter = Inter({ subsets: ["latin"] });

/**
 * Set the default metadata for all pages on the site
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "Solaxy Devnet Faucet – Airdrop Devnet SOLX",
  description:
    "Claim SOLX tokens for development purposes on the Solaxy Devnet.",
  openGraph: {
    images: "/solaxyLogo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* <body className={`${inter.className}`}> */}
      <body>
        <Header />
        <section className="p-4 mx-auto space-y-10 md:p-0 md:space-y-0">
          {children}
        </section>
        <Footer />
      </body>
    </html>
  );
}
