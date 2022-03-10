import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Keypair, SystemProgram } from '@solana/web3.js';
import { FigLoan } from '../target/types/fig_loan';
import {
  initialize,
  register,
} from './fig-loan_instructions';
import fs from "fs";
import Arweave from 'arweave';
import { actions, utils, programs, NodeWallet} from '@metaplex/js'; 
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';

describe('fig-loan', () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.FigLoan as Program<FigLoan>;

  const admin = Keypair.generate();
  const user1 = Keypair.generate();
  const user2 = Keypair.generate();
  let imageUrl = undefined;

  (async () => {

    const arweave = Arweave.init({
        host: 'arweave.net',
        port: 443,
        protocol: 'https',
        timeout: 20000,
        logging: false,
    });

    // Upload image to Arweave
    const data = fs.readFileSync('./a.png');
    
    const transaction = await arweave.createTransaction({
        data: data
    });
    
    transaction.addTag('Content-Type', 'image/png');
    
    const wallet = await arweave.wallets.generate();
    await arweave.transactions.sign(transaction, wallet);
    
    const response = await arweave.transactions.post(transaction);
    console.log(response);

    const { id } = transaction;
    imageUrl = id ? `https://arweave.net/${id}` : undefined;
    console.log(imageUrl);

    const connection = new Connection(
      clusterApiUrl('devnet'),
      'confirmed',
    );
    const keypair = Keypair.generate();
    const feePayerAirdropSignature = await connection.requestAirdrop(keypair.publicKey, LAMPORTS_PER_SOL);
    await connection.confirmTransaction(feePayerAirdropSignature);
    console.log("we are here");
  
    const mintNFTResponse = await actions.mintNFT({
      connection,
      wallet: new NodeWallet(keypair),
      uri: imageUrl,
      maxSupply: 1
    });
    console.log("are we here");
  
    console.log(mintNFTResponse);
  })();
  
/*
  it('Is initialized!', async () => {
    // airdrop to admin account
    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(
        admin.publicKey,
        1_000_000_000
      ),
      "confirmed"
    );
    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(
        user1.publicKey,
        1_000_000_000
      ),
      "confirmed"
    );

    const coreState = await initialize(admin);
    console.log("Core State: ", await program.account.coreState.fetch(coreState));
  });

  it('Check Wallet', async () => {
    const figAccount = await register(admin, user1.publicKey);

    console.log("Fig Account: ", await program.account.figAccount.fetch(figAccount));
  });
  */
});
