const { getNetworkClient } = require("@colony/colony-js-client");
const { open } = require("@colony/purser-software");
const BN = require("bn.js");
const path = require("path");
const fs = require("fs-extra");

(async () => {
  // Open Wallet
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

  // Get generated addresses in colony.js
  const { colonyAddress } = fs.readJsonSync(
    "./generated_data/addresses.json",
    "utf8"
  );
  console.log(`Colony address: ${colonyAddress}`);

  // Get a colony client instance using the network client instance
  const colonyClient = await networkClient.getColonyClientByAddress(
    colonyAddress
  );

  // Set an admin using the colony client instance
  await colonyClient.setAdminRole.send({
    user: wallet.address
  });

  const parentDomainId = 1; // Root domain

  // Create a domain
  const createDomainResponse = await colonyClient.addDomain.send({
    parentDomainId
  });

  if (createDomainResponse && createDomainResponse.successful === true) {
    console.log("Domain creation successful");
  }

  // Save into generated_data directory

  const buildPath = path.resolve(__dirname, "./generated_data");
  fs.ensureDirSync(buildPath);

  fs.outputJsonSync(
    path.resolve(buildPath, "domain.json"),
    createDomainResponse
  );
})()
  .then(() => process.exit())
  .catch(error => {
    console.error(error);
    process.exit();
  });
