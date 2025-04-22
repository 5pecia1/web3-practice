const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const metadataUrl =
  "ipfs://bafkreidovtvsgscp4673n5w4axsafpe6c3n7ha25kkamywh2renrklywqy";

module.exports = buildModule("MyTokenModule", (m) => {
  const owner = m.getAccount(0);

  const myContract = m.contract("MyToken", [owner]);

  m.call(myContract, "safeMint", [owner, metadataUrl]);

  return { myContract };
});