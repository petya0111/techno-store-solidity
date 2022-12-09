const { task } = require("hardhat/config");

task("deploy-testnets", "Deploys contract on a provided network").setAction(
    async () => {
        const deployBookLibraryContract = require("../scripts/deploy.js");
        await deployBookLibraryContract();
    }
);
subtask("print", "Prints a message")
    .addParam("message", "The message to print")
    .setAction(async (taskArgs) => {
        console.log(taskArgs.message);
    });
