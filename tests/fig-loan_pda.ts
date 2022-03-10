import * as anchor from '@project-serum/anchor';
import { PublicKey } from "@solana/web3.js";

const CORE_STATE_SEED = "core-state";
const FIG_ACCOUNT_SEED = "fig-account";

export async function getCoreState(programId: PublicKey, admin: PublicKey) {
  return await anchor.web3.PublicKey.findProgramAddress(
    [
      Buffer.from(anchor.utils.bytes.utf8.encode(CORE_STATE_SEED)),
      admin.toBuffer()
    ],
    programId
  );
}

export async function getFigAccount(programId: PublicKey, user: PublicKey) {
  return await anchor.web3.PublicKey.findProgramAddress(
    [
      Buffer.from(anchor.utils.bytes.utf8.encode(FIG_ACCOUNT_SEED)),
      user.toBuffer()
    ],
    programId
  );
}
