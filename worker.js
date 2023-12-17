// Transaction confirmation poller

import { parentPort } from "worker_threads";
import Arweave from "arweave";
import config from "./config.js";

// Initialize Arweave as you did in your main script
const arweave = Arweave.init({
  host: config.NODE_QUERY, // Hostname or IP address for a Arweave host
  port: 1984, // Port
  protocol: "http", // Network protocol http or https
  timeout: 20000, // Network request timeouts in milliseconds
  logging: false, // Enable network request logging
});



let txQueue = [];
let index = 0;
parentPort.on("message", async (transactionId) => {
  //   console.log(`Processing transaction ID: ${transactionId}`);
  txQueue.push(transactionId);
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const query = async () => {
  // txQueue[index] = "ZhcK0itkkFoYmLLmXRf-uPVtS8lqal2bJL8VCQmnHh4";
  while (true) {
    console.log("Polling confirmations\n");
    const newTxConfirmation = await arweave.transactions
      .getStatus(txQueue[index])
      .then((res) => {
        if (res.status == 200) {
          index += 1;
          parentPort.postMessage(`${txQueue[index]} just confirmed.`);
          return true;
        } else {
          return false;
        }
      });
    newTxConfirmation
      ? await wait(config.INTERVAL_NEW_TX_FOUND)
      : await wait(config.INTERVAL_POLLING);
  }
};
await query();
console.log("Worker thread started");
