import {
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { sendTransaction } from "@solana-developers/helpers";

import { getConnection } from "@/lib/rpc";

import { AirdropError, AirdropErrorCode } from "./airdrop-error";
import type { RequestContext } from "./types";

const PRIORITY_FEE_LAMPORTS = 1_000_000;

export async function executeAirdrop(ctx: RequestContext): Promise<string> {
  const { network, amount } = ctx.body;

  const connection = getConnection(network);
  const lamports = Math.round(amount * LAMPORTS_PER_SOL);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: ctx.faucetKeypair.publicKey,
      toPubkey: new PublicKey(ctx.body.recipientAddress),
      lamports,
    }),
  );

  let signature: string;
  try {
    signature = await sendTransaction(
      connection,
      transaction,
      [ctx.faucetKeypair],
      PRIORITY_FEE_LAMPORTS,
    );
  } catch (error) {
    throw new AirdropError(AirdropErrorCode.TX_FAILED, { cause: error });
  }

  if (!signature) {
    throw new AirdropError(AirdropErrorCode.TX_NO_SIGNATURE);
  }

  return signature;
}
