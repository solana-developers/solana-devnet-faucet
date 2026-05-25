/**
 * Master global types for the website/app
 */

type Option<T> = T | null;

type SimpleComponentProps = {
  children?: React.ReactNode;
  className?: string;
};

type ImageSize = {
  width: number;
  height: number;
};

/**
 * Define simple type definitions of the env variables
 */
declare namespace NodeJS {
  export interface ProcessEnv {
    /**
     * General variables and settings
     */
    RPC_URL_DEVNET: string;
    RPC_URL_TESTNET: string;
    FAUCET_KEYPAIR_NEW: string;

    CLOUDFLARE_SECRET: string;
    IP_ALLOW_LIST: string;
    AUTH_TOKENS_ALLOW_LIST: string;

    /**
     * Backend API authentication
     */
    BE_TOKEN: string;
    BE_SERVICE_ACCOUNT_KEY: string;

    /**
     * Server-side analytics (GA4 Measurement Protocol). Optional —
     * trackEvent() is a no-op when either is unset.
     */
    GA4_MEASUREMENT_ID: string;
    GA4_API_SECRET: string;

    /**
     * Auth related variables
     */
    NEXTAUTH_SECRET: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
  }
}
