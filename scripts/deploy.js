const hre = require("hardhat");
const ethers = hre.ethers;

async function deployLibraryContract() {
    await hre.run("compile"); // We are compiling the contracts using subtask
    const [deployer] = await ethers.getSigners(); // We are getting the deployer

    await hre.run("print", {
        message: "Deploying contracts with the account:" + deployer.address,
    }); // We are printing the address of the deployer
    await hre.run("print", {
        message: "Account balance:" + (await deployer.getBalance()).toString(),
    }); // We are printing the account balance

    const technoLimeStore = await ethers.getContractFactory(
        "TechnoLimeStoreContract"
    ); // Get the contract factory with the signer from the wallet created
    const technoLimeStoreContract = await technoLimeStore.deploy();
    await hre.run("print", {
        message: "Waiting for technoLimeStoreContract deployment...",
    });
    await technoLimeStoreContract.deployed();

    await hre.run("print", {
        message:
            "Deployed technoLimeStoreContract on contract address: " +
            technoLimeStoreContract.address,
    });
    technoLimeStoreContract.deployTransaction.wait(15);
    await hre.run("verify:verify", {
        address: technoLimeStoreContract.address,
        constructorArguments: [],
    });

    await hre.run("print", { message: "Verified." });
    await hre.run("print", { message: "Done!" });
}

module.exports = deployLibraryContract;
