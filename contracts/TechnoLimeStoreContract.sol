// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

error LimeStore__BlankField();
error LimeStore__OutOfStock();
error LimeStore__AlreadyOwnedProduct();
error LimeStore__ExpiredWarrantyProduct();
error LimeStore__NotBoughtProductFromUser();

contract TechnoLimeStoreContract is Ownable {
    struct Product {
        string name;
        uint32 quantity;
    }
    bytes32[] public productIds;

    mapping(bytes32 => Product) public productLedger;
    mapping(string => bool) private isProductNameEntered;
    mapping(string => bytes32) private isProductNameId;
    mapping(bytes32 => uint256) public productValidity;
    mapping(address => mapping(bytes32 => bool))
        private isProductCurrentlyOwned;

    event LogTechnoProductAdded(string indexed name, uint32 indexed quantity);
    event LogTechnoProductBought(bytes32 uuid, uint256 indexed datePurchased);
    event LogTechnoProductReturned(bytes32 uuid);

    /**
     * @dev Function for add new product permissioned only to admin/owner of the contract.
     * When product name is already present and it is provided uuid the quantity only increases.
     */
    function addNewProduct(string calldata _name, uint32 _quantity)
        external
        onlyOwner
    {
        if (bytes(_name).length == 0) {
            revert LimeStore__BlankField();
        }
        if (isProductNameEntered[_name] == false) {
            Product memory newProduct = Product(_name, _quantity);
            bytes32 uuid = keccak256(abi.encodePacked(_name));

            productLedger[uuid] = newProduct;
            productIds.push(uuid);
            isProductNameId[_name] = uuid;
            isProductNameEntered[_name] = true;
        } else {
            bytes32 savedUuid = isProductNameId[_name];
            Product memory storedProduct = productLedger[savedUuid];
            storedProduct.quantity += _quantity;
            productLedger[savedUuid] = storedProduct;
        }
        emit LogTechnoProductAdded(_name, _quantity);
    }

    function buyProduct(bytes32 uuid) external {
        if (isProductCurrentlyOwned[msg.sender][uuid] == true) {
            revert LimeStore__AlreadyOwnedProduct();
        }
        Product storage product = productLedger[uuid];
        if ((product.quantity - 1) < 1) {
            revert LimeStore__OutOfStock();
        }
        productValidity[uuid] = block.number;
        isProductCurrentlyOwned[msg.sender][uuid] = true;
        emit LogTechnoProductBought(uuid, productValidity[uuid]);
    }

    function returnProduct(bytes32 uuid) external {
        if (isProductCurrentlyOwned[msg.sender][uuid] == false) {
            revert LimeStore__NotBoughtProductFromUser();
        }
        Product storage product = productLedger[uuid];
        if ((block.number - productValidity[uuid]) > 100) {
            revert LimeStore__ExpiredWarrantyProduct();
        }
        // deploy attack to manipulate block.number and modify data to test it
        if ((product.quantity - 1) < 1) {
            revert LimeStore__OutOfStock();
        }
        isProductCurrentlyOwned[msg.sender][uuid] = false;
        emit LogTechnoProductReturned(uuid);
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
        return productIds;
    }

    function getProductDetail(bytes32 _id)
        public
        view
        returns (string memory, uint32, uint)
    {
        return (productLedger[_id].name, productLedger[_id].quantity, productValidity[_id]);
    }

    function isBookAlreadyOwned(bytes32 uid) public view returns (bool) {
        return isProductCurrentlyOwned[msg.sender][uid];
    }
}
