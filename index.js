// Main logic

import Arweave from "arweave";
import fs from "fs";
import { Worker } from "worker_threads";
import config from "./config.js";

let txTotal = 0;
let txConfirmed = 0;
let txFailed = 0;

const msgDividerDash = "\n--------------------------------------------\n";
const msgDivider = "\n++++++++++++++++++++++++++++++++++++++++++++\n";

const arweave = Arweave.init({
  host: config.NODE_SUBMIT, // Hostname or IP address for a Arweave host
  port: 1984, // Port
  protocol: "http", // Network protocol http or https
  timeout: 20000, // Network request timeouts in milliseconds
  logging: false, // Enable network request logging
});
const worker = new Worker("./worker.js");

const initWallet = async () => {
  let pk;
  try {
    await fs.promises.access(config.PK_PATH, fs.constants.F_OK);
    const data = await fs.promises.readFile(config.PK_PATH, "utf8");
    pk = JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      pk = await arweave.wallets.generate();
      await fs.promises.writeFile(
        config.PK_PATH,
        JSON.stringify(pk, null, 2),
        "utf8"
      );
      console.log(
        "No private key, generated one and saved to '" +
          config.PK_PATH +
          "', KEEP IT SAFE."
      );
      console.log(
        "Replace the pk.json if you want to use your existing private key."
      );
    } else {
      throw err;
    }
  }
  const addr = await arweave.wallets.jwkToAddress(pk);
  const balance = await arweave.wallets.getBalance(addr).then((balance) => {
    const arBalance = arweave.ar.winstonToAr(balance);
    return arBalance;
  });

  console.log(
    msgDivider +
      "ACCOUNT\n" +
      addr +
      msgDividerDash +
      "BALANCE\n" +
      balance +
      msgDivider
  );

  if (balance == "0.000000000000") {
    console.log("No balance in your address, plase top up.");
    process.exit(1);
  }

  return pk;
};

async function main() {
  const startTime = Date.now();
  const pk = await initWallet();
  const opCost = config.OP_COST;
  const transaction = await arweave.createTransaction(
    {
      target: config.BLACK_HOLE_ADDR,
      quantity: arweave.ar.arToWinston(opCost), // should be the quantity asked by the OP
      data: JSON.stringify(config.DATA),
    },
    pk
  );

  const addr = await arweave.wallets.jwkToAddress(pk);

  while (true) {
    try {
      await executeOP(pk, transaction, startTime);
    } catch (err) {
      console.error(err);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

async function executeOP(pk, transaction, startTime) {
  try {
    // console.log(transaction);
    await arweave.transactions.sign(transaction, pk);

    if (config.FAST) {
      arweave.transactions.post(transaction);
    } else {
      const response = await arweave.transactions.post(transaction);
      if (response.status < 200 || response.status >= 300) {
        console.error("Transaction failed", response.status, response.data);
        txFailed += 1;
      } else {
        worker.postMessage(transaction.id);
        console.log(`${transaction.id} sent.`);
        // console.log(response.status);
      }
    }

    txTotal += 1;
    console.log(msgDivider + "Total txs: " + txTotal);
    console.log("Confirmed txs: " + txConfirmed);
    if (!config.FAST) console.log("Txs failed: " + txFailed);
    console.log("Time elapsed: " + elapsedTime(startTime) + msgDivider);

    await wait(config.INTERVAL_SUBMITTING);
  } catch (err) {
    console.error(err);
  }
}

worker.on("message", (result) => {
  console.log(`Result: ${result}`);
  txConfirmed += 1;
});

function elapsedTime(start) {
  const diff = Date.now() - start;
  const minutes = Math.floor(diff / 60000);
  const seconds = ((diff % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
