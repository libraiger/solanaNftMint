import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { FigLoan } from '../target/types/fig_loan';
import {
  initialize,
  register,
} from './fig-loan_instructions';
import fs from "fs";
import Arweave from 'arweave';
import { actions, utils, programs, NodeWallet, Connection} from '@metaplex/js'; 
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, Keypair, SystemProgram, PublicKey } from '@solana/web3.js';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';

describe('fig-loan', () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.FigLoan as Program<FigLoan>;

  const admin = Keypair.generate();
  const user1 = Keypair.generate();
  const user2 = Keypair.generate();
  let docUrl = undefined;

  (async () => {

    /* Upload Docx To Arweave and Get Mint Address */
    const arweave = Arweave.init({
        host: 'arweave.net',
        port: 443,
        protocol: 'https',
        timeout: 20000,
        logging: false,
    });

    // Upload image to Arweave
    const data = fs.readFileSync('./1.docx');
    const keypair = Keypair.generate();
    
    const transaction = await arweave.createTransaction({
        data: data
    });
    
    transaction.addTag('Content-Type', 'file/docx');
    console.log("here");
    
    const wallet = await arweave.wallets.generate();
    await arweave.transactions.sign(transaction, wallet);
    
    await arweave.transactions.post(transaction);

    const { id } = transaction;
    docUrl = id ? `https://arweave.net/${id}` : undefined;

    const metadata = {
      name: "Custom NFT #1",
      symbol: "CNFT",
      description:
        "A description about my custom NFT #1",
      seller_fee_basis_points: 500,
      external_url: "https://www.customnft.com/",
      attributes: [
          {
              trait_type: "NFT type",
              value: "Custom"
          }
      ],
      collection: {
        name: "Test Collection",
        family: "Custom NFTs",
      },
      properties: {
        files: [
          {
            uri: docUrl,
            type: "file/docx",
          },
        ],
        category: "docx",
        maxSupply: 0,
        creators: [
          {
            address: keypair.publicKey,
            share: 100,
          },
        ],
      },
      image: docUrl,
    }

    const metadataRequest = JSON.stringify(metadata);
    
    const metadataTransaction = await arweave.createTransaction({
        data: metadataRequest
    });
    
    metadataTransaction.addTag('Content-Type', 'application/json');
    
    await arweave.transactions.sign(metadataTransaction, wallet);

    const url = metadataTransaction.id;
    docUrl = url ? `https://arweave.net/${url}` : undefined;
    console.log("here");
    
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
      uri: docUrl,
      maxSupply: 1
    });
  
//    console.log(mintNFTResponse.mint.toBase58());
    console.log(mintNFTResponse);
    console.log(mintNFTResponse.mint.toBase58());
    console.log(mintNFTResponse.metadata.toBase58());

    /* Get URL from Address */

    console.log("here");
    const metadataPDA = await Metadata.getPDA(mintNFTResponse.metadata);
    console.log("here");
    const tokenMetadata = await Metadata.load(connection, metadataPDA);
    console.log(tokenMetadata.data);

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
