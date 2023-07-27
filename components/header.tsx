import Image from "next/image";

export function Header() {
  return (
    <div className="w-full fixed top-0 left-0 flex flex-col p-10">
      <div className="flex flex-col items-center justify-center space-y-4">
        <h1 className="text-4xl font-normal">Solana Devnet Faucet</h1>
        <Image src="/solana.png" alt="" width={60} height={20} />
      </div>
    </div>
  );
}
