const { getNetworkClient } = require("@colony/colony-js-client");
const { open } = require("@colony/purser-software");
const BN = require("bn.js");
const path = require("path");
const fs = require("fs-extra");

(async () => {
  // Step 1: Open Wallet

  const privateKey = fs.readFileSync("./private-key.txt", "utf8").trim();

  // Get a wallet instance
  const wallet = await open({
    privateKey
  });

  // Check out the logs to see the wallet address
  console.log("Wallet Address:", wallet.address);

  // Step 2: Get Network Client

  // Get a network client instance
  const networkClient = await getNetworkClient("rinkeby", wallet);

  // Check out the logs to see the network address
  console.log("Network Address:", networkClient.contract.address);

  // Step 3: Create Token

  // Create a token using the network client instance
  const {
    meta: {
      receipt: { contractAddress: tokenAddress }
    }
  } = await networkClient.createToken.send({
    symbol: "TKN"
  });

  // Check out the logs to see the token address
  console.log("Token Address: ", tokenAddress);

  // Step 4: Create Colony

  // Create a colony using the network client instance
  const {
    eventData: { colonyAddress }
  } = await networkClient.createColony.send({
    tokenAddress
  });

  // Check out the logs to see the colony address
  console.log("Colony Address:", colonyAddress);

  // Step 5: Get Colony Client

  // Get a colony client instance using the network client instance
  const colonyClient = await networkClient.getColonyClientByAddress(
    colonyAddress
  );

  // Step 6: Allow Payments

  const OneTxPaymentAddress = "0xD447E2a66f50EB067a9bFe52296354C629fD2214";

  // Set an admin using the colony client instance
  await colonyClient.setAdminRole.send({
    user: OneTxPaymentAddress
  });

  // Step 7: Make Payment

  // Make a payment using the colony client instance
  const tx = await colonyClient.makePayment.send({
    worker: wallet.address,
    token: "0x0000000000000000000000000000000000000000",
    amount: new BN(0),
    domainId: 1,
    skillId: 1
  });

  console.log("Transaction Hash:", tx.meta.transaction.hash);

  // Save into generated_data directory

  const buildPath = path.resolve(__dirname, "./generated_data");
  fs.removeSync(buildPath);
  fs.ensureDirSync(buildPath);

  const addresses = {
    tokenAddress,
    colonyAddress,
    OneTxPaymentAddress
  };

  fs.outputJsonSync(path.resolve(buildPath, "addresses.json"), addresses);
})()
  .then(() => process.exit())
  .catch(error => {
    console.error(error);
    process.exit();
  });
