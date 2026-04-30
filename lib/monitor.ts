import { FAUCET_ACCOUNTS } from "@/lib/constants";

export interface Balance {
  account: string;
  balance: number;
  date: string;
}

export interface ChartData {
  name: string;
  [key: string]: number | string;
}

const FAUCET_ACCOUNTS_SET: ReadonlySet<string> = new Set(FAUCET_ACCOUNTS);

/**
 * Group balance rows by date into a recharts-friendly shape, dropping rows
 * whose account is not in FAUCET_ACCOUNTS. The backend's /solana-balances/recent
 * returns the last month unfiltered, so retired keys can leak in until they
 * age out — we filter them at this seam.
 */
export function buildChartData(rows: Balance[]): ChartData[] {
  const dataMap: { [date: string]: ChartData } = {};

  for (const r of rows) {
    if (!FAUCET_ACCOUNTS_SET.has(r.account)) continue;

    if (!dataMap[r.date]) {
      dataMap[r.date] = { name: new Date(r.date).toLocaleDateString() };
    }
    dataMap[r.date][r.account] = r.balance;
  }

  return Object.values(dataMap);
}
