import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { FigLoan } from '../target/types/fig_loan';
import {
  getCoreState,
  getFigAccount
} from './fig-loan_pda';

const program = anchor.workspace.FigLoan as Program<FigLoan>;

export async function initialize(admin: Keypair) {
  let [coreState, coreStateNonce] = await getCoreState(program.programId, admin.publicKey);
  await program.rpc.initialize({
    coreStateNonce
  }, {
    accounts: {
      admin: admin.publicKey,
      coreState,
      systemProgram: SystemProgram.programId
    },
    signers: [admin]
  });
  return coreState;
}

export async function register(admin: Keypair, user: PublicKey) {
  let [coreState, coreStateNonce] = await getCoreState(program.programId, admin.publicKey);
  let [figAccount, figAccountNonce] = await getFigAccount(program.programId, user);
  await program.rpc.register({
    coreStateNonce,
    figAccountNonce
  }, {
    accounts: {
      admin: admin.publicKey,
      figAccount,
      coreState,
      user,
      systemProgram: SystemProgram.programId
    },
    signers: [admin]
  });
  return figAccount;
}
