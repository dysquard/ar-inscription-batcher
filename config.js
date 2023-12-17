import { OP_DEPLOY, OP_MINT, OP_TRANSFER } from "./operations.js";
import nodes from "./nodes.js";
const ipOnly = (ipWithPort) => ipWithPort.replace(/:\d+$/, "");

// Transaction data
OP_MINT.tick = "YOUR_TOKEN_NAME"; //*STRING* Token name.
OP_MINT.amt = "1000"; //*STRING* mint amount, cannot exceed `lim` in your token's deploy script.
const OP_COST = "0"; //*STRING* For mint: Must equal to `burn` in your token's deploy script; For deploy: Must be 1.
const DATA = OP_MINT; // This will be set to any OP_XXXX depending on the operation. Normally we use script for minting.

// Network profile
const NODE_SUBMIT = 1; // if you have connection problem, set to a different node number listed in './nodes.js'.
const NODE_QUERY = 1; // if you have connection problem, set to a different node number listed in './nodes.js'.
const INTERVAL_NEW_TX_FOUND = 100;
const INTERVAL_POLLING = 100000; // ms - pooling tx confirmation ineterval.
const INTERVAL_SUBMITTING = 800; // ms - This is not accurate since it's affected by async methods.
const FAST = false; // if set to true, get max speed by ignoring http request response, but if too fast you may get rejected by server.

// Set your private key file, should be JWK format.
const PK_PATH = "./pk.json";

const config = {
  INTERVAL_NEW_TX_FOUND,
  INTERVAL_POLLING,
  NODE_SUBMIT:ipOnly(nodes[NODE_SUBMIT]),
  NODE_QUERY:ipOnly(nodes[NODE_QUERY]),
  OP_COST,
  FAST,
  DATA,
  INTERVAL_SUBMITTING,
  BLACK_HOLE_ADDR: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  PK_PATH,
};

export default config;
