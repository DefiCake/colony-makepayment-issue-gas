const { getNetworkClient } = require("@colony/colony-js-client");
const { open } = require("@colony/purser-software");
const BN = require("bn.js");
const path = require("path");
const fs = require("fs-extra");

(async () => {
  const FOUNDER_ROLE = "FOUNDER";
  const ADMIN_ROLE = "ADMIN";

  const OneTxPaymentAddress = "0xD447E2a66f50EB067a9bFe52296354C629fD2214";

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

  // Get colony client

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

  const OneTxPaymentAddressHasAdminRole = await colonyClient.hasUserRole.call({
    user: OneTxPaymentAddress,
    role: ADMIN_ROLE
  });

  if (OneTxPaymentAddressHasAdminRole.hasRole === true)
    console.log(`OneTxPayment has admin role`);
  else console.log(`OneTxPayment does NOT have admin role`);

  const FounderHasAdminRole = await colonyClient.hasUserRole.call({
    user: wallet.address,
    role: ADMIN_ROLE
  });

  if (FounderHasAdminRole.hasRole === true)
    console.log(`Founder has admin role`);
  else console.log(`Founder does NOT have admin role`);

  const domainData = fs.readJsonSync("./generated_data/domain.json", "utf8");

  const fromPot = 1;
  const toPot = domainData.eventData.potId;
  const amount = new BN(10);
  const token = tokenAddress;

  const moveFundsResponse = await colonyClient.moveFundsBetweenPots.send({
    fromPot,
    toPot,
    amount,
    token
  });

  if (moveFundsResponse && moveFundsResponse.successful === true) {
    console.log("Funds moved successfully");
  }
  console.log(moveFundsResponse);

  const worker = "0xDCF7bAECE1802D21a8226C013f7be99dB5941bEa";
  const domainId = domainData.eventData.domainId;
  skillId = domainData.eventData.skillId;

  const makePaymentResponse = await colonyClient.makePayment.send({
    worker,
    token,
    amount,
    domainId,
    skillId
  });

  console.log(makePaymentResponse);
})()
  .then(() => process.exit())
  .catch(error => {
    console.error(error);
    process.exit();
  });

/*

  Source code of OneTxPayment:


  This file is part of The Colony Network.

  The Colony Network is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  The Colony Network is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with The Colony Network. If not, see <http://www.gnu.org/licenses/>.


pragma solidity >=0.4.23 <0.5.0;
pragma experimental ABIEncoderV2;

import \"./../IColony.sol\";
import \"./../../lib/dappsys/roles.sol\";


contract OneTxPayment {
  function makePayment(address _colony, address _worker, address _token, uint256 _amount, uint256 _domainId, uint256 _skillId) public {
    IColony colony = IColony(_colony);

    // Check caller is able to call makePayment on the colony
    // msg.sig is the same for this call as it is for the one we make below, so may as well use it here
    DSRoles authority = DSRoles(colony.authority());
    require(
      authority.canCall(
        msg.sender,
        _colony,
        bytes4(keccak256(\"makePayment(address,address,uint256,uint256,uint256)\"))
      ),
      \"colony-one-tx-payment-not-authorized\"
    );

    // Make payment
    colony.makePayment(_worker, _token, _amount, _domainId, _skillId);
  }


}


  */
