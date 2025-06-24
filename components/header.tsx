import Image from "next/image";
import solaxyLogo from "@/public/solaxyLogo.svg";

export function Header() {
  return (
    // <div className="top-0 left-0 w-full md:fixed">
    <div className="flex items-center justify-center w-full p-8 mx-auto">
      <Image src={solaxyLogo} alt="Solana Logo" height={54} />
    </div>
    // </div>
  );
}
