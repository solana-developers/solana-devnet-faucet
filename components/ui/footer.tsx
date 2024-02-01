import Link from "next/link";

export function Footer() {
  return (
    <div className="p-8 space-y-1">
      <p className="text-sm text-center text-white/50">
        This tool is designed for development purposes and does not distribute
        mainnet SOL.
      </p>
      <p className="text-sm text-center text-white/50">
        Operated by the{" "}
        <Link href="https://solana.org" target="_blank" className="underline">
          Solana Foundation
        </Link>
        .
      </p>
    </div>
  );
}
