// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

error LimeTechStore__BlankField();
error LimeTechStore__IllegalQuantityInput();
error LimeTechStore__OutOfStock();
error LimeTechStore__AlreadyOwnedProduct();
error LimeTechStore__ExpiredWarrantyProduct();
error LimeTechStore__NotBoughtProductFromUser();

contract TechnoLimeStoreContract is Ownable {
    struct Product {
        string name;
        uint32 quantity;
    }
    bytes32[] public productIds;

    mapping(bytes32 => Product) public productLedger;
    // productName => id relation
    mapping(string => bytes32) private isProductNameId;
    // productId => block.number product validity date timespan
    mapping(address => mapping(bytes32 => uint256)) public productValidity;
    // msg.sender => id relation if product is owned
    mapping(address => mapping(bytes32 => bool))
        private isProductCurrentlyOwned;

    event LogTechnoProductAdded(string indexed name, uint32 indexed quantity);
    event LogTechnoProductBought(
        bytes32 indexed productId,
        uint256 indexed datePurchased,
        address indexed user
    );
    event LogTechnoProductReturned(bytes32 productId);

    /**
     * @dev Function for add new product permissioned only to admin/owner of the contract.
     * When product name is already present and it is provided productId the quantity only increases.
     */
    function addNewProduct(string calldata _name, uint32 _quantity)
        external
        onlyOwner
    {
        if (bytes(_name).length == 0) {
            revert LimeTechStore__BlankField();
        }
        if (_quantity <= 0) {
            revert LimeTechStore__IllegalQuantityInput();
        }
        if (isProductNameId[_name] == 0) {
            Product memory newProduct = Product(_name, _quantity);
            bytes32 productId = keccak256(abi.encodePacked(_name, _quantity));
            productLedger[productId] = newProduct;
            productIds.push(productId);
            isProductNameId[_name] = productId;
            emit LogTechnoProductAdded(_name, _quantity);
        } else {
            bytes32 savedproductId = isProductNameId[_name];
            Product memory storedProduct = productLedger[savedproductId];
            storedProduct.quantity += _quantity;
            productLedger[savedproductId] = storedProduct;
        }
    }

    function buyProduct(bytes32 productId) external {
        if (isProductCurrentlyOwned[msg.sender][productId] == true) {
            revert LimeTechStore__AlreadyOwnedProduct();
        }
        Product storage product = productLedger[productId];
        if (product.quantity < 1) {
            revert LimeTechStore__OutOfStock();
        }
        productValidity[msg.sender][productId] = block.number;
        isProductCurrentlyOwned[msg.sender][productId] = true;
        product.quantity -= 1;
        emit LogTechnoProductBought(
            productId,
            productValidity[msg.sender][productId],
            msg.sender
        );
    }

    function returnProduct(bytes32 productId) external {
        if (isProductCurrentlyOwned[msg.sender][productId] == false) {
            revert LimeTechStore__NotBoughtProductFromUser();
        }
        if ((block.number - productValidity[msg.sender][productId]) > 100) {
            revert LimeTechStore__ExpiredWarrantyProduct();
        }
        Product storage product = productLedger[productId];
        product.quantity += 1;
        isProductCurrentlyOwned[msg.sender][productId] = false;
        emit LogTechnoProductReturned(productId);
    }

    /**
     * @dev This is the function for get all ids for the input product.
     * It is a better to have getting of ids and then retrieving all data by id
     * insead of iterating with foreach in the smart contract
     */
    function getAllAvailableProductIds()
        external
        view
        returns (bytes32[] memory)
    {
        return productIds;
    }

    function getProductDetail(bytes32 _id)
        external
        view
        returns (string memory, uint32)
    {
        return (productLedger[_id].name, productLedger[_id].quantity);
    }

    function getProductValidity(bytes32 uid) external view returns (uint256) {
        return productValidity[msg.sender][uid];
    }

    function isProductAlreadyOwned(bytes32 uid) external view returns (bool) {
        return isProductCurrentlyOwned[msg.sender][uid];
    }
}
