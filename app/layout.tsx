import "./globals.css";
import { Inter } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/ui/footer";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Solana Devnet Faucet",
  description: "Get SOL from the Solana Devnet Faucet",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <Header />

        <section className="p-4 mx-auto space-y-10 md:p-0 md:space-y-0">
          {children}
        </section>

        <Footer />
      </body>
    </html>
  );
}
