require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("solidity-coverage");
require("dotenv").config();
require("./tasks/hardhat-tasks");

/** @type import('hardhat/config').HardhatUserConfig */
const developmentChains = ["hardhat", "localhost"];
module.exports = {
    solidity: {
        version: "0.8.9",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 1337,
        },
        goerli: {
            url: process.env.GOERLI_RPC_URL_KEY,
            accounts: [process.env.PRIVATE_KEY],
        },
    },
    etherscan: {
        // Your API key for Etherscan
        // Obtain one at https://etherscan.io/
        apiKey: process.env.ETHERSCAN_KEY,
    },
    developmentChains,
};
