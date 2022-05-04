import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { FigLoan } from '../target/types/fig_loan';
import {
  initialize,
  register,
} from './fig-loan_instructions';
import fs from "fs";
import Arweave from 'arweave';
import { actions, utils, programs, NodeWallet} from '@metaplex/js'; 
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, PublicKey } from '@solana/web3.js';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata'; 

describe('fig-loan', () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

//  const program = anchor.workspace.FigLoan as Program<FigLoan>;

  const admin = Keypair.generate();
  const user1 = Keypair.generate();
  const user2 = Keypair.generate();
  let videoUrl = undefined;
  let metadata = undefined;
  let wallet;

  (async () => {

    /* Upload Docx To Arweave and Get Mint Address */
    const arweave = Arweave.init({
        host: 'arweave.net',
        port: 443,
        protocol: 'https',
    });
    const keypair = Keypair.generate();
    console.log(keypair.publicKey.toBase58());

    // Upload image to Arweave
    for(var i = 1;i <= 6; i++) {
      console.log(i+"th Loop");
      const fileData = fs.readFileSync(`./metadata/${i}.png`);
      
      const transaction = await arweave.createTransaction({
          data: fileData
      });
      
      transaction.addTag('Content-Type', 'image/png');
      if(!wallet) wallet = await arweave.wallets.generate();
      
      await arweave.transactions.sign(transaction, wallet);
      console.log(transaction);
      
      const uploader = await arweave.transactions.post(transaction);
      /*
      while (!uploader.isComplete) {
        await uploader.uploadChunk();
        console.log(
          `${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`
        );
      }
      */
      const { id } = transaction;
      videoUrl = id ? `https://arweave.net/${id}` : undefined;
      console.log(videoUrl);

      metadata = await require(`../metadata/${i}.json`);

      metadata['properties'] = {
        files: [
          {
            uri: videoUrl,
            type: "video/mp4",
          },
        ],
        category: "mp4",
        maxSupply: 0,
        creators: [
          {
            address: keypair.publicKey,
            share: 100,
          },
        ],
      };
      metadata['video'] = videoUrl;
      console.log(metadata);

      const metadataRequest = JSON.stringify(metadata);
      
      const metadataTransaction = await arweave.createTransaction({
          data: metadataRequest
      });
      
      metadataTransaction.addTag('Content-Type', 'application/json');
      
      await arweave.transactions.sign(metadataTransaction, wallet);

      const url = metadataTransaction.id;
      videoUrl = url ? `https://arweave.net/${url}` : undefined;
      
      const response = await arweave.transactions.post(metadataTransaction);

      const connection = new Connection(
        clusterApiUrl('devnet'),
        'confirmed',
      );
      const feePayerAirdropSignature = await connection.requestAirdrop(keypair.publicKey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(feePayerAirdropSignature);
      console.log("here");
    
      const mintNFTResponse = await actions.mintNFT({
        connection,
        wallet: new NodeWallet(keypair),
        uri: videoUrl,
        maxSupply: 1
      });
    
      console.log(mintNFTResponse.mint.toBase58());
      

      /* Get URL from Address */

      
      const metadataPDA = await Metadata.getPDA(mintNFTResponse.mint);
      await new Promise(f => setTimeout(f, 20000));
      const tokenMetadata = await Metadata.load(connection, metadataPDA);
      console.log(tokenMetadata.data.data.uri);
    }

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

// import { upload } from "./arweaveUpload";

// const run = async () => {
//   for (let i = 1; i <= 1; i++) {
//     console.log(`Uploading ${i}...`);

//     const pngUrl = await upload(`./metadata/${i}.png`);
//     console.log(pngUrl);
//   }
// };

// run();