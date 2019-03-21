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

  // Get Network Client

  // Get a network client instance
  const networkClient = await getNetworkClient("rinkeby", wallet);

  // Check out the logs to see the network address
  console.log("Network Address:", networkClient.contract.address);

  // Get generated addresses in colony.js

  const { colonyAddress, tokenAddress } = fs.readJsonSync(
    "./generated_data/addresses.json",
    "utf8"
  );
  console.log(`Colony address: ${colonyAddress}`);
  console.log(`Token address address: ${tokenAddress}`);

  // Get a colony client instance using the network client instance
  const colonyClient = await networkClient.getColonyClientByAddress(
    colonyAddress
  );

  // As per https://github.com/JoinColony/colonyJS/issues/377
  // before minting tokens we need to set the owner of the colony.
  // The colony was deployed by running colony.js, to avoid deploying another
  // colony, I will make a check first just in case I have to run task2.js
  // multiple times for whatever reason

  // Thus, here we go:

  const currentOwner = await colonyClient.tokenClient._contract.owner();

  if (currentOwner != colonyAddress) {
    console.log("Setting colony address as owner");
    const setOwnerResponse = await colonyClient.tokenClient.setOwner.send({
      owner: colonyAddress
    });
  } else {
    console.log("Colony address is already the owner of the token");
  }

  // Just as before, make a check to ensure that no more tokens get minted,
  // in order not to waste rinkeby ethers if I have to debug this
  const totalSupply = await colonyClient.tokenClient._contract.totalSupply();
  const amount = new BN(10000);

  if (totalSupply.lt(amount)) {
    // Mint the tokens for the colony
    console.log("Minting 10000 tokens");
    const mintResponse = await colonyClient.mintTokens.send({
      amount
    });
  } else {
    console.log(`${amount} tokens were already minted`);
  }

  // Claim the funds for the colonyClient. Apparently, they go to potId 1 instead
  // of potId 0?

  const claimedFunds = await colonyClient.getFundingPotBalance.call({
    potId: 1,
    token: tokenAddress
  });

  if (claimedFunds.balance.lt(amount)) {
    console.log("Claiming funds");
    const claimColonyFundsResponse = await colonyClient.claimColonyFunds.send({
      token: tokenAddress
    });

    console.log(
      `Colony funds claimed: ${claimColonyFundsResponse &&
        claimColonyFundsResponse.successful}`
    );
  } else {
    console.log("Funds were already claimed");
  }
})()
  .then(() => process.exit())
  .catch(error => {
    console.error(error);
    process.exit();
  });
