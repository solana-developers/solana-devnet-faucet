import Image from "next/image";

export function Header() {
  return (
    <div className="w-full fixed top-0 left-0 flex flex-col p-10">
      <div className="flex flex-col items-center justify-center space-y-4">
        <Image
          src="/solanaLogo.svg"
          alt="Solana Logo"
          width={120}
          height={40}
        />
      </div>
    </div>
  );
}
