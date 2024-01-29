import { cn } from "@/lib/utils";

export interface DropdownProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Dropdown: React.FC<DropdownProps> = ({ className, ...props }) => {
  return (
    <select
      className={cn(
        "block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <option value="devnet">devnet</option>
      <option value="testnet">testnet</option>
    </select>
  );
};
