import Image from "next/image";

export function Footer() {
  return (
    <div className="w-full fixed bottom-0 left-0 flex flex-col p-10">
      <div className="flex flex-col items-center justify-center space-y-4">
        <p className="text-white/50 text-center text-xs sm:text-sm">
          This Tool is designed for development purposes and does not distribute
          mainnet SOL.
        </p>
      </div>
    </div>
  );
}
