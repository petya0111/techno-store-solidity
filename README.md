# TechnoLime Store


## Assignment

Please go through the chapters in order to prepare yourself fot the challenge.

[1. Intro to Blockchain](https://www.notion.so/limechain/01-Intro-to-Blockchain-for-FE-developers-93f81fc4999340e490e86474ee66fdc5)

[2. Intro to Ethereum](https://www.notion.so/limechain/02-Intro-to-Ethereum-1e345fc59b5a4608899df6ab96282d0a)

[3. Solidity - All you need to know](https://www.notion.so/limechain/03-Solidity-all-you-need-to-know-about-it-b67341cb42454ac88454f5b29169f510)

You challenge is to create the following smart contract:
## Your Contract

Using Remix/Hardhat develop a contract for a TechnoLime Store.

- The administrator (owner) of the store should be able to add new products and the quantity of them.
- The administrator should not be able to add the same product twice, just quantity.
- Buyers (clients) should be able to see the available products and buy them by their id.
- Buyers should be able to return products if they are not satisfied (within a certain period in blocktime: 100 blocks).
- A client cannot buy the same product more than one time.
- The clients should not be able to buy a product more times than the quantity in the store unless a product is returned or added by the administrator (owner)
- Everyone should be able to see the addresses of all clients that have ever bought a given product.

### Evaluation Criteria
    - Your code should be clean and easy to be read
    - Your code should be with effective method and variable names
    - Your code should contain correct description of the methods
    - [Optional] You should provide deployment scripts [Hardhat]
    - [Optional] You should provide good unit test cases [Hardat]
    - [Optional] You should provide 100% code coverage [Hardat]

### Additional Resources

[Remix](https://remix.ethereum.org/)

[Hardhat Quick Start](https://hardhat.org/hardhat-runner/docs/getting-started#quick-start)
