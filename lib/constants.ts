/**
 * General constants used for the website
 */
export const SITE = {
  domain: "faucet.solana.com",
  url: "https://faucet.solana.com",
};

/**
 * Faucet funding accounts tracked by the balance monitor.
 *
 * Order matters: the /monitor page renders one chart per entry
 * (POW Faucet 2, POW Faucet 1, Web Faucet — see app/monitor/page.tsx).
 * When rotating the web faucet key, update both this list and the
 * corresponding web faucet keypair configuration.
 */
export const FAUCET_ACCOUNTS = [
  "6yvwhesLJeE8fNWviosRoUtBP3VFUXE7SEhSP9fFRJ3Z",
  "2pekXzx7WRPtdj4Gvtif1mzmHfc21zpNx2AvW9r4g7bo",
  "dev2JBjyB5CshoGsiJCwzdmJYiEUwAXMdqDR7txoFBJ",
] as const;
