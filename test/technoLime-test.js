const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { developmentChains } = require("../hardhat.config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("TechnoLimeStore", function () {
          let technoLimeStore;
          let admin;
          let address1;
          let productQuantity = 50;
          before(async () => {
              let technoLimeStoreFactory = await ethers.getContractFactory(
                  "TechnoLimeStoreContract"
              );
              technoLimeStore = await technoLimeStoreFactory.deploy();
              const [owner, addr1] = await ethers.getSigners();
              admin = owner;
              address1 = addr1;
              await technoLimeStore.deployed({ from: owner });
          });

          describe("Add techno product", function () {
              it("Should be reverted if other account is adding the product different from administrator", async function () {
                  expect(
                      technoLimeStore.connect(address1).addNewProduct("name", 1)
                  ).to.be.revertedWith("Ownable: caller is not the owner");
              });

              it("Should throw if name of the product is not presented", async function () {
                  expect(
                      technoLimeStore.addNewProduct("", productQuantity)
                  ).to.be.revertedWithCustomError(
                      technoLimeStore,
                      "LimeStore__BlankField"
                  );
              });

              it("Should be created a new book from administrator and emit LogBookAdded", async function () {
                  const productName = "Tech Hits";
                  await expect(
                      technoLimeStore
                          .connect(admin)
                          .addNewProduct(productName, productQuantity)
                  )
                      .to.emit(technoLimeStore, "LogTechnoProductAdded")
                      .withArgs(productName, productQuantity);
                  const allProducts =
                      await technoLimeStore.getAllAvailableProductIds();
                  const hashFirstProduct = allProducts[0];
                  const getFirstProductDetail =
                      await technoLimeStore.getProductDetail(
                          hashFirstProduct
                      );
                  expect(getFirstProductDetail[0]).to.be.equal(productName);
              });
          });
      });
