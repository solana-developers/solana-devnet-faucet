# Solana Devnet Faucet with rate limiting

This is the code for the [Solana Devnet Faucet](https://faucet.solana.com/)

## Run tests

```
npm run test
```

Or to run a single test, for example:

```
npx jest -t 'is a PDA'
```

## Run locally for development

You'll need an `.env` file with:

```
FAUCET_KEYPAIR=[numbers...]
POSTGRES_STRING="some string"
```

And then run:

```
npm run dev
```

## Deploy

Deploying is done automatically as soon as the code is committed onto master via Vercel.

Vercel also needs these details:

```
RPC_URL: "string"
CLOUDFLARE_SECRET: "string"
```
