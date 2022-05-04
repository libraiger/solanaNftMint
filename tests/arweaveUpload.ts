import fs from "fs";
import path from "path";

import Arweave from "arweave";
import { JWKInterface } from "arweave/node/lib/wallet";

const arweaveClient = Arweave.init({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});

const getMimeTypeForPath = (filePath: string): string => {
  const knownExtensions = {
    png: "image/png",
    gif: "image/gif",
    mp4: "video/mp4",
    json: "application/json",
    html: "text/html",
  };
  const mimeType =
    knownExtensions[
      path.extname(filePath).replace(".", "") as keyof typeof knownExtensions
    ];

  if (!mimeType) {
    throw new Error("Extension not recognised.");
  }

  return mimeType;
};

export const upload = async (
  filePath: string,
): Promise<string> => {
  console.log("here");
  const fileData = fs.readFileSync(filePath);
  const wallet = await arweaveClient.wallets.generate();

  const transaction = await arweaveClient.createTransaction(
    { data: fileData },
    wallet
  );
  transaction.addTag("Content-Type", getMimeTypeForPath(filePath));
  await arweaveClient.transactions.sign(transaction, wallet);

  const uploader = await arweaveClient.transactions.getUploader(transaction);
  while (!uploader.isComplete) {
    await uploader.uploadChunk();
    console.log(
      `${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`
    );
  }

  const {
    api: { host, protocol },
  } = arweaveClient.getConfig();

  return `${protocol}://${host}/${transaction.id}`;
};