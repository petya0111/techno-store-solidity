// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

error LimeStore__BlankField();
error LimeStore__OutOfStock();
error LimeStore__AlreadyOwnedProduct();
error LimeStore__NotBoughtProductFromUser();

contract TechnoLimeStoreContract is Ownable {
    struct Product {
        string name;
        uint32 quantity;
        uint256 datePurchased;
    }
    bytes32[] public productIds;

    mapping(bytes32 => Product) public productLedger;
    mapping(string => bool) private isProductNameEntered;
    mapping(address => mapping(bytes32 => bool))
        private isProductCurrentlyOwned;

    /**
     * @dev Function for add new product permissioned only to admin/owner of the contract.
     * When product name is already present and it is provided uuid the quantity only increases.
     */
    function addNewProduct(
        string calldata _name,
        uint32 _quantity,
        bytes32 inputUuid
    ) external onlyOwner {
        if (bytes(_name).length == 0) {
            revert LimeStore__BlankField();
        }
        if (isProductNameEntered(_name) == false) {
            Product memory newProduct = new Product(_name, _quantity);
            if (inputUuid.length == 0) {
                inputUuid = keccak256(abi.encodePacked(_name));
            }
            productIds.push(inputUuid);
            isProductNameEntered[_name] = true;
        } else {
            Product storedProduct = productLedger[inputUuid];
            storedProduct.quantity += quantity;
        }
    }

    function buyProduct(bytes32 uuid) external {
        if (isProductCurrentlyOwned[msg.sender][uuid] == true) {
            revert LimeStore__AlreadyOwnedProduct();
        }
        Product storage product = productLedger[_id];
        if ((product.quantity - 1) < 1) {
            revert LimeStore__OutOfStock();
        }
        product.datePurchased = block.timestamp;
        isProductCurrentlyOwned[msg.sender][uuid] = true;
    }

    function returnProduct(bytes32 uuid) external {
        if (isProductCurrentlyOwned[msg.sender][uuid] == false) {
            revert LimeStore__NotBoughtProductFromUser();
        }
        // blocktime check
        Product storage product = productLedger[_id];
        if ((product.quantity - 1) < 1) {
            revert LimeStore__OutOfStock();
        }
    }

    /**
     * @dev This is the function for get all ids for the input product.
     * It is a better to have getting of ids and then retrieving all data by id
     * insead of iterating with foreach in the smart contract
     */
    function getAllAvailableProductIds()
        public
        view
        returns (bytes32[] memory)
    {
        // foreach with check for if available quantity question?
        return productIds;
    }

    function getProductDetail(bytes32 _id)
        public
        view
        returns (
            string memory,
            uint16,
            bytes32
        )
    {
        return (
            productIds[_id].name,
            productIds[_id].numberOfCopies,
            productIds[_id].datePurchased
        );
    }

    function isBookAlreadyOwned(bytes32 uid) public view returns (bool) {
        return isProductCurrentlyOwned[msg.sender][uid];
    }
}
