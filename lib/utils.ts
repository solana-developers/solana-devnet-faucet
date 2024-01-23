import { type ClassValue, clsx } from "clsx";
import { NextApiRequest } from "next";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getHeaderValues = (req: NextApiRequest, headerName: string) => {
  // Annoyingly, req.headers["x-forwarded-for"] can be a string or an array of strings
  // Let's just make it an array of strings
  let valueOrValues = req.headers[headerName] || [];
  if (Array.isArray(valueOrValues)) {
    return valueOrValues;
  }
  return [valueOrValues];
};
