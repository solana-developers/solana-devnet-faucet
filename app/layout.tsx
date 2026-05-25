import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Header } from "@/components/header";
import { Footer } from "@/components/ui/footer";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { SITE } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"] });

/**
 * Set the default metadata for all pages on the site
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "Solana Devnet Faucet - Airdrop SOL",
  description:
    "Get a SOL airdrop from this public Solana Faucet, on devnet or testnet.",
  openGraph: {
    images: "/social-image.jpg?987ygh",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <Header />

        <section className="p-4 mx-auto space-y-10 md:p-0 md:space-y-0">
          {children}
        </section>

        <Footer />

        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
