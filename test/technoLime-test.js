const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { developmentChains } = require("../hardhat.config");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("TechnoLimeStore", function () {
          let limeTechStore;
          let admin;
          let alice;
          let bob;
          let carol;
          let productQuantity = 50;
          before(async () => {
              let technoLimeStoreFactory = await ethers.getContractFactory(
                  "TechnoLimeStoreContract"
              );
              limeTechStore = await technoLimeStoreFactory.deploy();
              const [owner, addr1, addr2, addr3] = await ethers.getSigners();
              admin = owner;
              alice = addr1;
              bob = addr2;
              carol = addr3;
              await limeTechStore.deployed({ from: owner });
          });

          describe("Add techno product", function () {
              it("Should be reverted if other account is adding the product different from administrator", async function () {
                  expect(
                      limeTechStore.connect(alice).addNewProduct("name", 1)
                  ).to.be.revertedWith("Ownable: caller is not the owner");
              });

              it("Should throw if name of the product is blank", async function () {
                  expect(
                      limeTechStore.addNewProduct("", productQuantity)
                  ).to.be.revertedWithCustomError(
                      limeTechStore,
                      "LimeTechStore__BlankField"
                  );
              });
              it("Should throw if quantity is zero or less than zero", async function () {
                  expect(
                      limeTechStore.addNewProduct("AirPods", 0)
                  ).to.be.revertedWithCustomError(
                      limeTechStore,
                      "LimeTechStore__IllegalQuantityInput"
                  );
                  expect(
                      limeTechStore.addNewProduct("AirPods", -1)
                  ).to.be.revertedWithCustomError(
                      limeTechStore,
                      "LimeTechStore__IllegalQuantityInput"
                  );
              });

              it("Should be created a new book from administrator and emit LogBookAdded", async function () {
                  const productName = "MacBook Pro 14";
                  expect(
                      await limeTechStore
                          .connect(admin)
                          .addNewProduct(productName, productQuantity)
                  )
                      .to.emit(limeTechStore, "LogTechnoProductAdded")
                      .withArgs(productName, productQuantity);
                  const allProducts =
                      await limeTechStore.getAllAvailableProductIds();
                  const hashFirstProduct = allProducts[0];
                  const getFirstProductDetail =
                      await limeTechStore.getProductDetail(hashFirstProduct);
                  expect(getFirstProductDetail[0]).to.be.equal(productName);
                  expect(getFirstProductDetail[1]).to.be.equal(productQuantity);
              });

              it("Should be added existing product with increased quantity", async function () {
                  const productName = "MacBook Pro 14";
                  expect(
                      await limeTechStore
                          .connect(admin)
                          .addNewProduct(productName, productQuantity)
                  );

                  const allProducts =
                      await limeTechStore.getAllAvailableProductIds();
                  const getFirstProductDetail =
                      await limeTechStore.getProductDetail(allProducts[0]);
                  expect(getFirstProductDetail[1]).to.be.equal(
                      productQuantity + productQuantity
                  );
              });
              it("Should be added product with quantity of 1 piece", async function () {
                  expect(
                      await limeTechStore
                          .connect(admin)
                          .addNewProduct("Logi Keyboard MX KEYS", 1)
                  );

                  const allProducts =
                      await limeTechStore.getAllAvailableProductIds();
                  const getFirstProductDetail =
                      await limeTechStore.getProductDetail(allProducts[1]);
                  expect(getFirstProductDetail[1]).to.be.equal(1);
              });
          });
          describe("Buy techno product", function () {
              it("Alice buys first tech product", async function () {
                  const allProducts =
                      await limeTechStore.getAllAvailableProductIds();
                  const firstProduct = allProducts[0];
                  expect(
                      await limeTechStore
                          .connect(alice)
                          .buyProduct(firstProduct)
                  ).to.emit(limeTechStore, "LogTechnoProductBought");
              });
              it("Alice buys second tech product", async function () {
                  const allProducts =
                      await limeTechStore.getAllAvailableProductIds();
                  const secondProduct = allProducts[1];
                  expect(
                      await limeTechStore
                          .connect(alice)
                          .buyProduct(secondProduct)
                  ).to.emit(limeTechStore, "LogTechnoProductBought");
                  await limeTechStore.getProductUsers(secondProduct);
              });
              it("Carol buys first tech product", async function () {
                  const allProducts =
                      await limeTechStore.getAllAvailableProductIds();
                  const firstProduct = allProducts[0];
                  expect(
                      await limeTechStore
                          .connect(carol)
                          .buyProduct(firstProduct)
                  ).to.emit(limeTechStore, "LogTechnoProductBought");
                  await limeTechStore.getProductUsers(firstProduct);
              });
              it("Alice tries to buy a product which she already own", async function () {
                  const allProducts =
                      await limeTechStore.getAllAvailableProductIds();
                  const secondProduct = allProducts[1];
                  expect(
                      await limeTechStore
                          .connect(alice)
                          .isProductAlreadyOwned(secondProduct)
                  ).to.equal(true);
                  expect(
                      limeTechStore.connect(alice).buyProduct(secondProduct)
                  ).to.be.revertedWithCustomError(
                      limeTechStore,
                      "LimeTechStore__AlreadyOwnedProduct"
                  );
              });
              it("Bob tries to buy a product which is out of stock", async function () {
                  const allProducts =
                      await limeTechStore.getAllAvailableProductIds();
                  const secondProduct = allProducts[1];
                  expect(
                      limeTechStore.connect(bob).buyProduct(secondProduct)
                  ).to.be.revertedWithCustomError(
                      limeTechStore,
                      "LimeTechStore__OutOfStock"
                  );
              });
          });
          describe("Return techno product", function () {
              it("Alice should return first product", async function () {
                  const allProducts =
                      await limeTechStore.getAllAvailableProductIds();
                  const firstProduct = allProducts[0];
                  expect(
                      await limeTechStore
                          .connect(alice)
                          .returnProduct(firstProduct)
                  ).to.be.emit(limeTechStore, "LogTechnoProductReturned");
              });
              it("Alice tries to return product which she is not owning", async function () {
                  const allProducts =
                      await limeTechStore.getAllAvailableProductIds();
                  const firstProduct = allProducts[0];
                  expect(
                      limeTechStore.connect(alice).returnProduct(firstProduct)
                  ).to.be.revertedWithCustomError(
                      limeTechStore,
                      "LimeTechStore__NotBoughtProductFromUser"
                  );
              });
          });
          describe("Retrieve all users by a given product", function () {
              it("Retrieve first product users", async function () {
                  const allProducts =
                      await limeTechStore.getAllAvailableProductIds();
                  const firstProduct = allProducts[0];
                  const users = await limeTechStore.getProductUsers(
                      firstProduct
                  );
                  expect(users).to.contain(alice.address);
              });
          });

          describe("Expire warranty of product", function () {
              it("Carol can't return product with expired warranty", async function () {
                  await network.provider.send("hardhat_mine", ["0x100"]); // mine 256 blocks
                  const allProducts =
                      await limeTechStore.getAllAvailableProductIds();
                  const firstProduct = allProducts[0];
                  expect(
                      limeTechStore.connect(carol).returnProduct(firstProduct)
                  ).to.be.revertedWithCustomError(
                      limeTechStore,
                      "LimeTechStore__ExpiredWarrantyProduct"
                  );
              });
          });
      });
