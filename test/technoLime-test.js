const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { developmentChains } = require("../hardhat.config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("TechnoLimeStore", function () {
          let limeTechStore;
          let admin;
          let alice;
          let bob;
          let carol;
          let minPrice = ethers.utils.parseEther("0.01");
          let increasedPrice = ethers.utils.parseEther("0.02");
          let productQuantity = 50;
          let firstProduct = 1;
          let secondProduct = 2;
          let onePiece = 1;
          let invalidProductId = 9999;
          const ownableError = "Ownable: caller is not the owner";
          const productIdNotFound = "ProductIDNotFound";
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
                  await expect(
                      limeTechStore
                          .connect(alice)
                          .addNewProduct("name", 1, minPrice)
                  ).to.be.revertedWith(ownableError);
              });

              it("Should throw if name of the product is blank", async function () {
                  await expect(
                      limeTechStore.addNewProduct("", productQuantity, minPrice)
                  ).to.be.revertedWithCustomError(limeTechStore, "BlankField");
              });
              it("Should throw if quantity is zero", async function () {
                  await expect(
                      limeTechStore.addNewProduct("AirPods", 0, minPrice)
                  ).to.be.revertedWithCustomError(
                      limeTechStore,
                      "IllegalQuantityInput"
                  );
              });

              it("Should be created a new book from administrator and emit LogBookAdded", async function () {
                  const productName = "MacBook Pro 14";
                  expect(
                      await limeTechStore
                          .connect(admin)
                          .addNewProduct(productName, productQuantity, minPrice)
                  )
                      .to.emit(limeTechStore, "TechnoProductAdded")
                      .withArgs(productName, productQuantity);
                  await expect(
                      limeTechStore.addNewProduct(
                          productName,
                          productQuantity,
                          minPrice
                      )
                  ).to.be.revertedWithCustomError(
                      limeTechStore,
                      "ProductAlreadyExisting"
                  );
                  const getFirstProductDetail =
                      await limeTechStore.getProductDetail(firstProduct);
                  expect(getFirstProductDetail[0]).to.be.equal(productName);
                  expect(getFirstProductDetail[1]).to.be.equal(productQuantity);
              });

              it("Should be added product with quantity of 1 piece", async function () {
                  expect(
                      await limeTechStore
                          .connect(admin)
                          .addNewProduct("Logi Keyboard MX KEYS", 1, minPrice)
                  );

                  const getFirstProductDetail =
                      await limeTechStore.getProductDetail(secondProduct);
                  expect(getFirstProductDetail[1]).to.be.equal(1);
              });
          });
          describe("Change product quantity", function () {
              it("Invalid product id input", async function () {
                  await expect(
                      limeTechStore.increaseProductQuantity(invalidProductId, 5)
                  ).to.be.revertedWithCustomError(
                      limeTechStore,
                      productIdNotFound
                  );
                  await expect(
                      limeTechStore
                          .connect(admin)
                          .decreaseProductQuantity(invalidProductId, 5)
                  ).to.be.revertedWithCustomError(
                      limeTechStore,
                      productIdNotFound
                  );
                  await expect(
                      limeTechStore
                          .connect(admin)
                          .decreaseProductQuantity(firstProduct, 100)
                  ).to.be.revertedWithCustomError(
                      limeTechStore,
                      "IllegalQuantityInput"
                  );
                  await expect(
                      limeTechStore.changePrice(invalidProductId, 5)
                  ).to.be.revertedWithCustomError(
                      limeTechStore,
                      productIdNotFound
                  );
                  await expect(
                      limeTechStore.connect(admin).changePrice(1, 0)
                  ).to.be.revertedWithCustomError(
                      limeTechStore,
                      "IllegalPriceInput"
                  );
              });
              it("User has no permission to edit the quantity and price", async function () {
                  await expect(
                      limeTechStore
                          .connect(alice)
                          .increaseProductQuantity(firstProduct, 5)
                  ).to.be.revertedWith(ownableError);
                  await expect(
                      limeTechStore
                          .connect(alice)
                          .decreaseProductQuantity(firstProduct, 5)
                  ).to.be.revertedWith(ownableError);
                  await expect(
                      limeTechStore
                          .connect(alice)
                          .changePrice(firstProduct, minPrice)
                  ).to.be.revertedWith(ownableError);
              });
              it("First product quantity is increased", async function () {
                  expect(
                      await limeTechStore.increaseProductQuantity(
                          firstProduct,
                          5
                      )
                  ).to.emit(limeTechStore, "TechnoProductQuantityIncrease");
              });
              it("First product quantity is decreased", async function () {
                  expect(
                      await limeTechStore.decreaseProductQuantity(
                          firstProduct,
                          5
                      )
                  ).to.emit(limeTechStore, "TechnoProductQuantityDecrease");
              });
              it("First product quantity is decreased", async function () {
                  expect(
                      await limeTechStore
                          .connect(admin)
                          .increaseProductQuantity(firstProduct, 1)
                  ).to.emit(limeTechStore, "TechnoProductQuantityDecrease");
              });
              it("First product price is changed", async function () {
                  expect(
                      await limeTechStore.changePrice(
                          firstProduct,
                          ethers.utils.parseEther("0.02")
                      )
                  ).to.emit(limeTechStore, "TechnoProductChangedPrice");
              });
          });
          describe("Buy techno product", function () {
              it("Alice buys first tech product", async function () {
                  expect(
                      await limeTechStore
                          .connect(alice)
                          .buyProduct(firstProduct, onePiece, {
                              value: increasedPrice,
                          })
                  ).to.emit(limeTechStore, "TechnoProductBought");
              });
              it("Admin tries to remove product which is alredy bought", async function () {
                  await expect(
                      limeTechStore.connect(admin).removeProduct(firstProduct)
                  ).to.be.revertedWithCustomError(
                      limeTechStore,
                      "CannotRemoveProductBoughtFromUser"
                  );
                  await expect(
                      limeTechStore.connect(alice).removeProduct(firstProduct)
                  ).to.be.revertedWith(ownableError);
                  await expect(
                      limeTechStore
                          .connect(admin)
                          .removeProduct(invalidProductId)
                  ).to.be.revertedWithCustomError(
                      limeTechStore,
                      productIdNotFound
                  );
              });
              it("Alice buys second tech product", async function () {
                  expect(
                      await limeTechStore
                          .connect(alice)
                          .buyProduct(secondProduct, onePiece, {
                              value: minPrice,
                          })
                  ).to.emit(limeTechStore, "TechnoProductBought");
              });
              it("Carol buys first tech product", async function () {
                  await expect(
                      limeTechStore
                          .connect(carol)
                          .buyProduct(invalidProductId, onePiece, {
                              value: increasedPrice,
                          })
                  ).to.be.revertedWithCustomError(
                      limeTechStore,
                      productIdNotFound
                  );
                  await expect(
                      limeTechStore
                          .connect(carol)
                          .buyProduct(firstProduct, onePiece, {
                              value: ethers.utils.parseEther("0.03"),
                          })
                  ).to.be.revertedWithCustomError(
                      limeTechStore,
                      "InsuffictientAmountPrice"
                  );
                  expect(
                      await limeTechStore
                          .connect(carol)
                          .buyProduct(firstProduct, onePiece, {
                              value: increasedPrice,
                          })
                  ).to.emit(limeTechStore, "TechnoProductBought");
              });
              it("Alice tries to buy a product which she already own", async function () {
                  expect(
                      await limeTechStore
                          .connect(alice)
                          .ownedQuantityFromUser(secondProduct)
                  ).to.equal(onePiece);
                  await expect(
                      limeTechStore
                          .connect(alice)
                          .buyProduct(secondProduct, onePiece, {
                              value: minPrice,
                          })
                  ).to.be.revertedWithCustomError(
                      limeTechStore,
                      "AlreadyOwnedProduct"
                  );
              });
              it("Bob tries to buy a product which is out of stock", async function () {
                  await expect(
                      limeTechStore
                          .connect(bob)
                          .buyProduct(secondProduct, onePiece, {
                              value: minPrice,
                          })
                  ).to.be.revertedWithCustomError(limeTechStore, "OutOfStock");
              });
          });
          describe("Return techno product", function () {
              it("Alice should return first product", async function () {
                  await expect(
                      limeTechStore
                          .connect(alice)
                          .returnProduct(invalidProductId, onePiece, {
                              value: increasedPrice,
                          })
                  ).to.be.revertedWithCustomError(
                      limeTechStore,
                      productIdNotFound
                  );
                  expect(
                      await limeTechStore
                          .connect(alice)
                          .returnProduct(firstProduct, onePiece)
                  ).to.be.emit(limeTechStore, "TechnoProductReturned");
              });
              it("Alice tries to return product which she is not owning", async function () {
                  await expect(
                      limeTechStore
                          .connect(alice)
                          .returnProduct(firstProduct, onePiece)
                  ).to.be.revertedWithCustomError(
                      limeTechStore,
                      "NotBoughtProductFromUser"
                  );
              });
          });
          describe("New product is added after a long period of time", function () {
              it("Added product in a long period of time", async function () {
                  await network.provider.send("hardhat_mine", ["0x100"]); // mine 256 blocks
                  expect(
                      await limeTechStore
                          .connect(admin)
                          .addNewProduct(
                              "Full HD LG Monitor",
                              productQuantity,
                              minPrice
                          )
                  ).to.emit(limeTechStore, "TechnoProductAdded");
                  expect(
                    await limeTechStore
                        .connect(admin)
                        .addNewProduct("iWatch 8", 20, minPrice)
                ).to.emit(limeTechStore, "TechnoProductAdded");
                  expect(await limeTechStore.removeProduct(3)).to.emit(
                      limeTechStore,
                      "TechnoProductRemoved"
                  );
              });
          });

          describe("Expire warranty of product", function () {
              it("Carol can't return product with expired warranty, because long period of time has passed", async function () {
                  let blockNumberFirstBuy =
                      await limeTechStore.getProductValidity(firstProduct);
                  let latestBlockNumber = await (
                      await ethers.provider.getBlock("latest")
                  ).number;
                  expect(
                      latestBlockNumber - blockNumberFirstBuy
                  ).to.be.greaterThan(100);
                  await expect(
                      limeTechStore
                          .connect(carol)
                          .returnProduct(firstProduct, onePiece)
                  ).to.be.revertedWithCustomError(
                      limeTechStore,
                      "ExpiredWarrantyProduct"
                  );
              });
          });
          describe("Admin withdraws its funds", function () {
              it("Admin should withdraw funds from the product", async function () {
                  await expect(
                      limeTechStore.connect(alice).withdrawPayment(firstProduct)
                  ).to.be.revertedWith(ownableError);
                  await expect(
                      limeTechStore
                          .connect(admin)
                          .withdrawPayment(invalidProductId)
                  ).to.be.revertedWithCustomError(
                      limeTechStore,
                      productIdNotFound
                  );
                  expect(
                      await limeTechStore
                          .connect(admin)
                          .withdrawPayment(firstProduct)
                  ).to.emit(limeTechStore, "PaymentWithdrawn");
              });
          });
          describe("Present all products", function () {
              it("Clients are able to see all available products", async function () {
                  let printArray = [];
                  const count = await limeTechStore.getProductCount();
                  const numberOfProducts = Number(count);
                  for (let i = 1; i <= numberOfProducts; i++) {
                      const p = await limeTechStore.getProductDetail(i);
                      let quantityOfProduct = p[1];
                      if (quantityOfProduct > 0) {
                          printArray.push({
                              name: p[0],
                              quantity: quantityOfProduct,
                              price: ethers.utils.formatEther(p[2]),
                          });
                      }
                  }
                  console.table(printArray);
              });
              it("Users can see all buyers by querying and filtering events", async function () {
                  let latestBlockNumber = await (
                      await ethers.provider.getBlock("latest")
                  ).number;
                  const events = await limeTechStore.queryFilter(
                      "*",
                      0,
                      latestBlockNumber
                  );
                  let printArray = [];
                  const count = await limeTechStore.getProductCount();
                  const numberOfProducts = Number(count);

                  for (let i = 1; i <= numberOfProducts; i++) {
                      const p = await limeTechStore.getProductDetail(i);
                      let filteredBoughtUsers = events
                          .filter(
                              (e) =>
                                  e.event == "TechnoProductBought" &&
                                  e.args[0] == i
                          )
                          .map((e) => e.args[2]);
                      if (p[0] != "") {
                          printArray.push({
                              name: p[0],
                              users: filteredBoughtUsers,
                          });
                      }
                  }
                  console.table(printArray);
              });
          });
      });
