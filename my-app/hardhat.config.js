require("@nomicfoundation/hardhat-toolbox");
const { vars } = require("hardhat/config");   // vars 객체 불러오기
const PRIVATE_KEY = vars.get("PRIVATE_KEY");  // 저장한 값 읽기

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    localhost: { chainId: 31337, },
    sepolia: {
      url: "https://eth-sepolia.public.blastapi.io",
      chainId: 11155111,
      accounts: [PRIVATE_KEY]
    },
  },
};
