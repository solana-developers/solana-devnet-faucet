import "./globals.css";
import { Outfit } from "next/font/google";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

const outfit = Outfit({ subsets: ["latin"] });

const metadata = {
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
      <body className={outfit.className}>{children}</body>
    </html>
  );
}
